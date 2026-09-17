import { defineModule } from "../../dsl.js";

export default defineModule(import.meta.url, {
  slug: "special-members",
  title: "Copies, moves and the rule of five",
  blurb: "Copy construction versus assignment and the memberwise defaults, destructors and the rule of three, copy-and-swap, rvalue references and std::move, the moved-from state and noexcept, the generation table behind the rule of five and the rule of zero, and value categories with guaranteed elision.",
  icon: "layers",
  overview: `C++ objects are values: \`Probe b = a;\` makes a second, independent object, and when either one dies it cleans up after itself at a moment the language defines exactly. That is what lets a class own a heap block, a file or a lock — and it means every class must answer a question a garbage-collected language never asks: what does it mean to copy one of these, to move one, to destroy one? The compiler answers memberwise, and its answer is right for a class built from \`std::string\`, \`std::vector\` and \`std::unique_ptr\` and catastrophically wrong for a class that owns a raw pointer. This module is where you learn to tell the two apart and to write the five special member functions when — and only when — a class needs them.

The lessons build the picture one function at a time. Copy semantics separates copy construction from copy assignment, shows the memberwise default and the shallow copy it produces for an owning pointer, and settles self-assignment and \`= delete\`. Destructors and the rule of three fixes the order things die, writes an owning buffer with deep copy and a self-safe assignment, and rebuilds that assignment with copy-and-swap. Move semantics explains rvalue references, why \`std::move\` moves nothing, the moved-from state that is valid but unspecified, and why \`std::vector\` copies your elements unless the move is \`noexcept\`. The rule of five and the rule of zero lays out the generation table — declaring a destructor switches the moves off — and the design rule that follows: own resources through members and declare nothing. Value categories and elision names lvalue, prvalue and xvalue in plain terms, states the C++17 guarantee that a prvalue is built in place, and settles \`return local;\` against \`return std::move(local);\`.

The exercises are built around one tool: classes that print their own \`copy\`, \`move\` and \`destroy\` events, so that every rule in the text becomes a line you can predict and then watch. Only operations whose counts the standard fixes are ever judged — guaranteed elision, explicit \`std::move\`, \`std::swap\`, and \`std::vector\` after a \`reserve()\` — never a named return value optimisation or a reallocation. You will trace identity against value through a copy-assignment loop, watch a struct copy its members in order, write an owning buffer with the rule of three and again with copy-and-swap, extend it to the rule of five with a moved-from state of \`size=0\`, observe what a moved-from \`std::vector\` guarantees, build a rule-of-zero grid on \`std::unique_ptr\`, test the generation table against four classes, trace guaranteed elision and the implicit move of a returned parameter, and sink values into a container three ways. The checkpoint adds a command-driven stack with all five members, a longer trace to predict, and two shelves passing books through \`std::unique_ptr\` with no special members at all.`,
  lessons: [
    {
      slug: "copy-semantics",
      file: "01-copy-semantics.md",
      exercises: [
        {
          title: "Identity and value",
          prompt: `Complete the instrumented \`Probe\` class so that every copy operation reports itself, then drive it through a loop of assignments. Each object gets an id from a static counter when it is constructed (its *identity*) and carries an \`int\` (its *value*). The events are:

- \`construct #<id>=<value>\` — already written;
- \`copy #<id> from #<source id>\` — the copy constructor: a new id, the source's value;
- \`copy-assign #<id> from #<source id>\` — the copy assignment: the same id, the source's value; it must return \`*this\`;
- \`self-assign #<id>\` — the copy assignment when the source is this very object; nothing else happens;
- \`destroy #<id>\` — already written.

Read an integer \`n\` and then \`n\` integers. Construct \`current\` from the first. For each remaining value, in its own block, construct a \`Probe\` from it and copy-assign it to \`current\`, so the temporary dies at the end of the block. After the loop, assign \`current\` to itself through a reference (\`Probe& same = current; current = same;\`), copy-construct \`snapshot\` from \`current\`, and print \`current=<value> snapshot=<value>\`. The destructors then run in reverse order.

**Input:** \`n\` (at least 1), then \`n\` integers.
**Output:** the event trace, the values line, and the two final destroy lines.

\`\`\`text
3
5 8 13
\`\`\`
prints
\`\`\`text
construct #1=5
construct #2=8
copy-assign #1 from #2
destroy #2
construct #3=13
copy-assign #1 from #3
destroy #3
self-assign #1
copy #4 from #1
current=13 snapshot=13
destroy #4
destroy #1
\`\`\``,
          starter: String.raw`#include <iostream>

struct Probe {
    static inline int next = 1;
    int id;
    int value;

    explicit Probe(int v) : id(next++), value(v) {
        std::cout << "construct #" << id << '=' << value << '\n';
    }
    // TODO: copy constructor — new id, the source's value, prints "copy #<id> from #<source id>"
    // TODO: copy assignment — "self-assign #<id>" when other is this object,
    //       otherwise take the value and print "copy-assign #<id> from #<source id>"
    ~Probe() {
        std::cout << "destroy #" << id << '\n';
    }
};

int main() {
    int n;
    std::cin >> n;
    int first;
    std::cin >> first;
    Probe current(first);
    for (int i = 1; i < n; ++i) {
        int v;
        std::cin >> v;
        // TODO: construct a Probe from v and copy-assign it to current
    }
    // TODO: self-assign through a reference, copy-construct snapshot, print the values
    return 0;
}
`,
          solution: String.raw`#include <iostream>

struct Probe {
    static inline int next = 1;
    int id;
    int value;

    explicit Probe(int v) : id(next++), value(v) {
        std::cout << "construct #" << id << '=' << value << '\n';
    }
    Probe(const Probe& other) : id(next++), value(other.value) {
        std::cout << "copy #" << id << " from #" << other.id << '\n';
    }
    Probe& operator=(const Probe& other) {
        if (this == &other) {
            std::cout << "self-assign #" << id << '\n';
            return *this;
        }
        value = other.value;
        std::cout << "copy-assign #" << id << " from #" << other.id << '\n';
        return *this;
    }
    ~Probe() {
        std::cout << "destroy #" << id << '\n';
    }
};

int main() {
    int n;
    std::cin >> n;
    int first;
    std::cin >> first;
    Probe current(first);
    for (int i = 1; i < n; ++i) {
        int v;
        std::cin >> v;
        Probe next(v);
        current = next;
    }
    Probe& same = current;
    current = same;
    Probe snapshot = current;
    std::cout << "current=" << current.value << " snapshot=" << snapshot.value << '\n';
    return 0;
}
`,
          hints: [
            "The copy constructor's initialiser list is id(next++), value(other.value) — the id is new, the value is borrowed.",
            "Compare addresses, not values: this == &other is the only test for self-assignment.",
            "A Probe declared inside the loop body is destroyed at the closing brace of each iteration, before the next construct.",
          ],
          cases: [
            { stdin: "3\n5 8 13\n", expected: "construct #1=5\nconstruct #2=8\ncopy-assign #1 from #2\ndestroy #2\nconstruct #3=13\ncopy-assign #1 from #3\ndestroy #3\nself-assign #1\ncopy #4 from #1\ncurrent=13 snapshot=13\ndestroy #4\ndestroy #1\n" },
            { stdin: "1\n42\n", expected: "construct #1=42\nself-assign #1\ncopy #2 from #1\ncurrent=42 snapshot=42\ndestroy #2\ndestroy #1\n" },
            { stdin: "2\n-4 0\n", expected: "construct #1=-4\nconstruct #2=0\ncopy-assign #1 from #2\ndestroy #2\nself-assign #1\ncopy #3 from #1\ncurrent=0 snapshot=0\ndestroy #3\ndestroy #1\n", hidden: true },
            { stdin: "4\n1 2 3 4\n", expected: "construct #1=1\nconstruct #2=2\ncopy-assign #1 from #2\ndestroy #2\nconstruct #3=3\ncopy-assign #1 from #3\ndestroy #3\nconstruct #4=4\ncopy-assign #1 from #4\ndestroy #4\nself-assign #1\ncopy #5 from #1\ncurrent=4 snapshot=4\ndestroy #5\ndestroy #1\n", hidden: true },
          ],
        },
        {
          title: "Memberwise, in order",
          prompt: `The \`Probe\` class is complete this time. Declare \`struct Segment { Probe start; Probe end; };\` — two members and **no** special member functions — and write \`int length(const Segment&)\`, which returns \`end.value - start.value\`. Then predict the trace of this driver before you run it:

1. Read four integers \`s1 e1 s2 e2\`.
2. \`Segment a{Probe(s1), Probe(e1)};\` then \`Segment b{Probe(s2), Probe(e2)};\` — each member is built in place from a prvalue, so only \`construct\` events appear.
3. \`Segment c = a;\` — the generated copy constructor copies the members in declaration order.
4. \`c.end = b.end;\` — assigns one member.
5. Assign \`b\` to itself through a reference (\`Segment& same = b; b = same;\`) — the generated assignment does not check for self-assignment; it assigns each member, and each \`Probe\` reports what it saw.
6. Print \`a=<length> b=<length> c=<length>\`.
7. The three segments die in reverse order, each destroying \`end\` before \`start\`.

**Input:** one line, \`s1 e1 s2 e2\`.
**Output:** the trace, the lengths line, and six destroy lines.

\`\`\`text
0 10 3 7
\`\`\`
prints
\`\`\`text
construct #1=0
construct #2=10
construct #3=3
construct #4=7
copy #5 from #1
copy #6 from #2
copy-assign #6 from #4
self-assign #3
self-assign #4
a=10 b=4 c=7
destroy #6
destroy #5
destroy #4
destroy #3
destroy #2
destroy #1
\`\`\``,
          starter: String.raw`#include <iostream>

struct Probe {
    static inline int next = 1;
    int id;
    int value;

    explicit Probe(int v) : id(next++), value(v) {
        std::cout << "construct #" << id << '=' << value << '\n';
    }
    Probe(const Probe& other) : id(next++), value(other.value) {
        std::cout << "copy #" << id << " from #" << other.id << '\n';
    }
    Probe& operator=(const Probe& other) {
        if (this == &other) {
            std::cout << "self-assign #" << id << '\n';
            return *this;
        }
        value = other.value;
        std::cout << "copy-assign #" << id << " from #" << other.id << '\n';
        return *this;
    }
    ~Probe() {
        std::cout << "destroy #" << id << '\n';
    }
};

// TODO: struct Segment with Probe members start and end, and no special member functions
// TODO: int length(const Segment& s)

int main() {
    int s1, e1, s2, e2;
    std::cin >> s1 >> e1 >> s2 >> e2;
    // TODO: steps 2 to 6 of the prompt
    return 0;
}
`,
          solution: String.raw`#include <iostream>

struct Probe {
    static inline int next = 1;
    int id;
    int value;

    explicit Probe(int v) : id(next++), value(v) {
        std::cout << "construct #" << id << '=' << value << '\n';
    }
    Probe(const Probe& other) : id(next++), value(other.value) {
        std::cout << "copy #" << id << " from #" << other.id << '\n';
    }
    Probe& operator=(const Probe& other) {
        if (this == &other) {
            std::cout << "self-assign #" << id << '\n';
            return *this;
        }
        value = other.value;
        std::cout << "copy-assign #" << id << " from #" << other.id << '\n';
        return *this;
    }
    ~Probe() {
        std::cout << "destroy #" << id << '\n';
    }
};

struct Segment {
    Probe start;
    Probe end;
};

int length(const Segment& s) {
    return s.end.value - s.start.value;
}

int main() {
    int s1, e1, s2, e2;
    std::cin >> s1 >> e1 >> s2 >> e2;
    Segment a{Probe(s1), Probe(e1)};
    Segment b{Probe(s2), Probe(e2)};
    Segment c = a;
    c.end = b.end;
    Segment& same = b;
    b = same;
    std::cout << "a=" << length(a) << " b=" << length(b) << " c=" << length(c) << '\n';
    return 0;
}
`,
          hints: [
            "Segment needs nothing but the two members; the compiler writes its copy constructor, copy assignment and destructor memberwise.",
            "Segment a{Probe(s1), Probe(e1)} builds each member directly from the prvalue — no copy, no move (lesson 5 explains why it is guaranteed).",
            "Members are copied and assigned in declaration order and destroyed in reverse: end before start.",
          ],
          cases: [
            { stdin: "0 10 3 7\n", expected: "construct #1=0\nconstruct #2=10\nconstruct #3=3\nconstruct #4=7\ncopy #5 from #1\ncopy #6 from #2\ncopy-assign #6 from #4\nself-assign #3\nself-assign #4\na=10 b=4 c=7\ndestroy #6\ndestroy #5\ndestroy #4\ndestroy #3\ndestroy #2\ndestroy #1\n" },
            { stdin: "5 5 -2 2\n", expected: "construct #1=5\nconstruct #2=5\nconstruct #3=-2\nconstruct #4=2\ncopy #5 from #1\ncopy #6 from #2\ncopy-assign #6 from #4\nself-assign #3\nself-assign #4\na=0 b=4 c=-3\ndestroy #6\ndestroy #5\ndestroy #4\ndestroy #3\ndestroy #2\ndestroy #1\n" },
            { stdin: "100 0 0 100\n", expected: "construct #1=100\nconstruct #2=0\nconstruct #3=0\nconstruct #4=100\ncopy #5 from #1\ncopy #6 from #2\ncopy-assign #6 from #4\nself-assign #3\nself-assign #4\na=-100 b=100 c=0\ndestroy #6\ndestroy #5\ndestroy #4\ndestroy #3\ndestroy #2\ndestroy #1\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "```cpp\nProbe a(1);\nProbe b = a;\nb = a;\n```\nHow many copy constructions and copy assignments does this perform?",
          options: ["One copy construction and one copy assignment", "Two copy constructions and no assignment", "No copy construction and two assignments", "One copy construction; the third line is a no-op because `b` already equals `a`"],
          answer: 0,
          explanation: "`Probe b = a;` is initialisation — `b` does not exist yet, so the copy constructor runs. `b = a;` replaces the value of an existing object, which is the copy assignment operator. Equality of values never suppresses an assignment.",
        },
        {
          prompt: "Which declaration is a copy constructor?",
          options: ["`Probe(Probe other);`", "`Probe(const Probe& other);`", "`Probe& operator=(const Probe& other);`", "`Probe(Probe* other);`"],
          answer: 1,
          explanation: "The copy constructor takes the source by reference to `const`. A by-value parameter would need a copy to be made before the copy constructor could run, which the compiler rejects; `operator=` is the assignment; a pointer parameter is an ordinary constructor.",
        },
        {
          prompt: "```cpp\nstruct Employee {\n    std::string name;\n    std::vector<int> ratings;\n};\nEmployee e2 = e1;\ne2.ratings.push_back(1);\n```\nWhat happens to `e1`?",
          options: ["Nothing — the generated copy copies each member, and `std::vector` copies its own elements", "`e1.ratings` also gains the element: the vector's buffer is shared", "Compile error: a struct with a `std::vector` member has no copy constructor", "Undefined behaviour when both objects are destroyed"],
          answer: 0,
          explanation: "The memberwise copy calls `std::string`'s and `std::vector`'s copy constructors, each of which allocates its own storage. Sharing happens only when a member is a raw pointer that is copied as a pointer.",
        },
        {
          prompt: "A class holds `int* data` allocated with `new[]` and deletes it in its destructor, but declares no copy operations. What does `Buffer b = a;` lead to?",
          options: ["A deep copy, because the destructor tells the compiler the class owns the block", "A compile error: the class is non-copyable", "Both objects point at one block; the second destructor deletes it again — undefined behaviour", "A shallow copy that is safe as long as `b` is destroyed first"],
          answer: 2,
          explanation: "The generated copy constructor copies the pointer value. Two objects now own one block, writes through either are visible in both, and the second `delete[]` is undefined behaviour regardless of destruction order.",
        },
        {
          prompt: "What is the purpose of `if (this == &other) return *this;` at the top of a copy assignment operator?",
          options: ["To make the assignment faster for all callers", "To stop the operator from freeing its own resource before copying from it when the source is the same object", "To prevent assigning from a `const` object", "It is required by the standard for every user-defined `operator=`"],
          answer: 1,
          explanation: "An operator that releases its block and then reads `other.data` — the same pointer — copies from freed memory when the two are one object. Comparing addresses is the reliable identity test; the guard is not required and copy-and-swap avoids it altogether.",
        },
        {
          prompt: "A class declares `T(const T&) = delete;` and nothing else. What does `T b = std::move(a);` do?",
          options: ["Moves `a` into `b`; deleting the copy has no effect on moves", "Fails to compile: declaring a copy constructor suppresses the implicit move, so the deleted copy constructor is selected", "Performs a shallow copy", "Compiles but throws at run time"],
          answer: 1,
          explanation: "A user-declared copy constructor — deleted or not — stops the compiler generating the move constructor. Overload resolution then finds only the deleted copy constructor and reports its use as an error.",
        },
      ],
    },
    {
      slug: "destructors-and-rule-of-three",
      file: "02-destructors-and-rule-of-three.md",
      exercises: [
        {
          title: "An owning buffer, rule of three",
          prompt: `\`IntBuffer\` owns \`size_\` ints in a block allocated with \`new int[n]()\`. The constructor, \`operator[]\`, \`size()\`, \`print()\` and \`sum()\` are written. Give it the rule of three:

- the **copy constructor** allocates its own block, copies the elements, and prints \`deep-copy <size>\`;
- the **copy assignment** prints \`self-assign\` and returns when the source is this object; otherwise it allocates a fresh block, copies into it, releases the old block, commits, prints \`copy-assign <size>\` and returns \`*this\`;
- the **destructor** prints \`release <size>\` and then deletes the block (the constructor already prints \`allocate <size>\`).

The driver is written: it reads \`n\` and \`n\` integers into \`a\`, copies \`a\` into \`b\`, applies \`m\` edits of the form \`i v\` (set \`b[i] = v\`) to the copy only, prints both buffers, assigns \`b\` to \`a\`, assigns \`a\` to itself through a reference, and prints \`a\` with its sum. If \`a\` changes when \`b\` is edited, the copy is shallow.

**Input:** \`n\`, then \`n\` integers, then \`m\`, then \`m\` lines of \`i v\`.
**Output:** the trace and the three buffer lines, as below.

\`\`\`text
3
1 2 3
1
0 9
\`\`\`
prints
\`\`\`text
allocate 3
deep-copy 3
a=[1 2 3]
b=[9 2 3]
copy-assign 3
self-assign
a=[9 2 3] sum=14
release 3
release 3
\`\`\``,
          starter: String.raw`#include <algorithm>
#include <cstddef>
#include <iostream>

class IntBuffer {
public:
    explicit IntBuffer(std::size_t n) : data_(new int[n]()), size_(n) {
        std::cout << "allocate " << size_ << '\n';
    }

    // TODO: copy constructor — allocate, copy the elements, print "deep-copy <size>"
    IntBuffer(const IntBuffer& other) : data_(nullptr), size_(0) {
        (void)other;
    }

    // TODO: copy assignment — self-assign guard, acquire, copy, release, commit
    IntBuffer& operator=(const IntBuffer& other) {
        (void)other;
        return *this;
    }

    // TODO: destructor — print "release <size>", then delete[] the block
    ~IntBuffer() {
    }

    std::size_t size() const { return size_; }
    int& operator[](std::size_t i) { return data_[i]; }
    const int& operator[](std::size_t i) const { return data_[i]; }

    void print(const char* name) const {
        std::cout << name << "=[";
        for (std::size_t i = 0; i < size_; ++i) {
            if (i > 0) std::cout << ' ';
            std::cout << data_[i];
        }
        std::cout << ']';
    }

    long long sum() const {
        long long total = 0;
        for (std::size_t i = 0; i < size_; ++i) total += data_[i];
        return total;
    }

private:
    int* data_;
    std::size_t size_;
};

int main() {
    std::size_t n;
    std::cin >> n;
    IntBuffer a(n);
    for (std::size_t i = 0; i < n; ++i) std::cin >> a[i];

    IntBuffer b = a;
    std::size_t m;
    std::cin >> m;
    for (std::size_t k = 0; k < m; ++k) {
        std::size_t i;
        int v;
        std::cin >> i >> v;
        b[i] = v;
    }
    a.print("a");
    std::cout << '\n';
    b.print("b");
    std::cout << '\n';

    a = b;
    IntBuffer& same = a;
    a = same;
    a.print("a");
    std::cout << " sum=" << a.sum() << '\n';
    return 0;
}
`,
          solution: String.raw`#include <algorithm>
#include <cstddef>
#include <iostream>

class IntBuffer {
public:
    explicit IntBuffer(std::size_t n) : data_(new int[n]()), size_(n) {
        std::cout << "allocate " << size_ << '\n';
    }

    IntBuffer(const IntBuffer& other) : data_(new int[other.size_]), size_(other.size_) {
        std::copy_n(other.data_, size_, data_);
        std::cout << "deep-copy " << size_ << '\n';
    }

    IntBuffer& operator=(const IntBuffer& other) {
        if (this == &other) {
            std::cout << "self-assign\n";
            return *this;
        }
        int* fresh = new int[other.size_];
        std::copy_n(other.data_, other.size_, fresh);
        delete[] data_;
        data_ = fresh;
        size_ = other.size_;
        std::cout << "copy-assign " << size_ << '\n';
        return *this;
    }

    ~IntBuffer() {
        std::cout << "release " << size_ << '\n';
        delete[] data_;
    }

    std::size_t size() const { return size_; }
    int& operator[](std::size_t i) { return data_[i]; }
    const int& operator[](std::size_t i) const { return data_[i]; }

    void print(const char* name) const {
        std::cout << name << "=[";
        for (std::size_t i = 0; i < size_; ++i) {
            if (i > 0) std::cout << ' ';
            std::cout << data_[i];
        }
        std::cout << ']';
    }

    long long sum() const {
        long long total = 0;
        for (std::size_t i = 0; i < size_; ++i) total += data_[i];
        return total;
    }

private:
    int* data_;
    std::size_t size_;
};

int main() {
    std::size_t n;
    std::cin >> n;
    IntBuffer a(n);
    for (std::size_t i = 0; i < n; ++i) std::cin >> a[i];

    IntBuffer b = a;
    std::size_t m;
    std::cin >> m;
    for (std::size_t k = 0; k < m; ++k) {
        std::size_t i;
        int v;
        std::cin >> i >> v;
        b[i] = v;
    }
    a.print("a");
    std::cout << '\n';
    b.print("b");
    std::cout << '\n';

    a = b;
    IntBuffer& same = a;
    a = same;
    a.print("a");
    std::cout << " sum=" << a.sum() << '\n';
    return 0;
}
`,
          hints: [
            "The copy constructor's initialiser list allocates new int[other.size_]; std::copy_n(other.data_, size_, data_) fills it.",
            "In the assignment, allocate and copy into a fresh block before delete[] data_ — never the other way round.",
            "The destructor prints first and deletes second; delete[] matches new[].",
          ],
          cases: [
            { stdin: "3\n1 2 3\n1\n0 9\n", expected: "allocate 3\ndeep-copy 3\na=[1 2 3]\nb=[9 2 3]\ncopy-assign 3\nself-assign\na=[9 2 3] sum=14\nrelease 3\nrelease 3\n" },
            { stdin: "4\n5 -5 10 0\n2\n1 5\n3 1\n", expected: "allocate 4\ndeep-copy 4\na=[5 -5 10 0]\nb=[5 5 10 1]\ncopy-assign 4\nself-assign\na=[5 5 10 1] sum=21\nrelease 4\nrelease 4\n" },
            { stdin: "0\n0\n", expected: "allocate 0\ndeep-copy 0\na=[]\nb=[]\ncopy-assign 0\nself-assign\na=[] sum=0\nrelease 0\nrelease 0\n", hidden: true },
            { stdin: "1\n7\n1\n0 -7\n", expected: "allocate 1\ndeep-copy 1\na=[7]\nb=[-7]\ncopy-assign 1\nself-assign\na=[-7] sum=-7\nrelease 1\nrelease 1\n", hidden: true },
          ],
        },
        {
          title: "Copy-and-swap",
          prompt: `Rebuild \`IntBuffer\`'s assignment with the copy-and-swap idiom. The constructor (\`allocate <size>\`), copy constructor (\`deep-copy <size>\`) and destructor (\`release <size>\`) are written. Add:

- \`friend void swap(IntBuffer& x, IntBuffer& y) noexcept\` — exchanges the two pointers and the two sizes with \`std::swap\`, then prints \`swap\`;
- \`IntBuffer& operator=(IntBuffer other)\` — takes the source **by value**, swaps \`*this\` with the parameter and returns \`*this\`. Nothing else: no guard, no \`delete\`.

Because the parameter is a complete copy, the old contents of the target leave with the parameter and are released by its destructor. The driver reads \`a\` (\`n\` values) and \`b\` (\`m\` values), assigns \`b\` to \`a\`, sets \`b[0]\` to \`v\` when \`m > 0\`, assigns \`a\` to itself through a reference, swaps \`a\` and \`b\` with a plain \`swap(a, b)\` call, and prints both.

**Input:** \`n\`, \`n\` integers, \`m\`, \`m\` integers, then \`v\`.
**Output:** the trace and the two buffer lines.

\`\`\`text
3
1 2 3
2
7 8
9
\`\`\`
prints
\`\`\`text
allocate 3
allocate 2
deep-copy 2
swap
release 3
deep-copy 2
swap
release 2
swap
a=[9 8]
b=[7 8]
release 2
release 2
\`\`\``,
          starter: String.raw`#include <algorithm>
#include <cstddef>
#include <iostream>
#include <utility>

class IntBuffer {
public:
    explicit IntBuffer(std::size_t n) : data_(new int[n]()), size_(n) {
        std::cout << "allocate " << size_ << '\n';
    }

    IntBuffer(const IntBuffer& other) : data_(new int[other.size_]), size_(other.size_) {
        std::copy_n(other.data_, size_, data_);
        std::cout << "deep-copy " << size_ << '\n';
    }

    // TODO: friend void swap(IntBuffer& x, IntBuffer& y) noexcept — exchange members, print "swap"

    // TODO: IntBuffer& operator=(IntBuffer other) — swap with the parameter, return *this

    ~IntBuffer() {
        std::cout << "release " << size_ << '\n';
        delete[] data_;
    }

    std::size_t size() const { return size_; }
    int& operator[](std::size_t i) { return data_[i]; }
    const int& operator[](std::size_t i) const { return data_[i]; }

    void print(const char* name) const {
        std::cout << name << "=[";
        for (std::size_t i = 0; i < size_; ++i) {
            if (i > 0) std::cout << ' ';
            std::cout << data_[i];
        }
        std::cout << "]\n";
    }

private:
    int* data_;
    std::size_t size_;
};

IntBuffer readBuffer() {
    std::size_t n;
    std::cin >> n;
    IntBuffer buf(n);
    for (std::size_t i = 0; i < n; ++i) std::cin >> buf[i];
    return buf;
}

int main() {
    IntBuffer a = readBuffer();
    IntBuffer b = readBuffer();
    int v;
    std::cin >> v;
    // TODO: a = b; set b[0] = v when b has elements; self-assign a through a reference;
    //       swap(a, b); print a then b
    return 0;
}
`,
          solution: String.raw`#include <algorithm>
#include <cstddef>
#include <iostream>
#include <utility>

class IntBuffer {
public:
    explicit IntBuffer(std::size_t n) : data_(new int[n]()), size_(n) {
        std::cout << "allocate " << size_ << '\n';
    }

    IntBuffer(const IntBuffer& other) : data_(new int[other.size_]), size_(other.size_) {
        std::copy_n(other.data_, size_, data_);
        std::cout << "deep-copy " << size_ << '\n';
    }

    friend void swap(IntBuffer& x, IntBuffer& y) noexcept {
        std::swap(x.data_, y.data_);
        std::swap(x.size_, y.size_);
        std::cout << "swap\n";
    }

    IntBuffer& operator=(IntBuffer other) {
        swap(*this, other);
        return *this;
    }

    ~IntBuffer() {
        std::cout << "release " << size_ << '\n';
        delete[] data_;
    }

    std::size_t size() const { return size_; }
    int& operator[](std::size_t i) { return data_[i]; }
    const int& operator[](std::size_t i) const { return data_[i]; }

    void print(const char* name) const {
        std::cout << name << "=[";
        for (std::size_t i = 0; i < size_; ++i) {
            if (i > 0) std::cout << ' ';
            std::cout << data_[i];
        }
        std::cout << "]\n";
    }

private:
    int* data_;
    std::size_t size_;
};

IntBuffer readBuffer() {
    std::size_t n;
    std::cin >> n;
    IntBuffer buf(n);
    for (std::size_t i = 0; i < n; ++i) std::cin >> buf[i];
    return buf;
}

int main() {
    IntBuffer a = readBuffer();
    IntBuffer b = readBuffer();
    int v;
    std::cin >> v;
    a = b;
    if (b.size() > 0) b[0] = v;
    IntBuffer& same = a;
    a = same;
    swap(a, b);
    a.print("a");
    b.print("b");
    return 0;
}
`,
          hints: [
            "A friend defined inside the class body is a free function that can touch the private members; unqualified swap(a, b) finds it.",
            "The by-value parameter is built by the copy constructor before the body runs — that is the deep-copy line — and destroyed when the operator returns — that is the release line.",
            "Self-assignment copies, swaps and releases the copy; the buffer keeps its contents in a different block, with no guard needed.",
          ],
          cases: [
            { stdin: "3\n1 2 3\n2\n7 8\n9\n", expected: "allocate 3\nallocate 2\ndeep-copy 2\nswap\nrelease 3\ndeep-copy 2\nswap\nrelease 2\nswap\na=[9 8]\nb=[7 8]\nrelease 2\nrelease 2\n" },
            { stdin: "1\n5\n3\n1 2 3\n-1\n", expected: "allocate 1\nallocate 3\ndeep-copy 3\nswap\nrelease 1\ndeep-copy 3\nswap\nrelease 3\nswap\na=[-1 2 3]\nb=[1 2 3]\nrelease 3\nrelease 3\n" },
            { stdin: "2\n4 5\n0\n1\n", expected: "allocate 2\nallocate 0\ndeep-copy 0\nswap\nrelease 2\ndeep-copy 0\nswap\nrelease 0\nswap\na=[]\nb=[]\nrelease 0\nrelease 0\n", hidden: true },
            { stdin: "0\n1\n6\n6\n", expected: "allocate 0\nallocate 1\ndeep-copy 1\nswap\nrelease 0\ndeep-copy 1\nswap\nrelease 1\nswap\na=[6]\nb=[6]\nrelease 1\nrelease 1\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "```cpp\n{\n    Probe a(1);\n    Probe b(2);\n    Probe c(3);\n}\n```\nIn what order are the three destroyed at the closing brace?",
          options: ["`a`, `b`, `c`", "`c`, `b`, `a`", "Unspecified — the compiler chooses", "All at once; the order is unobservable"],
          answer: 1,
          explanation: "Automatic objects are destroyed in reverse order of construction, so the last declared goes first. The order is fully specified and observable — RAII depends on it.",
        },
        {
          prompt: "When are a class's data members destroyed relative to its destructor body?",
          options: ["Before the body, in declaration order", "After the body, in reverse declaration order", "After the body, in declaration order", "Only when the destructor is user-defined"],
          answer: 1,
          explanation: "The body runs first — it may still use the members — and then the members are destroyed last-declared first. This happens whether the destructor is generated or written by hand.",
        },
        {
          prompt: "What does the rule of three say?",
          options: ["Every class must declare a constructor, a destructor and `operator=`", "If a class needs a user-written destructor, copy constructor or copy assignment, it almost certainly needs all three", "A class may have at most three constructors", "Three special members are generated only when the class has no members"],
          answer: 1,
          explanation: "Needing one of the three means the class manages a resource the generated versions do not understand; the same resource needs the other two to be written as well. The rule of five extends it with the two move operations.",
        },
        {
          prompt: "```cpp\nIntBuffer& operator=(IntBuffer other) {\n    swap(*this, other);\n    return *this;\n}\n```\nWhy is this safe for `a = a` without an explicit guard?",
          options: ["The compiler removes self-assignments before calling `operator=`", "`other` is a complete copy made before the body runs, so swapping with it and letting it die leaves `a` with its own contents in a different block", "`swap` detects that both arguments are the same object", "It is not safe; copy-and-swap still needs `if (this == &other)`"],
          answer: 1,
          explanation: "The by-value parameter is copy-constructed from the source before anything in the target is touched. After the swap the parameter holds the old block and destroys it on return; nothing is ever freed and then read.",
        },
        {
          prompt: "An exception propagates out of a destructor during normal scope exit. What happens?",
          options: ["The enclosing `try` block catches it like any other exception", "`std::terminate` is called: destructors are implicitly `noexcept`", "The exception is silently discarded", "The object is leaked but the program continues"],
          answer: 1,
          explanation: "Destructors are `noexcept` by default, and an exception leaving a `noexcept` function terminates the program. The rule exists because a destructor running during stack unwinding would otherwise put two exceptions in flight.",
        },
        {
          prompt: "```cpp\nstruct D {\n    const char* n;\n    ~D() { std::cout << n; }\n};\nint main() {\n    D a{\"a\"};\n    { D b{\"b\"}; }\n    D c{\"c\"};\n}\n```\nWhat is printed?",
          options: ["`abc`", "`cba`", "`bca`", "`bac`"],
          answer: 2,
          explanation: "`b` dies at its inner block's closing brace, before `c` is even constructed. At the end of `main`, `c` and `a` are destroyed in reverse order of construction: `c` then `a`.",
        },
      ],
    },
    {
      slug: "move-semantics",
      file: "03-move-semantics.md",
      exercises: [
        {
          title: "Rule of five buffer",
          prompt: `Extend the rule-of-three \`IntBuffer\` (constructor, copy constructor, copy assignment and destructor are written, with the events \`allocate\`, \`deep-copy\`, \`copy-assign\`, \`self-assign\` and \`release\`) with the two move operations, both \`noexcept\`:

- the **move constructor** takes the source's pointer and size, leaves the source with a null pointer and size 0, and prints \`move <size>\`;
- the **move assignment** prints \`self-assign\` and returns when the source is this object; otherwise it releases its own block, takes the source's, leaves the source empty, prints \`move-assign <size>\` and returns \`*this\`.

A moved-from \`IntBuffer\` is defined to print as \`size=0 []\`. The driver reads \`n\` and \`n\` integers into \`a\`, then: move-constructs \`b\` from \`a\` and prints both; move-assigns \`b\` back into \`a\` and prints both; move-assigns \`a\` to itself through a reference (\`IntBuffer& same = a; a = std::move(same);\`); copy-constructs \`c\` from \`a\`; copy-assigns \`c\` to \`b\`; prints \`sum a=<> b=<> c=<>\`. Buffers print as \`<name>: size=<n> [<values>]\`.

**Input:** \`n\`, then \`n\` integers.
**Output:** the trace, the four buffer lines and the sums, as below.

\`\`\`text
3
1 2 3
\`\`\`
prints
\`\`\`text
allocate 3
move 3
a: size=0 []
b: size=3 [1 2 3]
move-assign 3
a: size=3 [1 2 3]
b: size=0 []
self-assign
deep-copy 3
copy-assign 3
sum a=6 b=6 c=6
release 3
release 3
release 3
\`\`\``,
          starter: String.raw`#include <algorithm>
#include <cstddef>
#include <iostream>
#include <utility>

class IntBuffer {
public:
    explicit IntBuffer(std::size_t n) : data_(new int[n]()), size_(n) {
        std::cout << "allocate " << size_ << '\n';
    }

    IntBuffer(const IntBuffer& other) : data_(new int[other.size_]), size_(other.size_) {
        std::copy_n(other.data_, size_, data_);
        std::cout << "deep-copy " << size_ << '\n';
    }

    IntBuffer& operator=(const IntBuffer& other) {
        if (this == &other) {
            std::cout << "self-assign\n";
            return *this;
        }
        int* fresh = new int[other.size_];
        std::copy_n(other.data_, other.size_, fresh);
        delete[] data_;
        data_ = fresh;
        size_ = other.size_;
        std::cout << "copy-assign " << size_ << '\n';
        return *this;
    }

    // TODO: move constructor (noexcept) — steal, null the source, print "move <size>"

    // TODO: move assignment (noexcept) — self-assign guard, release own, steal, null the source,
    //       print "move-assign <size>"

    ~IntBuffer() {
        std::cout << "release " << size_ << '\n';
        delete[] data_;
    }

    std::size_t size() const { return size_; }
    int& operator[](std::size_t i) { return data_[i]; }
    const int& operator[](std::size_t i) const { return data_[i]; }

    void print(const char* name) const {
        std::cout << name << ": size=" << size_ << " [";
        for (std::size_t i = 0; i < size_; ++i) {
            if (i > 0) std::cout << ' ';
            std::cout << data_[i];
        }
        std::cout << "]\n";
    }

    long long sum() const {
        long long total = 0;
        for (std::size_t i = 0; i < size_; ++i) total += data_[i];
        return total;
    }

private:
    int* data_;
    std::size_t size_;
};

int main() {
    std::size_t n;
    std::cin >> n;
    IntBuffer a(n);
    for (std::size_t i = 0; i < n; ++i) std::cin >> a[i];
    // TODO: the driver described in the prompt
    return 0;
}
`,
          solution: String.raw`#include <algorithm>
#include <cstddef>
#include <iostream>
#include <utility>

class IntBuffer {
public:
    explicit IntBuffer(std::size_t n) : data_(new int[n]()), size_(n) {
        std::cout << "allocate " << size_ << '\n';
    }

    IntBuffer(const IntBuffer& other) : data_(new int[other.size_]), size_(other.size_) {
        std::copy_n(other.data_, size_, data_);
        std::cout << "deep-copy " << size_ << '\n';
    }

    IntBuffer& operator=(const IntBuffer& other) {
        if (this == &other) {
            std::cout << "self-assign\n";
            return *this;
        }
        int* fresh = new int[other.size_];
        std::copy_n(other.data_, other.size_, fresh);
        delete[] data_;
        data_ = fresh;
        size_ = other.size_;
        std::cout << "copy-assign " << size_ << '\n';
        return *this;
    }

    IntBuffer(IntBuffer&& other) noexcept
        : data_(std::exchange(other.data_, nullptr)), size_(std::exchange(other.size_, 0)) {
        std::cout << "move " << size_ << '\n';
    }

    IntBuffer& operator=(IntBuffer&& other) noexcept {
        if (this == &other) {
            std::cout << "self-assign\n";
            return *this;
        }
        delete[] data_;
        data_ = std::exchange(other.data_, nullptr);
        size_ = std::exchange(other.size_, 0);
        std::cout << "move-assign " << size_ << '\n';
        return *this;
    }

    ~IntBuffer() {
        std::cout << "release " << size_ << '\n';
        delete[] data_;
    }

    std::size_t size() const { return size_; }
    int& operator[](std::size_t i) { return data_[i]; }
    const int& operator[](std::size_t i) const { return data_[i]; }

    void print(const char* name) const {
        std::cout << name << ": size=" << size_ << " [";
        for (std::size_t i = 0; i < size_; ++i) {
            if (i > 0) std::cout << ' ';
            std::cout << data_[i];
        }
        std::cout << "]\n";
    }

    long long sum() const {
        long long total = 0;
        for (std::size_t i = 0; i < size_; ++i) total += data_[i];
        return total;
    }

private:
    int* data_;
    std::size_t size_;
};

int main() {
    std::size_t n;
    std::cin >> n;
    IntBuffer a(n);
    for (std::size_t i = 0; i < n; ++i) std::cin >> a[i];

    IntBuffer b = std::move(a);
    a.print("a");
    b.print("b");

    a = std::move(b);
    a.print("a");
    b.print("b");

    IntBuffer& same = a;
    a = std::move(same);

    IntBuffer c = a;
    b = c;
    std::cout << "sum a=" << a.sum() << " b=" << b.sum() << " c=" << c.sum() << '\n';
    return 0;
}
`,
          hints: [
            "std::exchange(other.data_, nullptr) returns the old pointer and stores nullptr in one expression — the move constructor's initialiser list is two of those.",
            "The move assignment must delete[] its own block before taking the other's, or that block leaks; the self-guard comes first so it never deletes what it is about to take.",
            "delete[] nullptr is a no-op, so the destructor needs no special case for a moved-from buffer.",
          ],
          cases: [
            { stdin: "3\n1 2 3\n", expected: "allocate 3\nmove 3\na: size=0 []\nb: size=3 [1 2 3]\nmove-assign 3\na: size=3 [1 2 3]\nb: size=0 []\nself-assign\ndeep-copy 3\ncopy-assign 3\nsum a=6 b=6 c=6\nrelease 3\nrelease 3\nrelease 3\n" },
            { stdin: "2\n-9 4\n", expected: "allocate 2\nmove 2\na: size=0 []\nb: size=2 [-9 4]\nmove-assign 2\na: size=2 [-9 4]\nb: size=0 []\nself-assign\ndeep-copy 2\ncopy-assign 2\nsum a=-5 b=-5 c=-5\nrelease 2\nrelease 2\nrelease 2\n" },
            { stdin: "0\n", expected: "allocate 0\nmove 0\na: size=0 []\nb: size=0 []\nmove-assign 0\na: size=0 []\nb: size=0 []\nself-assign\ndeep-copy 0\ncopy-assign 0\nsum a=0 b=0 c=0\nrelease 0\nrelease 0\nrelease 0\n", hidden: true },
            { stdin: "1\n1000000000\n", expected: "allocate 1\nmove 1\na: size=0 []\nb: size=1 [1000000000]\nmove-assign 1\na: size=1 [1000000000]\nb: size=0 []\nself-assign\ndeep-copy 1\ncopy-assign 1\nsum a=1000000000 b=1000000000 c=1000000000\nrelease 1\nrelease 1\nrelease 1\n", hidden: true },
          ],
        },
        {
          title: "Moved-from, observed",
          prompt: `Observe what the standard library promises about moved-from objects — and only that. Read a one-word \`label\`, then \`n\` and \`n\` integers into a vector \`staging\`, then \`m\` and \`m\` more integers.

1. \`std::string title = std::move(label);\` and print \`title=<title>\`. Do **not** print \`label\` — a moved-from \`std::string\` is valid but unspecified. Instead assign it \`"reused"\` and print \`label=reused\`: assigning to a moved-from object is always allowed.
2. \`std::vector<int> committed = std::move(staging);\` and print \`commit 1: committed=<size> staging=<size>\`. The move constructor guarantees the source is empty, so \`staging\` prints 0.
3. Read the \`m\` integers into \`staging\` with \`push_back\` — a moved-from vector can be filled again — then move its *elements* into \`committed\` with the algorithm \`std::move(staging.begin(), staging.end(), std::back_inserter(committed))\`. Print \`commit 2: committed=<size> staging=<size>\`: the algorithm moves elements, not the container, so \`staging\` still has \`m\` of them.
4. \`staging.clear();\` and print \`after clear: staging=0\`.
5. Print \`committed=[<values separated by spaces>]\` and \`sum=<total>\` (a \`long long\`).

**Input:** \`label\`, \`n\`, \`n\` integers, \`m\`, \`m\` integers.
**Output:** seven lines.

\`\`\`text
alpha
3
1 2 3
2
4 5
\`\`\`
prints
\`\`\`text
title=alpha
label=reused
commit 1: committed=3 staging=0
commit 2: committed=5 staging=2
after clear: staging=0
committed=[1 2 3 4 5]
sum=15
\`\`\``,
          starter: String.raw`#include <algorithm>
#include <iostream>
#include <iterator>
#include <string>
#include <utility>
#include <vector>

int main() {
    std::string label;
    std::cin >> label;
    // TODO: step 1 — move label into title, print title, give label a new value, print it

    std::size_t n;
    std::cin >> n;
    std::vector<int> staging;
    for (std::size_t i = 0; i < n; ++i) {
        int v;
        std::cin >> v;
        staging.push_back(v);
    }
    // TODO: step 2 — move-construct committed from staging, print the sizes

    std::size_t m;
    std::cin >> m;
    // TODO: step 3 — refill staging, move its elements into committed with the algorithm, print the sizes
    // TODO: steps 4 and 5
    return 0;
}
`,
          solution: String.raw`#include <algorithm>
#include <iostream>
#include <iterator>
#include <string>
#include <utility>
#include <vector>

int main() {
    std::string label;
    std::cin >> label;
    std::string title = std::move(label);
    std::cout << "title=" << title << '\n';
    label = "reused";
    std::cout << "label=" << label << '\n';

    std::size_t n;
    std::cin >> n;
    std::vector<int> staging;
    for (std::size_t i = 0; i < n; ++i) {
        int v;
        std::cin >> v;
        staging.push_back(v);
    }
    std::vector<int> committed = std::move(staging);
    std::cout << "commit 1: committed=" << committed.size() << " staging=" << staging.size() << '\n';

    std::size_t m;
    std::cin >> m;
    for (std::size_t i = 0; i < m; ++i) {
        int v;
        std::cin >> v;
        staging.push_back(v);
    }
    std::move(staging.begin(), staging.end(), std::back_inserter(committed));
    std::cout << "commit 2: committed=" << committed.size() << " staging=" << staging.size() << '\n';

    staging.clear();
    std::cout << "after clear: staging=" << staging.size() << '\n';

    std::cout << "committed=[";
    for (std::size_t i = 0; i < committed.size(); ++i) {
        if (i > 0) std::cout << ' ';
        std::cout << committed[i];
    }
    std::cout << "]\n";
    long long sum = 0;
    for (int v : committed) sum += v;
    std::cout << "sum=" << sum << '\n';
    return 0;
}
`,
          hints: [
            "std::move(x) with one argument is the cast in <utility>; std::move(first, last, out) with three is the algorithm in <algorithm>.",
            "After std::vector<int> committed = std::move(staging); the standard guarantees staging.empty() — that is why its size prints 0.",
            "The algorithm leaves staging with m moved-from ints (for int, unchanged values); clear() is what empties the container.",
          ],
          cases: [
            { stdin: "alpha\n3\n1 2 3\n2\n4 5\n", expected: "title=alpha\nlabel=reused\ncommit 1: committed=3 staging=0\ncommit 2: committed=5 staging=2\nafter clear: staging=0\ncommitted=[1 2 3 4 5]\nsum=15\n" },
            { stdin: "batch-7\n1\n-10\n3\n1 2 3\n", expected: "title=batch-7\nlabel=reused\ncommit 1: committed=1 staging=0\ncommit 2: committed=4 staging=3\nafter clear: staging=0\ncommitted=[-10 1 2 3]\nsum=-4\n" },
            { stdin: "z\n0\n0\n", expected: "title=z\nlabel=reused\ncommit 1: committed=0 staging=0\ncommit 2: committed=0 staging=0\nafter clear: staging=0\ncommitted=[]\nsum=0\n", hidden: true },
            { stdin: "big\n2\n2000000000 2000000000\n1\n2000000000\n", expected: "title=big\nlabel=reused\ncommit 1: committed=2 staging=0\ncommit 2: committed=3 staging=1\nafter clear: staging=0\ncommitted=[2000000000 2000000000 2000000000]\nsum=6000000000\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "What does `std::move(x)` do?",
          options: ["Moves `x`'s contents into a temporary and returns it", "Casts `x` to an rvalue reference so that overload resolution can pick a move constructor or move assignment; it moves nothing itself", "Destroys `x` after transferring its contents", "Marks `x` as unusable until it is reassigned"],
          answer: 1,
          explanation: "`std::move` is `static_cast<T&&>(x)`. The transfer, if any, happens inside the move constructor or assignment that the cast lets overload resolution choose — and for a type without one, `std::move` selects the copy.",
        },
        {
          prompt: "After `std::vector<int> b = std::move(a);`, what does the standard guarantee about `a`?",
          options: ["`a` is unchanged; vectors always copy", "`a` is empty", "Any use of `a` is undefined behaviour", "`a` has the same size as `b` but unspecified contents"],
          answer: 1,
          explanation: "The vector move constructor is specified to leave the source empty. A moved-from object is always valid; for `std::vector` the state is also *specified*, which is not true of `std::string`.",
        },
        {
          prompt: "After `std::string t = std::move(s);` you print `s`. Which statement is correct?",
          options: ["It always prints an empty string, by the standard", "It is undefined behaviour", "`s` is valid but its contents are unspecified — usually empty, but code must not rely on it", "It prints the original text; strings cannot be moved"],
          answer: 2,
          explanation: "A moved-from standard object is in a valid but unspecified state. Printing it is well-defined but its value is not promised, so a test that expects the empty string is testing the implementation, not the language.",
        },
        {
          prompt: "Why should a move constructor be declared `noexcept`?",
          options: ["The compiler refuses to generate a `std::vector` of the type otherwise", "`std::vector` moves elements during reallocation only when the move constructor is `noexcept`; otherwise it copies them to keep its strong exception guarantee", "`noexcept` makes the move constructor run faster", "Without it, `std::move` selects the copy constructor"],
          answer: 1,
          explanation: "A move that could throw halfway through a reallocation would leave the vector unrecoverable, so `std::move_if_noexcept` falls back to copying. The cost is silent: the program works and is slower than it looks.",
        },
        {
          prompt: "```cpp\nvoid g(const Probe&);   // #1\nvoid g(Probe&&);        // #2\nvoid f(Probe&& p) { g(p); }\n```\nWhich `g` does `f` call?",
          options: ["#2, because `p` is declared as an rvalue reference", "#1, because the expression `p` has a name and is therefore an lvalue", "Ambiguous — compile error", "#2 for temporaries and #1 for named objects, decided at run time"],
          answer: 1,
          explanation: "A named rvalue reference is an lvalue inside the function, so it binds to `const Probe&`. Forwarding the move on requires `g(std::move(p))`.",
        },
        {
          prompt: "```cpp\nProbe a(1);\nProbe b = std::move(a);\nProbe c = b;\n```\nWith a `Probe` that prints each special member, which events follow `construct`?",
          options: ["`move`, `copy`", "`move`, `move`", "`copy`, `copy`", "`construct`, `copy`"],
          answer: 0,
          explanation: "`std::move(a)` is an rvalue, so `b` is move-constructed. `b` on its own is an lvalue, so `c` is copy-constructed; nothing about `b` having been the target of a move makes it an rvalue.",
        },
      ],
    },
    {
      slug: "rule-of-five-and-zero",
      file: "04-rule-of-five-and-zero.md",
      exercises: [
        {
          title: "A rule-of-zero grid",
          prompt: `Write \`Grid\`, a rows × columns table of \`int\` that owns its cells through \`std::unique_ptr<int[]>\` and declares **none** of the five special member functions — the rule of zero. The compiler makes it movable and non-copyable because \`std::unique_ptr\` is.

- \`Grid(std::size_t rows, std::size_t cols)\` allocates \`rows * cols\` zeroed cells with \`std::make_unique<int[]>\`.
- \`int& at(std::size_t r, std::size_t c)\` and a \`const\` overload, row-major: \`cells_[r * cols_ + c]\`.
- \`bool empty() const\` returns whether the pointer is null — the moved-from state of a rule-of-zero class is its members' moved-from states, and a moved-from \`std::unique_ptr\` is null while the two sizes are simply copied.
- \`Grid transpose() const\` returns a new columns × rows grid.
- \`void print() const\` prints each row on its own line, values separated by single spaces.

Read \`R C\` and then \`R\` rows of \`C\` integers into \`g\`. Compute \`Grid t = g.transpose();\`, then \`Grid moved = std::move(g);\`. Print \`grid RxC:\` followed by \`moved\`'s rows, \`transposed CxR:\` followed by \`t\`'s rows, then \`source empty=true\` and \`moved empty=false\` from the two \`empty()\` calls (print \`true\`/\`false\`). If you are curious, add \`Grid copy = moved;\` and read the compiler's error before removing it.

**Input:** \`R C\`, then \`R\` lines of \`C\` integers.
**Output:** as below.

\`\`\`text
2 3
1 2 3
4 5 6
\`\`\`
prints
\`\`\`text
grid 2x3:
1 2 3
4 5 6
transposed 3x2:
1 4
2 5
3 6
source empty=true
moved empty=false
\`\`\``,
          starter: String.raw`#include <cstddef>
#include <iostream>
#include <memory>
#include <utility>

class Grid {
public:
    Grid(std::size_t rows, std::size_t cols)
        : rows_(rows), cols_(cols), cells_(std::make_unique<int[]>(rows * cols)) {}

    // No copy, no move, no destructor: the unique_ptr member owns the cells.

    std::size_t rows() const { return rows_; }
    std::size_t cols() const { return cols_; }

    // TODO: at(r, c) — non-const and const overloads, row-major
    // TODO: empty() — true when cells_ is null
    // TODO: transpose() — a new cols x rows grid
    // TODO: print() — one line per row

private:
    std::size_t rows_;
    std::size_t cols_;
    std::unique_ptr<int[]> cells_;
};

int main() {
    std::size_t r, c;
    std::cin >> r >> c;
    Grid g(r, c);
    // TODO: fill g, transpose it, move it, print the report
    return 0;
}
`,
          solution: String.raw`#include <cstddef>
#include <iostream>
#include <memory>
#include <utility>

class Grid {
public:
    Grid(std::size_t rows, std::size_t cols)
        : rows_(rows), cols_(cols), cells_(std::make_unique<int[]>(rows * cols)) {}

    // No copy, no move, no destructor: the unique_ptr member owns the cells.

    std::size_t rows() const { return rows_; }
    std::size_t cols() const { return cols_; }

    int& at(std::size_t r, std::size_t c) { return cells_[r * cols_ + c]; }
    const int& at(std::size_t r, std::size_t c) const { return cells_[r * cols_ + c]; }

    bool empty() const { return !cells_; }

    Grid transpose() const {
        Grid t(cols_, rows_);
        for (std::size_t r = 0; r < rows_; ++r)
            for (std::size_t c = 0; c < cols_; ++c)
                t.at(c, r) = at(r, c);
        return t;
    }

    void print() const {
        for (std::size_t r = 0; r < rows_; ++r) {
            for (std::size_t c = 0; c < cols_; ++c) {
                if (c > 0) std::cout << ' ';
                std::cout << at(r, c);
            }
            std::cout << '\n';
        }
    }

private:
    std::size_t rows_;
    std::size_t cols_;
    std::unique_ptr<int[]> cells_;
};

int main() {
    std::size_t r, c;
    std::cin >> r >> c;
    Grid g(r, c);
    for (std::size_t i = 0; i < r; ++i)
        for (std::size_t j = 0; j < c; ++j)
            std::cin >> g.at(i, j);

    Grid t = g.transpose();
    Grid moved = std::move(g);

    std::cout << "grid " << moved.rows() << 'x' << moved.cols() << ":\n";
    moved.print();
    std::cout << "transposed " << t.rows() << 'x' << t.cols() << ":\n";
    t.print();
    std::cout << "source empty=" << (g.empty() ? "true" : "false") << '\n';
    std::cout << "moved empty=" << (moved.empty() ? "true" : "false") << '\n';
    return 0;
}
`,
          hints: [
            "std::make_unique<int[]>(n) value-initialises the array, and unique_ptr<int[]> supports operator[] directly.",
            "transpose() builds a local Grid t(cols_, rows_) and returns it — returning a move-only type by value is fine.",
            "!cells_ uses unique_ptr's explicit operator bool; after std::move(g) the pointer in g is null but rows_ and cols_ still hold their numbers.",
          ],
          cases: [
            { stdin: "2 3\n1 2 3\n4 5 6\n", expected: "grid 2x3:\n1 2 3\n4 5 6\ntransposed 3x2:\n1 4\n2 5\n3 6\nsource empty=true\nmoved empty=false\n" },
            { stdin: "1 4\n7 8 9 10\n", expected: "grid 1x4:\n7 8 9 10\ntransposed 4x1:\n7\n8\n9\n10\nsource empty=true\nmoved empty=false\n" },
            { stdin: "1 1\n-3\n", expected: "grid 1x1:\n-3\ntransposed 1x1:\n-3\nsource empty=true\nmoved empty=false\n", hidden: true },
            { stdin: "3 2\n1 0\n0 1\n5 5\n", expected: "grid 3x2:\n1 0\n0 1\n5 5\ntransposed 2x3:\n1 0 5\n0 1 5\nsource empty=true\nmoved empty=false\n", hidden: true },
          ],
        },
        {
          title: "What std::move actually does",
          prompt: `Test the generation table. \`Tracker\` is a member type that prints \`  copy\`, \`  move\`, \`  copy-assign\` or \`  move-assign\` (two leading spaces) whenever one of its special members runs. Complete four wrapper structs, each holding one \`Tracker t;\`:

- \`Zero\` declares nothing;
- \`DtorOnly\` declares only \`~DtorOnly() = default;\`;
- \`CopyOnly\` declares \`CopyOnly() = default;\`, a defaulted copy constructor and a defaulted copy assignment;
- \`Five\` declares a defaulted default constructor and all five special members, defaulted.

Read words until the input ends. For each word print it on its own line, then run \`X a; X b = std::move(a); a = std::move(b);\` for the matching type, so \`Tracker\` prints what the compiler generated: a move when the move operations exist, a copy when they were suppressed. An unknown word prints \`  unknown\`. Predict the output before you run it: which of the four declared something that stops the moves being generated?

**Input:** words separated by whitespace.
**Output:** three lines per word.

\`\`\`text
zero dtor
\`\`\`
prints
\`\`\`text
zero
  move
  move-assign
dtor
  copy
  copy-assign
\`\`\``,
          starter: String.raw`#include <iostream>
#include <string>
#include <utility>

struct Tracker {
    Tracker() = default;
    Tracker(const Tracker&) { std::cout << "  copy\n"; }
    Tracker(Tracker&&) noexcept { std::cout << "  move\n"; }
    Tracker& operator=(const Tracker&) { std::cout << "  copy-assign\n"; return *this; }
    Tracker& operator=(Tracker&&) noexcept { std::cout << "  move-assign\n"; return *this; }
};

struct Zero {
    Tracker t;
};

struct DtorOnly {
    Tracker t;
    // TODO: declare only a defaulted destructor
};

struct CopyOnly {
    Tracker t;
    // TODO: a defaulted default constructor, copy constructor and copy assignment
};

struct Five {
    Tracker t;
    // TODO: a defaulted default constructor and all five special members, defaulted
};

template <typename X>
void exercise() {
    X a;
    X b = std::move(a);
    a = std::move(b);
}

int main() {
    std::string word;
    while (std::cin >> word) {
        std::cout << word << '\n';
        // TODO: dispatch on the word: zero, dtor, copy, five, otherwise "  unknown"
    }
    return 0;
}
`,
          solution: String.raw`#include <iostream>
#include <string>
#include <utility>

struct Tracker {
    Tracker() = default;
    Tracker(const Tracker&) { std::cout << "  copy\n"; }
    Tracker(Tracker&&) noexcept { std::cout << "  move\n"; }
    Tracker& operator=(const Tracker&) { std::cout << "  copy-assign\n"; return *this; }
    Tracker& operator=(Tracker&&) noexcept { std::cout << "  move-assign\n"; return *this; }
};

struct Zero {
    Tracker t;
};

struct DtorOnly {
    Tracker t;
    ~DtorOnly() = default;
};

struct CopyOnly {
    Tracker t;
    CopyOnly() = default;
    CopyOnly(const CopyOnly&) = default;
    CopyOnly& operator=(const CopyOnly&) = default;
};

struct Five {
    Tracker t;
    Five() = default;
    Five(const Five&) = default;
    Five& operator=(const Five&) = default;
    Five(Five&&) = default;
    Five& operator=(Five&&) = default;
    ~Five() = default;
};

template <typename X>
void exercise() {
    X a;
    X b = std::move(a);
    a = std::move(b);
}

int main() {
    std::string word;
    while (std::cin >> word) {
        std::cout << word << '\n';
        if (word == "zero") exercise<Zero>();
        else if (word == "dtor") exercise<DtorOnly>();
        else if (word == "copy") exercise<CopyOnly>();
        else if (word == "five") exercise<Five>();
        else std::cout << "  unknown\n";
    }
    return 0;
}
`,
          hints: [
            "A defaulted destructor is still a user-declared one: it stops the implicit move constructor and move assignment from being declared.",
            "CopyOnly needs CopyOnly() = default; because declaring a copy constructor removes the implicit default constructor, and exercise() needs X a;.",
            "When no move operation exists, std::move(a) binds to const X& and the generated copy runs — the Tracker inside reports copy.",
          ],
          cases: [
            { stdin: "zero dtor\n", expected: "zero\n  move\n  move-assign\ndtor\n  copy\n  copy-assign\n" },
            { stdin: "copy five\n", expected: "copy\n  copy\n  copy-assign\nfive\n  move\n  move-assign\n" },
            { stdin: "five\ndtor\nzero\ncopy\n", expected: "five\n  move\n  move-assign\ndtor\n  copy\n  copy-assign\nzero\n  move\n  move-assign\ncopy\n  copy\n  copy-assign\n", hidden: true },
            { stdin: "three zero\n", expected: "three\n  unknown\nzero\n  move\n  move-assign\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "A class declares only a destructor. What does `T b = std::move(a);` do?",
          options: ["Move-constructs `b`; the destructor is irrelevant", "Copy-constructs `b`: a user-declared destructor stops the move operations being generated, and `std::move` falls back to the copy constructor", "Fails to compile", "Move-constructs `b` but then calls the destructor on `a` immediately"],
          answer: 1,
          explanation: "Declaring any of destructor, copy constructor or copy assignment means the implicit moves are not declared. They are not deleted, so overload resolution quietly picks `const T&`. The program compiles and copies.",
        },
        {
          prompt: "A class declares only a move constructor. What happens to `T b = a;` where `a` is an lvalue?",
          options: ["Copies `a`, using the generated copy constructor", "Moves `a`, since that is the only constructor", "Fails to compile: declaring a move operation deletes the copy constructor and copy assignment", "Copies `a` with a warning"],
          answer: 2,
          explanation: "A type that says how to move and nothing about copying is presumed non-copyable, so the copy operations are defined as deleted. `std::unique_ptr` has exactly this shape.",
        },
        {
          prompt: "Does `~Widget() = default;` count as declaring a destructor for the generation rules?",
          options: ["No — `= default` asks for the generated one, so nothing changes", "Yes — it is user-declared, and the implicit move operations are no longer generated", "Only if the class also has a virtual function", "Only when the destructor is defined outside the class"],
          answer: 1,
          explanation: "`= default` and `= delete` both declare the function. A defaulted destructor is exactly what a polymorphic base needs, and exactly why such a base should also default its copy and move operations explicitly.",
        },
        {
          prompt: "Which class follows the rule of zero?",
          options: ["One that declares all five special members as `= default`", "One whose members are `std::string`, `std::vector<int>` and `std::unique_ptr<Node>`, and declares none of the five", "One with a raw owning pointer and a destructor that deletes it", "One with no data members at all"],
          answer: 1,
          explanation: "The rule of zero is about ownership: every member owns itself, so the class needs no special member functions and the memberwise defaults are correct. Defaulting all five is a rule-of-five class that happens to have easy members.",
        },
        {
          prompt: "```cpp\nclass Grid {\n    std::size_t rows_, cols_;\n    std::unique_ptr<int[]> cells_;\n};\nGrid h = std::move(g);\n```\nWhat is the state of `g` afterwards?",
          options: ["`rows_` and `cols_` are 0 and `cells_` is null", "`rows_` and `cols_` keep their values and `cells_` is null", "`g` is destroyed", "Unchanged: a class with no move constructor cannot be moved"],
          answer: 1,
          explanation: "The generated move constructor moves each member: `std::unique_ptr`'s move leaves the source null, and an integer's \"move\" is a copy. A rule-of-zero class's moved-from state is the sum of its members' moved-from states.",
        },
        {
          prompt: "Which of these types can be copied?",
          options: ["`struct A { std::unique_ptr<int> p; };`", "`struct B { std::vector<int> v; std::string s; };`", "`struct C { C(C&&) = default; };`", "`struct D { D(const D&) = delete; };`"],
          answer: 1,
          explanation: "`B`'s members are all copyable, so its generated copy constructor is fine. `A`'s generated copy is deleted because a member's is; `C` declared a move, which deletes the copies; `D` deleted the copy explicitly.",
        },
      ],
    },
    {
      slug: "value-categories-and-elision",
      file: "05-value-categories-and-elision.md",
      exercises: [
        {
          title: "Elision, traced",
          prompt: `Complete the five special members of \`Probe\` — copy constructor (\`copy #<id> from #<source>\`), copy assignment (\`copy-assign …\`), move constructor (\`move …\`, and the source's value becomes 0), move assignment (\`move-assign …\`, source zeroed) — and write \`Probe make(int v)\`, which returns \`Probe(v)\`, and \`Probe pass(Probe p)\`, which returns \`p\`. Then predict every line of this driver before running it:

1. Read \`v1 v2 v3 v4\`.
2. \`Probe a = Probe(v1);\` — a prvalue initialiser: guaranteed elision, one \`construct\`.
3. \`Probe b = make(v2);\` — a prvalue returned: still one \`construct\`.
4. \`Probe c = pass(b);\` — \`b\` is copied into the parameter, the parameter is returned with an implicit move (never NRVO — it is a parameter), then the parameter is destroyed.
5. \`c = Probe(v3);\` — a temporary is constructed, move-assigned, destroyed.
6. \`const Probe k(v4);\` then \`Probe d = std::move(k);\` — a \`const\` object cannot be moved from: watch which event appears.
7. \`Probe e = std::move(a);\`
8. Print \`values a=<> b=<> c=<> d=<> e=<>\`.
9. Everything dies in reverse order.

**Input:** four integers.
**Output:** the trace, the values line, and six destroy lines.

\`\`\`text
1 2 3 7
\`\`\`
prints
\`\`\`text
construct #1=1
construct #2=2
copy #3 from #2
move #4 from #3
destroy #3
construct #5=3
move-assign #4 from #5
destroy #5
construct #6=7
copy #7 from #6
move #8 from #1
values a=0 b=2 c=3 d=7 e=1
destroy #8
destroy #7
destroy #6
destroy #4
destroy #2
destroy #1
\`\`\``,
          starter: String.raw`#include <iostream>
#include <utility>

struct Probe {
    static inline int next = 1;
    int id;
    int value;

    explicit Probe(int v) : id(next++), value(v) {
        std::cout << "construct #" << id << '=' << value << '\n';
    }
    // TODO: copy constructor — "copy #<id> from #<source>"
    // TODO: copy assignment — "copy-assign #<id> from #<source>", returns *this
    // TODO: move constructor (noexcept) — "move #<id> from #<source>", source value becomes 0
    // TODO: move assignment (noexcept) — "move-assign #<id> from #<source>", source zeroed, returns *this
    ~Probe() {
        std::cout << "destroy #" << id << '\n';
    }
};

// TODO: Probe make(int v) — return a prvalue
// TODO: Probe pass(Probe p) — return the parameter

int main() {
    int v1, v2, v3, v4;
    std::cin >> v1 >> v2 >> v3 >> v4;
    // TODO: steps 2 to 8
    return 0;
}
`,
          solution: String.raw`#include <iostream>
#include <utility>

struct Probe {
    static inline int next = 1;
    int id;
    int value;

    explicit Probe(int v) : id(next++), value(v) {
        std::cout << "construct #" << id << '=' << value << '\n';
    }
    Probe(const Probe& other) : id(next++), value(other.value) {
        std::cout << "copy #" << id << " from #" << other.id << '\n';
    }
    Probe& operator=(const Probe& other) {
        value = other.value;
        std::cout << "copy-assign #" << id << " from #" << other.id << '\n';
        return *this;
    }
    Probe(Probe&& other) noexcept : id(next++), value(std::exchange(other.value, 0)) {
        std::cout << "move #" << id << " from #" << other.id << '\n';
    }
    Probe& operator=(Probe&& other) noexcept {
        value = std::exchange(other.value, 0);
        std::cout << "move-assign #" << id << " from #" << other.id << '\n';
        return *this;
    }
    ~Probe() {
        std::cout << "destroy #" << id << '\n';
    }
};

Probe make(int v) {
    return Probe(v);
}

Probe pass(Probe p) {
    return p;
}

int main() {
    int v1, v2, v3, v4;
    std::cin >> v1 >> v2 >> v3 >> v4;

    Probe a = Probe(v1);
    Probe b = make(v2);
    Probe c = pass(b);
    c = Probe(v3);
    const Probe k(v4);
    Probe d = std::move(k);
    Probe e = std::move(a);

    std::cout << "values a=" << a.value << " b=" << b.value << " c=" << c.value
              << " d=" << d.value << " e=" << e.value << '\n';
    return 0;
}
`,
          hints: [
            "Only initialisations from an lvalue or an xvalue produce events; an initialisation from a prvalue of the same type builds the object in place.",
            "return p; for a by-value parameter is treated as return std::move(p): exactly one move, then the parameter is destroyed.",
            "std::move(k) yields const Probe&&, which only the copy constructor's const Probe& can bind to — so d is copied and k keeps its value.",
          ],
          cases: [
            { stdin: "1 2 3 7\n", expected: "construct #1=1\nconstruct #2=2\ncopy #3 from #2\nmove #4 from #3\ndestroy #3\nconstruct #5=3\nmove-assign #4 from #5\ndestroy #5\nconstruct #6=7\ncopy #7 from #6\nmove #8 from #1\nvalues a=0 b=2 c=3 d=7 e=1\ndestroy #8\ndestroy #7\ndestroy #6\ndestroy #4\ndestroy #2\ndestroy #1\n" },
            { stdin: "10 20 30 40\n", expected: "construct #1=10\nconstruct #2=20\ncopy #3 from #2\nmove #4 from #3\ndestroy #3\nconstruct #5=30\nmove-assign #4 from #5\ndestroy #5\nconstruct #6=40\ncopy #7 from #6\nmove #8 from #1\nvalues a=0 b=20 c=30 d=40 e=10\ndestroy #8\ndestroy #7\ndestroy #6\ndestroy #4\ndestroy #2\ndestroy #1\n" },
            { stdin: "-1 0 0 -1\n", expected: "construct #1=-1\nconstruct #2=0\ncopy #3 from #2\nmove #4 from #3\ndestroy #3\nconstruct #5=0\nmove-assign #4 from #5\ndestroy #5\nconstruct #6=-1\ncopy #7 from #6\nmove #8 from #1\nvalues a=0 b=0 c=0 d=-1 e=-1\ndestroy #8\ndestroy #7\ndestroy #6\ndestroy #4\ndestroy #2\ndestroy #1\n", hidden: true },
          ],
        },
        {
          title: "Sink parameters",
          prompt: `\`Inbox\` stores \`Probe\` objects in a \`std::vector\` and takes new ones through a **sink** parameter — \`void add(Probe p)\` — which it moves into the vector with \`items_.push_back(std::move(p))\`. The constructor reserves room for every item up front, so no reallocation ever happens and every event is fixed by the standard. Complete the five-special-member \`Probe\`, \`add\`, \`drain\` (which pops items from the back until the vector is empty, so the destruction order is defined) and \`total\`.

Read \`n\`, then \`n\` lines of \`<form> <value>\`, and call \`add\` in the matching way:

- \`copy v\`: in a block, \`Probe p(v); inbox.add(p);\` — the lvalue is copied into the parameter, the parameter is moved into the vector, the parameter dies, then \`p\` dies at the block's end;
- \`move v\`: in a block, \`Probe p(v); inbox.add(std::move(p));\` — moved into the parameter, moved into the vector;
- \`temp v\`: \`inbox.add(Probe(v));\` — the prvalue is built directly in the parameter (guaranteed elision), then moved into the vector.

After the loop print \`total=<sum of the stored values>\`, then \`inbox.drain()\`.

**Input:** \`n\`, then \`n\` lines.
**Output:** the trace, the total, and the \`n\` destroy lines from \`drain\`.

\`\`\`text
3
copy 5
move 6
temp 7
\`\`\`
prints
\`\`\`text
construct #1=5
copy #2 from #1
move #3 from #2
destroy #2
destroy #1
construct #4=6
move #5 from #4
move #6 from #5
destroy #5
destroy #4
construct #7=7
move #8 from #7
destroy #7
total=18
destroy #8
destroy #6
destroy #3
\`\`\``,
          starter: String.raw`#include <iostream>
#include <string>
#include <utility>
#include <vector>

struct Probe {
    static inline int next = 1;
    int id;
    int value;

    explicit Probe(int v) : id(next++), value(v) {
        std::cout << "construct #" << id << '=' << value << '\n';
    }
    // TODO: copy constructor, copy assignment, move constructor, move assignment
    //       (same events as the previous exercise)
    ~Probe() {
        std::cout << "destroy #" << id << '\n';
    }
};

class Inbox {
public:
    explicit Inbox(std::size_t capacity) { items_.reserve(capacity); }

    // TODO: void add(Probe p) — push the parameter into items_ with std::move
    // TODO: void drain() — pop_back until empty
    // TODO: long long total() const

private:
    std::vector<Probe> items_;
};

int main() {
    std::size_t n;
    std::cin >> n;
    Inbox inbox(n);
    for (std::size_t i = 0; i < n; ++i) {
        std::string form;
        int v;
        std::cin >> form >> v;
        // TODO: copy / move / temp
    }
    // TODO: print the total, then drain
    return 0;
}
`,
          solution: String.raw`#include <iostream>
#include <string>
#include <utility>
#include <vector>

struct Probe {
    static inline int next = 1;
    int id;
    int value;

    explicit Probe(int v) : id(next++), value(v) {
        std::cout << "construct #" << id << '=' << value << '\n';
    }
    Probe(const Probe& other) : id(next++), value(other.value) {
        std::cout << "copy #" << id << " from #" << other.id << '\n';
    }
    Probe& operator=(const Probe& other) {
        value = other.value;
        std::cout << "copy-assign #" << id << " from #" << other.id << '\n';
        return *this;
    }
    Probe(Probe&& other) noexcept : id(next++), value(std::exchange(other.value, 0)) {
        std::cout << "move #" << id << " from #" << other.id << '\n';
    }
    Probe& operator=(Probe&& other) noexcept {
        value = std::exchange(other.value, 0);
        std::cout << "move-assign #" << id << " from #" << other.id << '\n';
        return *this;
    }
    ~Probe() {
        std::cout << "destroy #" << id << '\n';
    }
};

class Inbox {
public:
    explicit Inbox(std::size_t capacity) { items_.reserve(capacity); }

    void add(Probe p) {
        items_.push_back(std::move(p));
    }

    void drain() {
        while (!items_.empty()) items_.pop_back();
    }

    long long total() const {
        long long sum = 0;
        for (const Probe& p : items_) sum += p.value;
        return sum;
    }

private:
    std::vector<Probe> items_;
};

int main() {
    std::size_t n;
    std::cin >> n;
    Inbox inbox(n);
    for (std::size_t i = 0; i < n; ++i) {
        std::string form;
        int v;
        std::cin >> form >> v;
        if (form == "copy") {
            Probe p(v);
            inbox.add(p);
        } else if (form == "move") {
            Probe p(v);
            inbox.add(std::move(p));
        } else {
            inbox.add(Probe(v));
        }
    }
    std::cout << "total=" << inbox.total() << '\n';
    inbox.drain();
    return 0;
}
`,
          hints: [
            "Inside add, p is a named object — an lvalue — so push_back(p) would copy; push_back(std::move(p)) moves.",
            "reserve(n) is what makes push_back's cost fixed: one move construction into the vector's storage and nothing else.",
            "pop_back destroys exactly the last element; a vector destroying itself may destroy elements in any order, which is why drain exists.",
          ],
          cases: [
            { stdin: "3\ncopy 5\nmove 6\ntemp 7\n", expected: "construct #1=5\ncopy #2 from #1\nmove #3 from #2\ndestroy #2\ndestroy #1\nconstruct #4=6\nmove #5 from #4\nmove #6 from #5\ndestroy #5\ndestroy #4\nconstruct #7=7\nmove #8 from #7\ndestroy #7\ntotal=18\ndestroy #8\ndestroy #6\ndestroy #3\n" },
            { stdin: "2\ntemp -4\ntemp 10\n", expected: "construct #1=-4\nmove #2 from #1\ndestroy #1\nconstruct #3=10\nmove #4 from #3\ndestroy #3\ntotal=6\ndestroy #4\ndestroy #2\n" },
            { stdin: "1\ncopy 9\n", expected: "construct #1=9\ncopy #2 from #1\nmove #3 from #2\ndestroy #2\ndestroy #1\ntotal=9\ndestroy #3\n", hidden: true },
            { stdin: "3\nmove 1\ncopy 2\nmove 3\n", expected: "construct #1=1\nmove #2 from #1\nmove #3 from #2\ndestroy #2\ndestroy #1\nconstruct #4=2\ncopy #5 from #4\nmove #6 from #5\ndestroy #5\ndestroy #4\nconstruct #7=3\nmove #8 from #7\nmove #9 from #8\ndestroy #8\ndestroy #7\ntotal=6\ndestroy #9\ndestroy #6\ndestroy #3\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "What is the value category of the expression `std::move(x)`?",
          options: ["lvalue", "prvalue", "xvalue", "It has no category; it is a function call"],
          answer: 2,
          explanation: "`std::move` returns `T&&`, and a function call returning an rvalue reference is an xvalue — an expression with identity whose resources may be reused. A call returning `T` by value would be a prvalue.",
        },
        {
          prompt: "Which of these expressions is a prvalue?",
          options: ["`a`", "`*p`", "`Probe(3)`", "`std::move(a)`"],
          answer: 2,
          explanation: "`Probe(3)` is a pure value with no object yet — it gets one only when something needs it. `a` and `*p` name objects (lvalues); `std::move(a)` is an xvalue.",
        },
        {
          prompt: "```cpp\nProbe make() { return Probe(1); }\nProbe b = make();\n```\nHow many copy or move constructions happen in C++17 and later?",
          options: ["Two: one for the return, one for `b`", "One: the return is elided, then `b` is moved", "Zero: initialising from a prvalue builds the object directly in `b`, guaranteed", "Zero on most compilers, but only as an optimisation"],
          answer: 2,
          explanation: "Since C++17 a prvalue initialises its target without any temporary; this is mandated, not optional, and it works even when the copy and move constructors are deleted. NRVO for a *named* local is the case that remains optional.",
        },
        {
          prompt: "What is wrong with `return std::move(local);` for a local variable of the function's return type?",
          options: ["Nothing; it is the recommended form", "It disables named return value optimisation and forces a move that `return local;` could have avoided entirely", "It copies instead of moving", "It returns a dangling reference"],
          answer: 1,
          explanation: "`std::move(local)` is an xvalue, not a name, so NRVO no longer applies. `return local;` already treats the local as an rvalue if it cannot be elided, so the explicit `std::move` can only make things worse; GCC and Clang warn with `-Wpessimizing-move`.",
        },
        {
          prompt: "```cpp\nconst Probe k(1);\nProbe m = std::move(k);\n```\nWhich constructor runs?",
          options: ["The move constructor", "The copy constructor: `std::move` on a `const` object yields `const Probe&&`, which cannot bind to `Probe&&`", "Neither — compile error", "The move constructor, after an implicit `const_cast`"],
          answer: 1,
          explanation: "A move must modify its source, so the move constructor takes a non-`const` rvalue reference. `const Probe&&` binds only to `const Probe&`, and overload resolution quietly picks the copy, with no diagnostic.",
        },
        {
          prompt: "```cpp\nstd::string makeGreeting();\nconst std::string& r = makeGreeting();\nstd::cout << r;\n```\nIs this safe?",
          options: ["No — the temporary dies at the semicolon and `r` dangles", "Yes — binding a temporary directly to a `const&` extends its lifetime to the reference's scope", "Yes, but only because `std::string` is small", "No — a `const&` cannot bind to a temporary"],
          answer: 1,
          explanation: "Lifetime extension applies to a temporary bound directly to a `const T&` or `T&&`. It does not reach through a member function: `const char* p = makeGreeting().c_str();` dangles immediately.",
        },
        {
          prompt: "```cpp\nProbe pass(Probe p) { return p; }\nProbe c = pass(b);\n```\nWhich events does the `return` statement itself produce?",
          options: ["None — NRVO builds `p` directly in `c`", "Exactly one move construction: a returned parameter is treated as an rvalue and never elided", "One copy construction, since `p` is an lvalue", "One move and one copy"],
          answer: 1,
          explanation: "NRVO is never applied to function parameters, and a `return` naming a by-value parameter performs the implicit move. The result is deterministic: one `move`, then the parameter's `destroy`. The initialisation of `c` from the call is a prvalue and elides.",
        },
      ],
    },
    {
      slug: "special-members-checkpoint",
      file: "06-checkpoint.md",
      kind: "test",
      passMark: 70,
      exercises: [
        {
          title: "A stack with the rule of five",
          prompt: `Write \`IntStack\`, a fixed-capacity stack of \`int\` that owns its storage through a raw pointer and implements all five special member functions. Events: the constructor prints \`allocate <capacity>\`; the copy constructor \`deep-copy <size>\`; the copy assignment \`copy-assign <size>\` (or \`self-assign\` for itself, doing nothing else); the move constructor \`move <size>\`; the move assignment \`move-assign <size>\` (or \`self-assign\`); the destructor \`release <capacity>\`. A copy takes the source's capacity and elements. A moved-from stack has a null pointer, capacity 0 and size 0 — so a push into it reports \`full\`, and it releases 0.

Read \`cap\`, then \`k\`, then \`k\` commands operating on two stacks \`a\` and \`b\`, both constructed with capacity \`cap\` (in that order):

- \`push X v\` — pushes; prints \`X: full\` if there is no room, nothing otherwise;
- \`pop X\` — prints \`X: popped <v>\` or \`X: empty\`;
- \`print X\` — prints \`X: size=<n> [<values bottom to top>]\`;
- \`copy X Y\` — \`X = Y\` (copy assignment; when \`X\` and \`Y\` are the same name it is a self-assignment);
- \`move X Y\` — \`X = std::move(Y)\`;
- \`clone X\` — in a block, copy-constructs a stack from \`X\` and prints it as \`clone: size=<n> [<values>]\`; the clone dies at the block's end.

At the end of \`main\` the two stacks are destroyed in reverse order.

**Input:** \`cap\`, \`k\`, then \`k\` command lines.
**Output:** the trace, as below.

\`\`\`text
2
8
push a 1
push a 2
push a 3
copy b a
pop b
move a b
print a
print b
\`\`\`
prints
\`\`\`text
allocate 2
allocate 2
a: full
copy-assign 2
b: popped 2
move-assign 1
a: size=1 [1]
b: size=0 []
release 0
release 2
\`\`\``,
          starter: String.raw`#include <algorithm>
#include <cstddef>
#include <iostream>
#include <string>
#include <utility>

class IntStack {
public:
    explicit IntStack(std::size_t capacity)
        : data_(new int[capacity]()), capacity_(capacity), size_(0) {
        std::cout << "allocate " << capacity_ << '\n';
    }
    // TODO: copy constructor, copy assignment, move constructor, move assignment, destructor

    bool push(int v) {
        if (size_ == capacity_) return false;
        data_[size_++] = v;
        return true;
    }
    bool pop(int& out) {
        if (size_ == 0) return false;
        out = data_[--size_];
        return true;
    }
    void print(const std::string& name) const {
        std::cout << name << ": size=" << size_ << " [";
        for (std::size_t i = 0; i < size_; ++i) {
            if (i > 0) std::cout << ' ';
            std::cout << data_[i];
        }
        std::cout << "]\n";
    }

private:
    int* data_;
    std::size_t capacity_;
    std::size_t size_;
};

int main() {
    std::size_t cap;
    std::size_t k;
    std::cin >> cap >> k;
    IntStack a(cap);
    IntStack b(cap);
    for (std::size_t i = 0; i < k; ++i) {
        std::string cmd, x;
        std::cin >> cmd >> x;
        IntStack& target = (x == "a") ? a : b;
        // TODO: the six commands
        (void)target;
    }
    return 0;
}
`,
          solution: String.raw`#include <algorithm>
#include <cstddef>
#include <iostream>
#include <string>
#include <utility>

class IntStack {
public:
    explicit IntStack(std::size_t capacity)
        : data_(new int[capacity]()), capacity_(capacity), size_(0) {
        std::cout << "allocate " << capacity_ << '\n';
    }

    IntStack(const IntStack& other)
        : data_(new int[other.capacity_]()), capacity_(other.capacity_), size_(other.size_) {
        std::copy_n(other.data_, size_, data_);
        std::cout << "deep-copy " << size_ << '\n';
    }

    IntStack& operator=(const IntStack& other) {
        if (this == &other) {
            std::cout << "self-assign\n";
            return *this;
        }
        int* fresh = new int[other.capacity_]();
        std::copy_n(other.data_, other.size_, fresh);
        delete[] data_;
        data_ = fresh;
        capacity_ = other.capacity_;
        size_ = other.size_;
        std::cout << "copy-assign " << size_ << '\n';
        return *this;
    }

    IntStack(IntStack&& other) noexcept
        : data_(std::exchange(other.data_, nullptr)),
          capacity_(std::exchange(other.capacity_, 0)),
          size_(std::exchange(other.size_, 0)) {
        std::cout << "move " << size_ << '\n';
    }

    IntStack& operator=(IntStack&& other) noexcept {
        if (this == &other) {
            std::cout << "self-assign\n";
            return *this;
        }
        delete[] data_;
        data_ = std::exchange(other.data_, nullptr);
        capacity_ = std::exchange(other.capacity_, 0);
        size_ = std::exchange(other.size_, 0);
        std::cout << "move-assign " << size_ << '\n';
        return *this;
    }

    ~IntStack() {
        std::cout << "release " << capacity_ << '\n';
        delete[] data_;
    }

    bool push(int v) {
        if (size_ == capacity_) return false;
        data_[size_++] = v;
        return true;
    }
    bool pop(int& out) {
        if (size_ == 0) return false;
        out = data_[--size_];
        return true;
    }
    void print(const std::string& name) const {
        std::cout << name << ": size=" << size_ << " [";
        for (std::size_t i = 0; i < size_; ++i) {
            if (i > 0) std::cout << ' ';
            std::cout << data_[i];
        }
        std::cout << "]\n";
    }

private:
    int* data_;
    std::size_t capacity_;
    std::size_t size_;
};

int main() {
    std::size_t cap;
    std::size_t k;
    std::cin >> cap >> k;
    IntStack a(cap);
    IntStack b(cap);
    for (std::size_t i = 0; i < k; ++i) {
        std::string cmd, x;
        std::cin >> cmd >> x;
        IntStack& target = (x == "a") ? a : b;
        if (cmd == "push") {
            int v;
            std::cin >> v;
            if (!target.push(v)) std::cout << x << ": full\n";
        } else if (cmd == "pop") {
            int v;
            if (target.pop(v)) std::cout << x << ": popped " << v << '\n';
            else std::cout << x << ": empty\n";
        } else if (cmd == "print") {
            target.print(x);
        } else if (cmd == "copy") {
            std::string y;
            std::cin >> y;
            IntStack& source = (y == "a") ? a : b;
            target = source;
        } else if (cmd == "move") {
            std::string y;
            std::cin >> y;
            IntStack& source = (y == "a") ? a : b;
            target = std::move(source);
        } else if (cmd == "clone") {
            IntStack c = target;
            c.print("clone");
        }
    }
    return 0;
}
`,
          hints: [
            "Bind the named stack to a reference once — IntStack& target = (x == \"a\") ? a : b; — and every command works on the reference; copy a a then goes through the self-assignment guard naturally.",
            "The copy constructor allocates other.capacity_ ints and copies only other.size_ of them; the move constructor's three std::exchange calls leave the source at nullptr, 0, 0.",
            "delete[] nullptr is fine, so a moved-from stack's destructor prints release 0 and needs no special case.",
          ],
          cases: [
            { stdin: "2\n8\npush a 1\npush a 2\npush a 3\ncopy b a\npop b\nmove a b\nprint a\nprint b\n", expected: "allocate 2\nallocate 2\na: full\ncopy-assign 2\nb: popped 2\nmove-assign 1\na: size=1 [1]\nb: size=0 []\nrelease 0\nrelease 2\n" },
            { stdin: "3\n7\npush a 4\npush a 5\nclone a\ncopy a a\npop b\nmove a a\nprint a\n", expected: "allocate 3\nallocate 3\ndeep-copy 2\nclone: size=2 [4 5]\nrelease 3\nself-assign\nb: empty\nself-assign\na: size=2 [4 5]\nrelease 3\nrelease 3\n" },
            { stdin: "1\n6\npush b 9\nmove a b\npush b 1\nprint a\nprint b\ncopy b a\n", expected: "allocate 1\nallocate 1\nmove-assign 1\nb: full\na: size=1 [9]\nb: size=0 []\ncopy-assign 1\nrelease 1\nrelease 1\n", hidden: true },
            { stdin: "0\n3\npush a 1\npop a\nprint a\n", expected: "allocate 0\nallocate 0\na: full\na: empty\na: size=0 []\nrelease 0\nrelease 0\n", hidden: true },
            { stdin: "2\n5\npush a -1\npush a -2\nmove b a\nclone b\npop a\n", expected: "allocate 2\nallocate 2\nmove-assign 2\ndeep-copy 2\nclone: size=2 [-1 -2]\nrelease 2\na: empty\nrelease 2\nrelease 0\n", hidden: true },
          ],
        },
        {
          title: "Predict the trace",
          prompt: `Write the five-special-member \`Probe\` from lesson 5 (events \`construct\`, \`copy\`, \`copy-assign\`, \`move\`, \`move-assign\`, \`destroy\`; a moved-from value becomes 0), \`struct Pair { Probe first; Probe second; };\` with no special members, \`Pair makePair(int x, int y)\` returning \`Pair{Probe(x), Probe(y)}\`, and \`Probe pick(const Pair& p, bool first)\` returning \`first ? p.first : p.second\` by value. Then write this driver and predict its trace **before** running it:

1. Read \`x y z\`.
2. \`Pair p = makePair(x, y);\`
3. \`Probe q = pick(p, x > y);\`
4. \`Pair r = p;\`
5. \`std::swap(p.first, p.second);\` — \`std::swap\` is one move construction and two move assignments through a temporary, which then dies.
6. \`r = std::move(p);\` — the generated move assignment moves the members in declaration order.
7. \`q = Probe(z);\`
8. Print \`p=(<first>,<second>) q=<value> r=(<first>,<second>)\` using the \`value\` members.
9. Everything dies in reverse order of construction.

**Input:** three integers.
**Output:** the trace, the values line, and five destroy lines.

\`\`\`text
1 3 5
\`\`\`
prints
\`\`\`text
construct #1=1
construct #2=3
copy #3 from #2
copy #4 from #1
copy #5 from #2
move #6 from #1
move-assign #1 from #2
move-assign #2 from #6
destroy #6
move-assign #4 from #1
move-assign #5 from #2
construct #7=5
move-assign #3 from #7
destroy #7
p=(0,0) q=5 r=(3,1)
destroy #5
destroy #4
destroy #3
destroy #2
destroy #1
\`\`\``,
          starter: String.raw`#include <iostream>
#include <utility>

struct Probe {
    static inline int next = 1;
    int id;
    int value;

    explicit Probe(int v) : id(next++), value(v) {
        std::cout << "construct #" << id << '=' << value << '\n';
    }
    // TODO: the four copy and move operations
    ~Probe() {
        std::cout << "destroy #" << id << '\n';
    }
};

// TODO: struct Pair, makePair, pick

int main() {
    int x, y, z;
    std::cin >> x >> y >> z;
    // TODO: steps 2 to 8
    return 0;
}
`,
          solution: String.raw`#include <iostream>
#include <utility>

struct Probe {
    static inline int next = 1;
    int id;
    int value;

    explicit Probe(int v) : id(next++), value(v) {
        std::cout << "construct #" << id << '=' << value << '\n';
    }
    Probe(const Probe& other) : id(next++), value(other.value) {
        std::cout << "copy #" << id << " from #" << other.id << '\n';
    }
    Probe& operator=(const Probe& other) {
        value = other.value;
        std::cout << "copy-assign #" << id << " from #" << other.id << '\n';
        return *this;
    }
    Probe(Probe&& other) noexcept : id(next++), value(std::exchange(other.value, 0)) {
        std::cout << "move #" << id << " from #" << other.id << '\n';
    }
    Probe& operator=(Probe&& other) noexcept {
        value = std::exchange(other.value, 0);
        std::cout << "move-assign #" << id << " from #" << other.id << '\n';
        return *this;
    }
    ~Probe() {
        std::cout << "destroy #" << id << '\n';
    }
};

struct Pair {
    Probe first;
    Probe second;
};

Pair makePair(int x, int y) {
    return Pair{Probe(x), Probe(y)};
}

Probe pick(const Pair& p, bool first) {
    return first ? p.first : p.second;
}

int main() {
    int x, y, z;
    std::cin >> x >> y >> z;

    Pair p = makePair(x, y);
    Probe q = pick(p, x > y);
    Pair r = p;
    std::swap(p.first, p.second);
    r = std::move(p);
    q = Probe(z);

    std::cout << "p=(" << p.first.value << ',' << p.second.value << ")"
              << " q=" << q.value
              << " r=(" << r.first.value << ',' << r.second.value << ")\n";
    return 0;
}
`,
          hints: [
            "Pair{Probe(x), Probe(y)} builds both members in place, and returning that prvalue builds p in place: two construct events and nothing else.",
            "In pick, the conditional expression is an lvalue of type const Probe, so the return value is copy-constructed from whichever member was chosen.",
            "std::swap(a, b) is T tmp(std::move(a)); a = std::move(b); b = std::move(tmp); — the temporary's id is the next one, and it is destroyed at the end of swap.",
          ],
          cases: [
            { stdin: "1 3 5\n", expected: "construct #1=1\nconstruct #2=3\ncopy #3 from #2\ncopy #4 from #1\ncopy #5 from #2\nmove #6 from #1\nmove-assign #1 from #2\nmove-assign #2 from #6\ndestroy #6\nmove-assign #4 from #1\nmove-assign #5 from #2\nconstruct #7=5\nmove-assign #3 from #7\ndestroy #7\np=(0,0) q=5 r=(3,1)\ndestroy #5\ndestroy #4\ndestroy #3\ndestroy #2\ndestroy #1\n" },
            { stdin: "9 2 0\n", expected: "construct #1=9\nconstruct #2=2\ncopy #3 from #1\ncopy #4 from #1\ncopy #5 from #2\nmove #6 from #1\nmove-assign #1 from #2\nmove-assign #2 from #6\ndestroy #6\nmove-assign #4 from #1\nmove-assign #5 from #2\nconstruct #7=0\nmove-assign #3 from #7\ndestroy #7\np=(0,0) q=0 r=(2,9)\ndestroy #5\ndestroy #4\ndestroy #3\ndestroy #2\ndestroy #1\n" },
            { stdin: "4 4 -4\n", expected: "construct #1=4\nconstruct #2=4\ncopy #3 from #2\ncopy #4 from #1\ncopy #5 from #2\nmove #6 from #1\nmove-assign #1 from #2\nmove-assign #2 from #6\ndestroy #6\nmove-assign #4 from #1\nmove-assign #5 from #2\nconstruct #7=-4\nmove-assign #3 from #7\ndestroy #7\np=(0,0) q=-4 r=(4,4)\ndestroy #5\ndestroy #4\ndestroy #3\ndestroy #2\ndestroy #1\n", hidden: true },
          ],
        },
        {
          title: "Shelves and unique_ptr",
          prompt: `Model two bookshelves that pass books between them, with **no special member functions anywhere** — the rule of zero. \`struct Book { std::string title; int pages; }\` with a two-argument constructor; \`class Shelf\` holds a name and a \`std::vector<std::unique_ptr<Book>>\`, and offers:

- \`void add(std::string title, int pages)\` — appends a book made with \`std::make_unique\`;
- \`std::unique_ptr<Book> take(std::size_t index)\` — removes and returns the book at \`index\` (0-based), or a null pointer when there is no such book;
- \`void give(std::unique_ptr<Book> book)\` — appends a book received by value (the caller must \`std::move\` it in);
- \`void print() const\` — \`<name>: books=<n> pages=<total>\`, then one line \`  <title> (<pages>)\` per book in shelf order.

The shelves are \`left\` and \`right\`. Read \`k\` and then \`k\` command lines:

- \`add <shelf> <pages> <title>\` — the title is the rest of the line and may contain spaces;
- \`move <from> <to> <index>\` — takes the book from one shelf and gives it to the other, printing \`moved <title> to <to>\`, or \`no book at <index>\` when \`take\` returns null;
- \`print <shelf>\`.

**Input:** \`k\`, then \`k\` lines.
**Output:** as below.

\`\`\`text
6
add left 412 Dune
add left 88 Emma
add right 300 The Hobbit
move left right 0
print left
print right
\`\`\`
prints
\`\`\`text
moved Dune to right
left: books=1 pages=88
  Emma (88)
right: books=2 pages=712
  The Hobbit (300)
  Dune (412)
\`\`\``,
          starter: String.raw`#include <iostream>
#include <memory>
#include <sstream>
#include <string>
#include <utility>
#include <vector>

struct Book {
    std::string title;
    int pages;
    Book(std::string t, int p) : title(std::move(t)), pages(p) {}
};

class Shelf {
public:
    explicit Shelf(std::string name) : name_(std::move(name)) {}

    // TODO: add, take, give, print — and no special member functions

private:
    std::string name_;
    std::vector<std::unique_ptr<Book>> books_;
};

int main() {
    std::size_t k;
    std::cin >> k;
    std::string rest;
    std::getline(std::cin, rest);
    Shelf left("left");
    Shelf right("right");
    for (std::size_t i = 0; i < k; ++i) {
        std::string line;
        std::getline(std::cin, line);
        std::istringstream in(line);
        std::string cmd;
        in >> cmd;
        // TODO: add / move / print
    }
    return 0;
}
`,
          solution: String.raw`#include <iostream>
#include <memory>
#include <sstream>
#include <string>
#include <utility>
#include <vector>

struct Book {
    std::string title;
    int pages;
    Book(std::string t, int p) : title(std::move(t)), pages(p) {}
};

class Shelf {
public:
    explicit Shelf(std::string name) : name_(std::move(name)) {}

    void add(std::string title, int pages) {
        books_.push_back(std::make_unique<Book>(std::move(title), pages));
    }

    std::unique_ptr<Book> take(std::size_t index) {
        if (index >= books_.size()) return nullptr;
        std::unique_ptr<Book> book = std::move(books_[index]);
        books_.erase(books_.begin() + static_cast<std::ptrdiff_t>(index));
        return book;
    }

    void give(std::unique_ptr<Book> book) {
        books_.push_back(std::move(book));
    }

    void print() const {
        long long total = 0;
        for (const auto& book : books_) total += book->pages;
        std::cout << name_ << ": books=" << books_.size() << " pages=" << total << '\n';
        for (const auto& book : books_) {
            std::cout << "  " << book->title << " (" << book->pages << ")\n";
        }
    }

private:
    std::string name_;
    std::vector<std::unique_ptr<Book>> books_;
};

int main() {
    std::size_t k;
    std::cin >> k;
    std::string rest;
    std::getline(std::cin, rest);
    Shelf left("left");
    Shelf right("right");
    auto shelf = [&](const std::string& name) -> Shelf& { return name == "left" ? left : right; };

    for (std::size_t i = 0; i < k; ++i) {
        std::string line;
        std::getline(std::cin, line);
        std::istringstream in(line);
        std::string cmd;
        in >> cmd;
        if (cmd == "add") {
            std::string name;
            int pages;
            in >> name >> pages >> std::ws;
            std::string title;
            std::getline(in, title);
            shelf(name).add(title, pages);
        } else if (cmd == "move") {
            std::string from, to;
            std::size_t index;
            in >> from >> to >> index;
            std::unique_ptr<Book> book = shelf(from).take(index);
            if (!book) {
                std::cout << "no book at " << index << '\n';
            } else {
                std::cout << "moved " << book->title << " to " << to << '\n';
                shelf(to).give(std::move(book));
            }
        } else if (cmd == "print") {
            std::string name;
            in >> name;
            shelf(name).print();
        }
    }
    return 0;
}
`,
          hints: [
            "After in >> name >> pages, skip the space with in >> std::ws and std::getline(in, title) takes the rest of the line.",
            "take moves the unique_ptr out of the vector slot and erases the (now null) slot; give receives the pointer by value, so the caller writes give(std::move(book)).",
            "Read the title from the book before giving it away — after std::move(book) the local pointer is null.",
          ],
          cases: [
            { stdin: "6\nadd left 412 Dune\nadd left 88 Emma\nadd right 300 The Hobbit\nmove left right 0\nprint left\nprint right\n", expected: "moved Dune to right\nleft: books=1 pages=88\n  Emma (88)\nright: books=2 pages=712\n  The Hobbit (300)\n  Dune (412)\n" },
            { stdin: "4\nadd right 120 A Short Book\nmove right left 0\nmove right left 0\nprint left\n", expected: "moved A Short Book to left\nno book at 0\nleft: books=1 pages=120\n  A Short Book (120)\n" },
            { stdin: "2\nprint left\nprint right\n", expected: "left: books=0 pages=0\nright: books=0 pages=0\n", hidden: true },
            { stdin: "7\nadd left 10 One\nadd left 20 Two\nadd left 30 Three\nmove left right 1\nmove left right 1\nprint left\nprint right\n", expected: "moved Two to right\nmoved Three to right\nleft: books=1 pages=10\n  One (10)\nright: books=2 pages=50\n  Two (20)\n  Three (30)\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "`Probe b = a;` and `b = a;` — which special member functions do these two lines call, in order?",
          options: ["Copy assignment, then copy assignment", "Copy constructor, then copy assignment", "Copy constructor, then copy constructor", "Default constructor, then copy assignment"],
          answer: 1,
          explanation: "The first line initialises a new object (copy constructor, despite the `=`); the second replaces the value of an existing one (copy assignment).",
        },
        {
          prompt: "In what order does the generated copy constructor copy a class's data members?",
          options: ["Alphabetically", "In declaration order", "In reverse declaration order", "In an order the compiler chooses per build"],
          answer: 1,
          explanation: "All generated memberwise operations follow declaration order; destruction is the reverse. The order is observable and fully specified.",
        },
        {
          prompt: "A class owns a `new[]` block through a raw pointer and declares only a destructor. What is wrong?",
          options: ["Nothing; the destructor frees the block", "Copies are shallow: two objects own one block and the second destructor double-deletes it", "The class cannot be constructed", "The destructor will not be called for heap objects"],
          answer: 1,
          explanation: "The rule of three: a class that needs a destructor for a resource needs copy operations that understand the same resource. The generated ones copy the pointer.",
        },
        {
          prompt: "```cpp\nstruct S {\n    Probe a;\n    Probe b;\n};\n```\nWhen an `S` is destroyed, in which order are `a` and `b` destroyed, and when?",
          options: ["`a` then `b`, before the destructor body", "`b` then `a`, after the destructor body", "`a` then `b`, after the destructor body", "Unspecified"],
          answer: 1,
          explanation: "Members are destroyed after the destructor body runs, in reverse declaration order — the mirror image of construction.",
        },
        {
          prompt: "Why does `IntBuffer& operator=(IntBuffer other)` in the copy-and-swap idiom take its parameter by value?",
          options: ["By-value parameters are faster than references", "So that the copy (or, for an rvalue argument, the move) happens in the parameter before the body runs, and the old contents leave with it", "Because `operator=` cannot take a reference", "To avoid needing a copy constructor"],
          answer: 1,
          explanation: "The parameter is a complete, independent object built by the copy or move constructor. The body only swaps, so the old block is released by the parameter's destructor and the operator never frees before it copies.",
        },
        {
          prompt: "Which statement about `std::move` is correct?",
          options: ["It transfers the contents of its argument to a new object", "It is a cast to `T&&` and performs no move; a move happens only if a move constructor or assignment is then selected", "It empties its argument", "It is only valid on temporaries"],
          answer: 1,
          explanation: "`std::move` changes the value category of an expression, nothing more. For a type with no move operations it selects the copy.",
        },
        {
          prompt: "After `std::vector<int> b = std::move(a);` and `std::string t = std::move(s);`, which is guaranteed?",
          options: ["Both `a` and `s` are empty", "`a` is empty; `s` is valid but unspecified", "`s` is empty; `a` is valid but unspecified", "Neither may be used again"],
          answer: 1,
          explanation: "The vector move constructor is specified to leave the source empty. `std::string` promises only a valid state. Both may be assigned to and reused.",
        },
        {
          prompt: "A move constructor is not marked `noexcept`. What is the practical consequence?",
          options: ["The class cannot be stored in a `std::vector`", "`std::vector` copies the elements when it reallocates instead of moving them", "The move constructor is never called", "The compiler emits an error"],
          answer: 1,
          explanation: "To keep the strong exception guarantee, `std::vector` uses `std::move_if_noexcept`, which falls back to copying for a move that might throw.",
        },
        {
          prompt: "Which declaration stops the compiler generating the move constructor and move assignment?",
          options: ["A user-declared default constructor", "A user-declared destructor, copy constructor or copy assignment", "A `static` data member", "A `const` member function"],
          answer: 1,
          explanation: "Any of the classic three switches the implicit moves off — including `= default` versions. The moves are not deleted, so `std::move` silently copies.",
        },
        {
          prompt: "A class declares `T(T&&) = default;` and nothing else about copying. What is `T b = a;`?",
          options: ["A copy", "A move", "A compile error: declaring a move deletes the copy operations", "A shallow copy with a warning"],
          answer: 2,
          explanation: "Declaring a move constructor or move assignment makes the copy constructor and copy assignment deleted; a type that only moves is presumed non-copyable.",
        },
        {
          prompt: "What is the rule of zero?",
          options: ["A class should have zero data members", "A class should declare none of the five special members and let members such as `std::string`, `std::vector` and `std::unique_ptr` own their resources", "A class should default all five special members to zero cost", "Every constructor should zero-initialise its members"],
          answer: 1,
          explanation: "Ownership lives in members that already know how to copy, move and destroy themselves; the class then gets correct memberwise operations without writing any.",
        },
        {
          prompt: "What is the value category of a function call that returns `Probe` by value?",
          options: ["lvalue", "prvalue", "xvalue", "glvalue"],
          answer: 1,
          explanation: "A call returning by value is a pure value with no object yet — a prvalue. Returning `T&` gives an lvalue; returning `T&&` gives an xvalue.",
        },
        {
          prompt: "A type has its copy and move constructors deleted. Which line still compiles?",
          options: ["`T b = a;`", "`T b = std::move(a);`", "`T b = T();`", "None of them"],
          answer: 2,
          explanation: "Initialising from a prvalue of the same type is guaranteed to construct the object in place since C++17, so no copy or move constructor is needed at all. The other two lines need one.",
        },
        {
          prompt: "```cpp\nProbe f() {\n    Probe local(1);\n    return std::move(local);\n}\n```\nWhat is the effect of the `std::move`?",
          options: ["It enables the move that `return local;` could not do", "It prevents NRVO and forces a move construction that `return local;` would usually have elided entirely", "It causes a copy", "It has no effect either way"],
          answer: 1,
          explanation: "`return local;` already treats the local as an rvalue when it is not elided, and is eligible for NRVO when it is. `std::move(local)` is not a name, so NRVO is off and the move is mandatory; compilers warn with `-Wpessimizing-move`.",
        },
      ],
    },
  ],
});

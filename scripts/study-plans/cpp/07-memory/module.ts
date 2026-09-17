import { defineModule } from "../../dsl.js";

export default defineModule(import.meta.url, {
  slug: "memory",
  title: "Memory, ownership and RAII",
  blurb: "Storage durations and the stack-frame picture, new/delete and the ownership contract, RAII and why C++ needs no finally, std::unique_ptr and std::shared_ptr with std::weak_ptr, and the memory-error catalogue with the sanitizers that find it.",
  icon: "memory",
  overview: `C++ has no garbage collector, and that is not a gap to work around but the reason the language can promise what it promises: every object lives somewhere definite for a span you can point to in the source, and its destructor runs at that moment — not later, not on a background thread, not maybe. This module is where that promise is made precise. It draws the stack of frames that automatic objects live in and the heap that \`new\` carves blocks from, separates a container's small handle from the elements it owns, and fixes the rule the rest of the track depends on: automatic objects are destroyed at the closing brace, in reverse order, on every path out — including the exception path.

The six lessons build up from the machine to the idiom. The memory model names the four storage durations and the lifetime rules. \`new\` and \`delete\` set out the ownership contract — one owner, one \`delete\`, every path — and the four ways a \`delete\` gets lost or doubled. RAII turns that contract into a type: acquire in the constructor, release in the destructor, and the language runs the cleanup for you, which is why C++ has no \`finally\` and needs none. \`std::unique_ptr\` is that type written once for everyone, move-only so a second owner is a compile error; \`std::shared_ptr\` counts owners through a control block, leaks on a cycle, and needs \`std::weak_ptr\` for every back-pointer. The last lesson catalogues the seven memory errors and reads AddressSanitizer, UBSan and Valgrind reports, then maps each error to the rule that prevents it.

Every exercise is a whole program whose destructor messages are in a fully defined order, so lifetimes are something you predict and then watch: a tracer that shows early returns and a function-local static, a recursion whose frames announce themselves, a buffer and a linked list that own raw memory with \`new[]\`/\`delete[]\` and \`new\`/\`delete\` and leak nothing, a scope logger that keeps printing through an exception, a commit-or-rollback transaction guard, a \`unique_ptr\` factory with a sink and a stack of owning nodes, an album whose tracks point back through \`weak_ptr\` while you print \`use_count()\`, an observer list that prunes expired listeners, a leak detector that audits an allocation ledger, and a bounds-checked buffer. The checkpoint adds a growable stack over raw storage, a ledger of shared handles, and a task pipeline where a scope guard and a factory's \`unique_ptr\` both meet the exception path.`,
  lessons: [
    {
      slug: "the-memory-model",
      file: "01-the-memory-model.md",
      exercises: [
        {
          title: "Three ways out of a function",
          prompt: `Make lifetimes visible. Complete \`Tracer\` so that its constructor prints \`ctor <name>\` and its destructor prints \`dtor <name>\`, then write \`classify(int x)\` exactly in this order:

1. declare \`Tracer a("a")\`;
2. declare a function-local \`static Tracer once("once")\`;
3. if \`x < 0\`, return \`"negative"\`;
4. declare \`Tracer b("b")\`;
5. if \`x == 0\`, return \`"zero"\`;
6. declare \`Tracer c("c")\`;
7. return \`"positive"\`.

\`main\` (given) reads \`n\`, declares \`Tracer m("main")\`, then reads \`n\` integers and prints \`classify(x)\` for each. Do not change \`main\`. The output is the trace the language defines: automatics die at the return in reverse order, the static is constructed once and destroyed after \`main\`'s own locals.

**Input:** \`n\`, then \`n\` integers.
**Output:** the trace lines and the \`n\` classification lines, in the order they happen.

\`\`\`text
2
-3
5
\`\`\`
prints
\`\`\`text
ctor main
ctor a
ctor once
dtor a
negative
ctor a
ctor b
ctor c
dtor c
dtor b
dtor a
positive
dtor main
dtor once
\`\`\``,
          starter: String.raw`#include <iostream>
#include <string>

struct Tracer {
    std::string name;
    explicit Tracer(const std::string& n) : name(n) {
        // TODO: print "ctor <name>"
    }
    ~Tracer() {
        // TODO: print "dtor <name>"
    }
};

std::string classify(int x) {
    // TODO: Tracer a, then the function-local static Tracer once,
    //       "negative" for x < 0, then Tracer b, "zero" for x == 0,
    //       then Tracer c and "positive"
    return "";
}

int main() {
    int n;
    std::cin >> n;
    Tracer m("main");
    for (int i = 0; i < n; ++i) {
        int x;
        std::cin >> x;
        std::cout << classify(x) << '\n';
    }
    return 0;
}
`,
          solution: String.raw`#include <iostream>
#include <string>

struct Tracer {
    std::string name;
    explicit Tracer(const std::string& n) : name(n) {
        std::cout << "ctor " << name << '\n';
    }
    ~Tracer() {
        std::cout << "dtor " << name << '\n';
    }
};

std::string classify(int x) {
    Tracer a("a");
    static Tracer once("once");
    if (x < 0) return "negative";
    Tracer b("b");
    if (x == 0) return "zero";
    Tracer c("c");
    return "positive";
}

int main() {
    int n;
    std::cin >> n;
    Tracer m("main");
    for (int i = 0; i < n; ++i) {
        int x;
        std::cin >> x;
        std::cout << classify(x) << '\n';
    }
    return 0;
}
`,
          hints: [
            "The classification line prints after the call returns, so every dtor line of that call comes before it.",
            "A function-local static is constructed the first time control reaches its declaration and never again.",
            "Objects declared after an early return are never constructed on that path, so they are not destroyed either.",
          ],
          cases: [
            { stdin: "2\n-3\n5\n", expected: "ctor main\nctor a\nctor once\ndtor a\nnegative\nctor a\nctor b\nctor c\ndtor c\ndtor b\ndtor a\npositive\ndtor main\ndtor once\n" },
            { stdin: "1\n0\n", expected: "ctor main\nctor a\nctor once\nctor b\ndtor b\ndtor a\nzero\ndtor main\ndtor once\n" },
            { stdin: "3\n7\n0\n-1\n", expected: "ctor main\nctor a\nctor once\nctor b\nctor c\ndtor c\ndtor b\ndtor a\npositive\nctor a\nctor b\ndtor b\ndtor a\nzero\nctor a\ndtor a\nnegative\ndtor main\ndtor once\n", hidden: true },
            { stdin: "0\n", expected: "ctor main\ndtor main\n", hidden: true },
          ],
        },
        {
          title: "Frames that announce themselves",
          prompt: `Trace a recursion's stack frames with an automatic object. Write \`long long fact(int n)\` computing \`n!\` recursively (\`fact(0)\` is 1), and inside it declare a \`Frame\` whose constructor prints \`enter fact(<n>)\` and whose destructor prints \`leave fact(<n>) = <result>\`. To do that, declare the local \`long long result\` **before** the \`Frame\` and give the \`Frame\` a reference to it: because automatics are destroyed in reverse order of declaration, the frame is destroyed while \`result\` is still alive, so the destructor can print the value the function is about to return.

After the recursion \`main\` prints \`<n>! = <value>\`.

**Input:** one integer \`n\`, 0 ≤ n ≤ 20.
**Output:** the enter/leave trace, then the result line.

\`\`\`text
3
\`\`\`
prints
\`\`\`text
enter fact(3)
enter fact(2)
enter fact(1)
enter fact(0)
leave fact(0) = 1
leave fact(1) = 1
leave fact(2) = 2
leave fact(3) = 6
3! = 6
\`\`\``,
          starter: String.raw`#include <iostream>

struct Frame {
    int n;
    const long long& result;
    Frame(int n_, const long long& r) : n(n_), result(r) {
        // TODO: print "enter fact(<n>)"
    }
    ~Frame() {
        // TODO: print "leave fact(<n>) = <result>"
    }
};

long long fact(int n) {
    long long result = 0;
    // TODO: declare the Frame, then compute result recursively
    return result;
}

int main() {
    int n;
    std::cin >> n;
    long long value = fact(n);
    std::cout << n << "! = " << value << '\n';
    return 0;
}
`,
          solution: String.raw`#include <iostream>

struct Frame {
    int n;
    const long long& result;
    Frame(int n_, const long long& r) : n(n_), result(r) {
        std::cout << "enter fact(" << n << ")\n";
    }
    ~Frame() {
        std::cout << "leave fact(" << n << ") = " << result << '\n';
    }
};

long long fact(int n) {
    long long result = 0;
    Frame frame(n, result);
    if (n == 0) {
        result = 1;
    } else {
        result = n * fact(n - 1);
    }
    return result;
}

int main() {
    int n;
    std::cin >> n;
    long long value = fact(n);
    std::cout << n << "! = " << value << '\n';
    return 0;
}
`,
          hints: [
            "Every enter line prints on the way down, every leave line on the way up, innermost first.",
            "Assign to result before the return statement; the destructor runs after the return value has been copied out.",
            "20! is 2432902008176640000, which needs long long — an int overflows at 13!.",
          ],
          cases: [
            { stdin: "3\n", expected: "enter fact(3)\nenter fact(2)\nenter fact(1)\nenter fact(0)\nleave fact(0) = 1\nleave fact(1) = 1\nleave fact(2) = 2\nleave fact(3) = 6\n3! = 6\n" },
            { stdin: "0\n", expected: "enter fact(0)\nleave fact(0) = 1\n0! = 1\n" },
            { stdin: "5\n", expected: "enter fact(5)\nenter fact(4)\nenter fact(3)\nenter fact(2)\nenter fact(1)\nenter fact(0)\nleave fact(0) = 1\nleave fact(1) = 1\nleave fact(2) = 2\nleave fact(3) = 6\nleave fact(4) = 24\nleave fact(5) = 120\n5! = 120\n", hidden: true },
            { stdin: "20\n", expected: "enter fact(20)\nenter fact(19)\nenter fact(18)\nenter fact(17)\nenter fact(16)\nenter fact(15)\nenter fact(14)\nenter fact(13)\nenter fact(12)\nenter fact(11)\nenter fact(10)\nenter fact(9)\nenter fact(8)\nenter fact(7)\nenter fact(6)\nenter fact(5)\nenter fact(4)\nenter fact(3)\nenter fact(2)\nenter fact(1)\nenter fact(0)\nleave fact(0) = 1\nleave fact(1) = 1\nleave fact(2) = 2\nleave fact(3) = 6\nleave fact(4) = 24\nleave fact(5) = 120\nleave fact(6) = 720\nleave fact(7) = 5040\nleave fact(8) = 40320\nleave fact(9) = 362880\nleave fact(10) = 3628800\nleave fact(11) = 39916800\nleave fact(12) = 479001600\nleave fact(13) = 6227020800\nleave fact(14) = 87178291200\nleave fact(15) = 1307674368000\nleave fact(16) = 20922789888000\nleave fact(17) = 355687428096000\nleave fact(18) = 6402373705728000\nleave fact(19) = 121645100408832000\nleave fact(20) = 2432902008176640000\n20! = 2432902008176640000\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "What does this print?\n\n```cpp\nstruct T {\n    char c;\n    T(char ch) : c(ch) { std::cout << c; }\n    ~T() { std::cout << '~' << c; }\n};\nint main() {\n    T a('a');\n    { T b('b'); }\n    T c('c');\n}\n```",
          options: ["`ab~bc~c~a`", "`abc~a~b~c`", "`ab~bc~a~c`", "`abc~c~b~a`"],
          answer: 0,
          explanation: "`b` lives only in the inner block, so `~b` prints at that block's closing brace, before `c` is even constructed. At `main`'s end the remaining automatics go in reverse order of declaration: `~c` then `~a`.",
        },
        {
          prompt: "Inside a function, `std::vector<int> v(1000);` is declared. Where do the 1000 elements live?",
          options: ["On the stack, in the same frame as `v`", "On the heap, in a block that `v`'s handle owns and frees in its destructor", "In static storage, because the size is a constant", "On the stack until the vector grows, then on the heap"],
          answer: 1,
          explanation: "The variable `v` is a small handle in the frame; the elements are a heap block it allocated. Destroying `v` frees the block, which is why you never `delete` a vector's elements. The size being a constant changes nothing about where the block is.",
        },
        {
          prompt: "Which statement about a function-local `static Tracer t(\"s\");` is correct?",
          options: ["It is constructed before `main` starts, like a global", "It is constructed the first time control passes its declaration and destroyed after `main` returns", "It is constructed on every call and destroyed on every return", "It is never destroyed"],
          answer: 1,
          explanation: "A function-local static is initialised once, lazily, when the declaration is first reached — never at all if the function is never called — and its destructor runs during program exit, after `main`'s automatics are gone. A global is the one initialised before `main`.",
        },
        {
          prompt: "What happens here?\n\n```cpp\nint* make() {\n    int x = 7;\n    return &x;\n}\nint main() {\n    int* p = make();\n    std::cout << *p;\n}\n```",
          options: ["Prints `7`", "Prints `0`", "Undefined behaviour — `p` points into a frame that no longer exists", "Compile error"],
          answer: 2,
          explanation: "`x` lives in `make`'s frame, which is popped on return; `p` dangles. The compiler warns (\"address of local variable returned\") but compiles, and whatever prints is an accident of what reused the stack slot.",
        },
        {
          prompt: "When does the destructor of an object created with `new` run?",
          options: ["When the pointer variable holding its address goes out of scope", "When `delete` is applied to a pointer to it", "Automatically at program exit", "When the last raw pointer to it is overwritten"],
          answer: 1,
          explanation: "A dynamic object's lifetime ends only at `delete`. Pointers going out of scope or being overwritten change nothing about the object — that is a leak, and the destructor then never runs, not even at exit.",
        },
        {
          prompt: "`v` is a `std::vector<int>` whose size equals its capacity. What is true of `int* p = &v[0]; v.push_back(9); std::cout << *p;`?",
          options: ["Prints the first element — `push_back` only adds at the end", "Undefined behaviour — the elements may have moved to a new block and `p` points into the old one", "Compile error", "Prints `9`"],
          answer: 1,
          explanation: "A full vector reallocates on `push_back`: a bigger block is obtained, the elements copied across and the old block freed. `p` still holds the old address. Keep an index across insertions, never a pointer or reference.",
        },
      ],
    },
    {
      slug: "new-and-delete",
      file: "02-new-and-delete.md",
      exercises: [
        {
          title: "A buffer that frees itself",
          prompt: `Complete \`IntBuffer\`, a class that owns \`n\` ints obtained with \`new int[n]{}\` and releases them with \`delete[]\` in its destructor, which then prints \`released <n> ints\`. Copying is deleted (two owners would be a double delete). \`at(i)\` returns a reference to element \`i\` and throws \`std::out_of_range\` when \`i\` is not below \`size()\`.

\`main\` reads \`n\` and then \`n\` integers into the buffer. If \`n\` is 0 print \`empty\` and return early — the destructor must still run. Otherwise print \`sum=<sum> min=<min> max=<max>\` (the sum in \`long long\`), then \`reversed:\` followed by the elements last to first, one space before each.

**Input:** \`n\`, then \`n\` integers.
**Output:** two lines (or \`empty\`), then the destructor's line.

\`\`\`text
4
3 -1 7 2
\`\`\`
prints
\`\`\`text
sum=11 min=-1 max=7
reversed: 2 7 -1 3
released 4 ints
\`\`\``,
          starter: String.raw`#include <cstddef>
#include <iostream>
#include <stdexcept>

class IntBuffer {
public:
    explicit IntBuffer(std::size_t n) : size_(n), data_(nullptr) {
        // TODO: allocate n value-initialised ints
    }
    ~IntBuffer() {
        // TODO: release the block, then print "released <n> ints"
    }
    IntBuffer(const IntBuffer&) = delete;
    IntBuffer& operator=(const IntBuffer&) = delete;

    std::size_t size() const { return size_; }
    int& at(std::size_t i) {
        // TODO: throw std::out_of_range when i >= size_
        return data_[i];
    }

private:
    std::size_t size_;
    int* data_;
};

int main() {
    std::size_t n;
    std::cin >> n;
    IntBuffer buf(n);
    // TODO: read the values, handle n == 0, print the statistics and the reversed line
    return 0;
}
`,
          solution: String.raw`#include <cstddef>
#include <iostream>
#include <stdexcept>

class IntBuffer {
public:
    explicit IntBuffer(std::size_t n) : size_(n), data_(new int[n]{}) {}
    ~IntBuffer() {
        delete[] data_;
        std::cout << "released " << size_ << " ints\n";
    }
    IntBuffer(const IntBuffer&) = delete;
    IntBuffer& operator=(const IntBuffer&) = delete;

    std::size_t size() const { return size_; }
    int& at(std::size_t i) {
        if (i >= size_) throw std::out_of_range("IntBuffer::at");
        return data_[i];
    }

private:
    std::size_t size_;
    int* data_;
};

int main() {
    std::size_t n;
    std::cin >> n;
    IntBuffer buf(n);
    for (std::size_t i = 0; i < buf.size(); ++i) std::cin >> buf.at(i);
    if (n == 0) {
        std::cout << "empty\n";
        return 0;
    }
    long long sum = 0;
    int lo = buf.at(0);
    int hi = buf.at(0);
    for (std::size_t i = 0; i < buf.size(); ++i) {
        const int x = buf.at(i);
        sum += x;
        if (x < lo) lo = x;
        if (x > hi) hi = x;
    }
    std::cout << "sum=" << sum << " min=" << lo << " max=" << hi << '\n';
    std::cout << "reversed:";
    for (std::size_t i = buf.size(); i-- > 0;) std::cout << ' ' << buf.at(i);
    std::cout << '\n';
    return 0;
}
`,
          hints: [
            "new int[n]{} with the braces zero-fills; new int[0] is legal and delete[] on it is fine.",
            "The early return for n == 0 is deliberate: the destructor runs on that path too, so released 0 ints must appear.",
            "Count down with for (std::size_t i = n; i-- > 0;) — an unsigned i >= 0 never ends.",
          ],
          cases: [
            { stdin: "4\n3 -1 7 2\n", expected: "sum=11 min=-1 max=7\nreversed: 2 7 -1 3\nreleased 4 ints\n" },
            { stdin: "1\n42\n", expected: "sum=42 min=42 max=42\nreversed: 42\nreleased 1 ints\n" },
            { stdin: "0\n", expected: "empty\nreleased 0 ints\n", hidden: true },
            { stdin: "3\n2000000000 2000000000 -5\n", expected: "sum=3999999995 min=-5 max=2000000000\nreversed: -5 2000000000 2000000000\nreleased 3 ints\n", hidden: true },
          ],
        },
        {
          title: "A list that frees its nodes",
          prompt: `Build a singly linked list from raw \`new\`/\`delete\` and prove it leaks nothing. \`IntList\` owns \`Node\`s allocated with \`new Node{value, nullptr}\`; \`push_back\` appends, \`remove(v)\` deletes every node whose value is \`v\` and returns how many it deleted, \`print\` shows the list, and the destructor deletes every remaining node and prints \`freed <count> nodes\`.

Read a target value \`t\`, then integers until the input ends, appending each. Print the list as \`list: 1 -> 2 -> 3\` (\`list: (empty)\` when empty), then \`removed <k> nodes\` after removing every \`t\`, then the list again. The destructor's line comes last.

**Input:** \`t\`, then zero or more integers.
**Output:** four lines.

\`\`\`text
2
5 2 7 2
\`\`\`
prints
\`\`\`text
list: 5 -> 2 -> 7 -> 2
removed 2 nodes
list: 5 -> 7
freed 2 nodes
\`\`\``,
          starter: String.raw`#include <iostream>

struct Node {
    int value;
    Node* next;
};

class IntList {
public:
    IntList() = default;
    ~IntList() {
        // TODO: delete every node, counting them, then print "freed <count> nodes"
    }
    IntList(const IntList&) = delete;
    IntList& operator=(const IntList&) = delete;

    void push_back(int v) {
        // TODO: append a new node; keep tail_ up to date
    }

    int remove(int v) {
        // TODO: unlink and delete every node holding v; return how many
        return 0;
    }

    void print() const {
        // TODO: "list: a -> b -> c" or "list: (empty)"
    }

private:
    Node* head_ = nullptr;
    Node* tail_ = nullptr;
};

int main() {
    int target;
    std::cin >> target;
    IntList list;
    int v;
    while (std::cin >> v) list.push_back(v);
    list.print();
    std::cout << "removed " << list.remove(target) << " nodes\n";
    list.print();
    return 0;
}
`,
          solution: String.raw`#include <iostream>

struct Node {
    int value;
    Node* next;
};

class IntList {
public:
    IntList() = default;
    ~IntList() {
        int freed = 0;
        Node* cur = head_;
        while (cur != nullptr) {
            Node* next = cur->next;   // read the link before the node is gone
            delete cur;
            cur = next;
            ++freed;
        }
        std::cout << "freed " << freed << " nodes\n";
    }
    IntList(const IntList&) = delete;
    IntList& operator=(const IntList&) = delete;

    void push_back(int v) {
        Node* node = new Node{v, nullptr};
        if (tail_ == nullptr) {
            head_ = node;
        } else {
            tail_->next = node;
        }
        tail_ = node;
    }

    int remove(int v) {
        int removed = 0;
        Node** link = &head_;             // the pointer that currently points at *link
        while (*link != nullptr) {
            if ((*link)->value == v) {
                Node* doomed = *link;
                *link = doomed->next;     // unlink first …
                delete doomed;            // … then free
                ++removed;
            } else {
                link = &(*link)->next;
            }
        }
        tail_ = nullptr;
        for (Node* cur = head_; cur != nullptr; cur = cur->next) tail_ = cur;
        return removed;
    }

    void print() const {
        std::cout << "list:";
        if (head_ == nullptr) {
            std::cout << " (empty)\n";
            return;
        }
        for (Node* cur = head_; cur != nullptr; cur = cur->next) {
            std::cout << ' ' << cur->value;
            if (cur->next != nullptr) std::cout << " ->";
        }
        std::cout << '\n';
    }

private:
    Node* head_ = nullptr;
    Node* tail_ = nullptr;
};

int main() {
    int target;
    std::cin >> target;
    IntList list;
    int v;
    while (std::cin >> v) list.push_back(v);
    list.print();
    std::cout << "removed " << list.remove(target) << " nodes\n";
    list.print();
    return 0;
}
`,
          hints: [
            "In the destructor, copy cur->next into a local before delete cur — reading a member of a deleted node is use after free.",
            "For remove, walk with a Node** that points at the link to fix (starting at &head_), or keep a prev pointer; both work.",
            "After removing, recompute tail_ by walking to the last node, or the next push_back appends to a deleted node.",
          ],
          cases: [
            { stdin: "2\n5 2 7 2\n", expected: "list: 5 -> 2 -> 7 -> 2\nremoved 2 nodes\nlist: 5 -> 7\nfreed 2 nodes\n" },
            { stdin: "9\n1 2 3\n", expected: "list: 1 -> 2 -> 3\nremoved 0 nodes\nlist: 1 -> 2 -> 3\nfreed 3 nodes\n" },
            { stdin: "4\n", expected: "list: (empty)\nremoved 0 nodes\nlist: (empty)\nfreed 0 nodes\n", hidden: true },
            { stdin: "1\n1 1 1\n", expected: "list: 1 -> 1 -> 1\nremoved 3 nodes\nlist: (empty)\nfreed 0 nodes\n", hidden: true },
            { stdin: "3\n3 8 3 9 3\n", expected: "list: 3 -> 8 -> 3 -> 9 -> 3\nremoved 3 nodes\nlist: 8 -> 9\nfreed 2 nodes\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "Which allocation and release are correctly paired?",
          options: ["`int* p = new int[10];` … `delete p;`", "`int* p = new int;` … `delete[] p;`", "`int* p = new int[10];` … `delete[] p;`", "`int* p = static_cast<int*>(std::malloc(40));` … `delete p;`"],
          answer: 2,
          explanation: "The array form must be released with `delete[]`, the single-object form with `delete`, and `malloc` memory only with `free`. Every other pairing is undefined behaviour, whatever it appears to do today.",
        },
        {
          prompt: "What does this do?\n\n```cpp\nint* p = new int;\nstd::cout << *p;\ndelete p;\n```",
          options: ["Prints `0` — heap memory is zeroed", "Compile error: `p` is uninitialised", "Undefined behaviour — `new int` without an initialiser leaves the value indeterminate", "Prints a random number, then crashes at `delete`"],
          answer: 2,
          explanation: "`new int` (no initialiser) does not initialise; reading the value is undefined. `new int{}` or `new int()` gives 0. The `delete` itself is fine — the bug is the read, and it need not crash or look random.",
        },
        {
          prompt: "What does `new` do when the allocator cannot supply the memory?",
          options: ["Returns `nullptr`", "Throws `std::bad_alloc`", "Returns a pointer to zeroed memory of a smaller size", "Calls `std::terminate` immediately"],
          answer: 1,
          explanation: "Plain `new` throws `std::bad_alloc`; only the `new (std::nothrow)` form returns null. Checking a plain `new` result against `nullptr` is dead code inherited from C's `malloc`.",
        },
        {
          prompt: "When does this function leak?\n\n```cpp\nvoid f(int n) {\n    int* a = new int[n]{};\n    if (n == 0) return;\n    delete[] a;\n}\n```",
          options: ["Never — `new int[0]` allocates nothing", "Only when `n == 0`: the early return skips the `delete[]`", "Always — `new int[n]{}` cannot be released with `delete[]`", "Only when `n > 0`"],
          answer: 1,
          explanation: "`new int[0]` is a real allocation that must be released, and the `return` before `delete[]` skips it. A block of zero ints is still a block; putting the pointer in a class with a destructor is what makes the early return safe.",
        },
        {
          prompt: "What is `int* p = new int(1); int* q = p; delete p; delete q;`?",
          options: ["Fine — each pointer is released once", "A double delete: one block freed twice, undefined behaviour", "A leak: `q` was never allocated", "A compile error, because `q` is not the owner"],
          answer: 1,
          explanation: "`p` and `q` hold the same address; the compiler has no notion of which owns it. The second `delete` hands the allocator a block it already has. Two copies of an owning pointer is exactly the situation `unique_ptr` makes impossible.",
        },
        {
          prompt: "Why is `delete p; p = nullptr;` an incomplete fix for a double-delete bug?",
          options: ["`delete nullptr` is itself undefined behaviour", "It only protects deletes through `p`; other copies of the address still delete the block, and the second owner is left undiagnosed", "`nullptr` cannot be assigned to an `int*`", "It turns the double delete into a leak"],
          answer: 1,
          explanation: "`delete nullptr` is a defined no-op, so nulling `p` does guard *that* variable — but the bug was two owners, and the other one is untouched. Fix the ownership; don't paper over the symptom.",
        },
        {
          prompt: "Which is the modern replacement for `int* a = new int[n]; … delete[] a;` when `n` is read at run time?",
          options: ["`std::vector<int> a(n);`", "`int a[n];`", "`std::array<int, n> a;`", "`int* a = static_cast<int*>(std::malloc(n * sizeof(int)));`"],
          answer: 0,
          explanation: "`std::vector` owns a heap block of run-time size and frees it in its destructor. `int a[n]` is a variable-length array, a GCC extension that is not C++; `std::array` needs a compile-time size; `malloc` is the C version of the same manual contract.",
        },
      ],
    },
    {
      slug: "raii",
      file: "03-raii.md",
      exercises: [
        {
          title: "A scope logger that survives exceptions",
          prompt: `Write \`ScopeLog\`, an RAII logger: its constructor prints \`begin <name>\` and its destructor prints \`end <name>\`, each indented by two spaces per nesting depth. Drive it from input with a recursive \`run(depth)\` that reads commands:

- \`enter <name>\` — declare a \`ScopeLog\` for \`name\` at the current depth and call \`run(depth + 1)\` **inside the same block**, so the log ends when the nested run returns;
- \`leave\` — return from the current \`run\`;
- \`say <word>\` — print \`word\` indented by two spaces per depth;
- \`fail <reason>\` — \`throw std::runtime_error(reason)\`.

\`main\` (given) calls \`run(0)\` inside a \`try\` and prints \`caught: <reason>\` if the exception arrives. A \`leave\` at depth 0 ends the run; so does the end of input, and every open scope must still print its \`end\` line — by returning, or by unwinding. Do not write any \`end\` line by hand: the destructors do it.

**Input:** commands, one per line.
**Output:** the log.

\`\`\`text
enter load
say reading
enter parse
say tokens
leave
enter validate
fail bad-header
leave
say never
\`\`\`
prints
\`\`\`text
begin load
  reading
  begin parse
    tokens
  end parse
  begin validate
  end validate
end load
caught: bad-header
\`\`\``,
          starter: String.raw`#include <iostream>
#include <stdexcept>
#include <string>

struct ScopeLog {
    std::string name;
    int depth;
    ScopeLog(const std::string& n, int d) : name(n), depth(d) {
        // TODO: print "begin <name>" indented by 2 * depth spaces
    }
    ~ScopeLog() {
        // TODO: print "end <name>" indented by 2 * depth spaces
    }
};

void run(int depth) {
    std::string cmd;
    while (std::cin >> cmd) {
        // TODO: enter / leave / say / fail
        (void)depth;
    }
}

int main() {
    try {
        run(0);
    } catch (const std::runtime_error& e) {
        std::cout << "caught: " << e.what() << '\n';
    }
    return 0;
}
`,
          solution: String.raw`#include <iostream>
#include <stdexcept>
#include <string>

struct ScopeLog {
    std::string name;
    int depth;
    ScopeLog(const std::string& n, int d) : name(n), depth(d) {
        std::cout << std::string(2 * depth, ' ') << "begin " << name << '\n';
    }
    ~ScopeLog() {
        std::cout << std::string(2 * depth, ' ') << "end " << name << '\n';
    }
};

void run(int depth) {
    std::string cmd;
    while (std::cin >> cmd) {
        if (cmd == "enter") {
            std::string name;
            std::cin >> name;
            ScopeLog log(name, depth);
            run(depth + 1);
        } else if (cmd == "leave") {
            return;
        } else if (cmd == "say") {
            std::string word;
            std::cin >> word;
            std::cout << std::string(2 * depth, ' ') << word << '\n';
        } else if (cmd == "fail") {
            std::string reason;
            std::cin >> reason;
            throw std::runtime_error(reason);
        }
    }
}

int main() {
    try {
        run(0);
    } catch (const std::runtime_error& e) {
        std::cout << "caught: " << e.what() << '\n';
    }
    return 0;
}
`,
          hints: [
            "std::string(2 * depth, ' ') builds the indentation.",
            "The ScopeLog for enter must be a local of the if block that calls run(depth + 1), so it dies when that call returns.",
            "You write nothing for the exception path: unwinding destroys every open ScopeLog before main's catch runs, so the end lines precede caught.",
          ],
          cases: [
            { stdin: "enter load\nsay reading\nenter parse\nsay tokens\nleave\nenter validate\nfail bad-header\nleave\nsay never\n", expected: "begin load\n  reading\n  begin parse\n    tokens\n  end parse\n  begin validate\n  end validate\nend load\ncaught: bad-header\n" },
            { stdin: "enter a\nenter b\nsay deep\n", expected: "begin a\n  begin b\n    deep\n  end b\nend a\n" },
            { stdin: "say hello\nfail at-top\nsay never\n", expected: "hello\ncaught: at-top\n", hidden: true },
            { stdin: "enter x\nleave\nenter y\nleave\nleave\nsay ignored\n", expected: "begin x\nend x\nbegin y\nend y\n", hidden: true },
            { stdin: "enter a\nenter b\nenter c\nfail deep\n", expected: "begin a\n  begin b\n    begin c\n    end c\n  end b\nend a\ncaught: deep\n", hidden: true },
          ],
        },
        {
          title: "Commit or roll back",
          prompt: `Write \`Transaction\`, a guard that snapshots a \`long long& balance\` in its constructor and restores the snapshot in its destructor unless \`commit()\` was called. Then process a ledger with it.

The first line is the starting balance. Each following line is a transaction: zero or more integers (deposits and withdrawals) optionally followed by \`commit\` or \`abort\`. For each line, declare a \`Transaction\` and apply the integers in order; if the balance ever goes below zero, \`throw std::runtime_error("overdrawn")\` — the starter's \`catch\` reports it. Call \`commit()\` when the \`commit\` word is reached. After the line has been processed and the guard has died, print one of:

- \`committed: balance=<b>\` — \`commit\` was reached;
- \`aborted: balance=<b>\` — the line ended with \`abort\`, or with no keyword at all;
- \`rejected: balance=<b>\` — the overdraft exception was thrown.

You must not write any rollback code: the destructor does it on every path, including the exception path.

**Input:** the balance, then transaction lines.
**Output:** one line per transaction.

\`\`\`text
100
10 -5 commit
-200 commit
20 abort
-100 commit
\`\`\`
prints
\`\`\`text
committed: balance=105
rejected: balance=105
aborted: balance=105
committed: balance=5
\`\`\``,
          starter: String.raw`#include <iostream>
#include <sstream>
#include <stdexcept>
#include <string>

class Transaction {
public:
    explicit Transaction(long long& balance) : balance_(balance), saved_(balance) {}
    ~Transaction() {
        // TODO: restore saved_ unless committed
    }
    void commit() {
        // TODO
    }

private:
    long long& balance_;
    long long saved_;
    bool committed_ = false;
};

int main() {
    std::string line;
    std::getline(std::cin, line);
    long long balance = std::stoll(line);
    while (std::getline(std::cin, line)) {
        if (line.empty()) continue;
        std::istringstream ss(line);
        std::string outcome = "aborted";
        try {
            // TODO: declare the Transaction, apply each token, throw on overdraft, commit on "commit"
        } catch (const std::runtime_error&) {
            outcome = "rejected";
        }
        std::cout << outcome << ": balance=" << balance << '\n';
    }
    return 0;
}
`,
          solution: String.raw`#include <iostream>
#include <sstream>
#include <stdexcept>
#include <string>

class Transaction {
public:
    explicit Transaction(long long& balance) : balance_(balance), saved_(balance) {}
    ~Transaction() {
        if (!committed_) balance_ = saved_;
    }
    void commit() { committed_ = true; }

private:
    long long& balance_;
    long long saved_;
    bool committed_ = false;
};

int main() {
    std::string line;
    std::getline(std::cin, line);
    long long balance = std::stoll(line);
    while (std::getline(std::cin, line)) {
        if (line.empty()) continue;
        std::istringstream ss(line);
        std::string outcome = "aborted";
        try {
            Transaction tx(balance);
            std::string token;
            while (ss >> token) {
                if (token == "commit") {
                    tx.commit();
                    outcome = "committed";
                } else if (token == "abort") {
                    outcome = "aborted";
                } else {
                    balance += std::stoll(token);
                    if (balance < 0) throw std::runtime_error("overdrawn");
                }
            }
        } catch (const std::runtime_error&) {
            outcome = "rejected";
        }
        std::cout << outcome << ": balance=" << balance << '\n';
    }
    return 0;
}
`,
          hints: [
            "The guard must be declared inside the try block so that it is destroyed — and rolls back — before the catch handler and before the print.",
            "Apply each number to the real balance as you go; the guard already holds the snapshot to return to.",
            "A token that is neither keyword is a number: std::stoll converts it.",
          ],
          cases: [
            { stdin: "100\n10 -5 commit\n-200 commit\n20 abort\n-100 commit\n", expected: "committed: balance=105\nrejected: balance=105\naborted: balance=105\ncommitted: balance=5\n" },
            { stdin: "0\n50 commit\n-50 commit\n-1 commit\n", expected: "committed: balance=50\ncommitted: balance=0\nrejected: balance=0\n" },
            { stdin: "10\ncommit\n5 5\n", expected: "committed: balance=10\naborted: balance=10\n", hidden: true },
            { stdin: "5\n-3 -3 commit\n-3 abort\n-3 commit 4\n", expected: "rejected: balance=5\naborted: balance=5\ncommitted: balance=6\n", hidden: true },
            { stdin: "3000000000\n3000000000 commit\n-6000000000 -1 commit\n", expected: "committed: balance=6000000000\nrejected: balance=6000000000\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "What does this print?\n\n```cpp\nstruct G {\n    const char* n;\n    G(const char* s) : n(s) { std::cout << n; }\n    ~G() { std::cout << '~' << n; }\n};\nvoid f() { G a(\"a\"); G b(\"b\"); throw 1; }\nint main() {\n    try { f(); } catch (int) { std::cout << 'c'; }\n}\n```",
          options: ["`ab~b~ac`", "`abc~b~a`", "`abc`", "`ab~a~bc`"],
          answer: 0,
          explanation: "Unwinding destroys `f`'s automatics — in reverse order, `b` then `a` — before the handler runs, so `~b~a` precedes `c`. Skipping the destructors (`abc`) is what a language without RAII would do.",
        },
        {
          prompt: "Why does C++ have no `finally`?",
          options: ["Exceptions are rare in C++, so cleanup is not needed", "RAII attaches cleanup to the type rather than to each block, so every use of the type is covered and several resources compose without nesting", "It was removed in C++11 because it was slow", "Destructors cannot run during stack unwinding, so `finally` would be unsafe"],
          answer: 1,
          explanation: "With `finally` every function that opens a file must remember the close; with RAII the file type closes itself everywhere, once, written by the library author. Three resources are three declarations destroyed in reverse order, not three nested `try` blocks.",
        },
        {
          prompt: "What is wrong with this use of a scope guard?\n\n```cpp\nScopeExit([&] { std::cout << \"done\\n\"; });\nwork();\n```",
          options: ["Nothing — `done` prints after `work()` returns", "The guard is a temporary with no name, destroyed at the end of its own statement, so `done` prints *before* `work()`", "The lambda must be declared `mutable`", "It does not compile: a lambda cannot be stored in a `std::function`"],
          answer: 1,
          explanation: "A temporary lives until the end of the full expression that created it. Without a variable name the guard is constructed and destroyed on that line. Name it — `ScopeExit guard([&] { … });` — and it lives to the closing brace.",
        },
        {
          prompt: "Which statement about destruction order is correct?",
          options: ["Automatic objects in a block are destroyed in the order they were declared", "A class's members are destroyed before its destructor body runs", "Automatic objects in a block are destroyed in reverse order of construction, and members after the destructor body in reverse declaration order", "The order is unspecified and must not be relied on"],
          answer: 2,
          explanation: "Reverse order is guaranteed, which is what lets a later object depend on an earlier one. Members are destroyed after the body — the body can still use them — in reverse of their declaration. Nothing here is unspecified.",
        },
        {
          prompt: "Why must a destructor not throw?",
          options: ["It is a compile error", "If it throws while another exception is unwinding the stack, the program calls `std::terminate`", "Destructors have no return type, so they cannot signal errors", "A throwing destructor deadlocks the allocator"],
          answer: 1,
          explanation: "Destructors run during unwinding; a second exception in flight at that point cannot be handled, and the runtime terminates. Destructors are implicitly `noexcept` for this reason. A release that can fail must report some other way, or swallow the failure.",
        },
        {
          prompt: "Which of these is NOT an RAII type?",
          options: ["`std::lock_guard<std::mutex>`", "`std::ofstream`", "`FILE*` from `std::fopen`", "`std::vector<int>`"],
          answer: 2,
          explanation: "A `FILE*` is a raw handle: nothing closes it when it goes out of scope. The other three acquire in their constructor and release in their destructor — the lock, the file and the heap block respectively.",
        },
      ],
    },
    {
      slug: "unique-ptr",
      file: "04-unique-ptr.md",
      exercises: [
        {
          title: "Factory and sink",
          prompt: `Practise the three ways a \`std::unique_ptr\` moves through a program: a **factory** that returns one, a **lender** that takes \`const Document&\`, and a **sink** that takes the pointer by value.

\`Document\` holds a title and a word count; its destructor prints \`destroyed <title>\`. Write:

- \`std::unique_ptr<Document> make_document(const std::string& title, int words)\` — \`std::make_unique\`, print \`created <title>\`, return it;
- \`void inspect(const Document& doc)\` — print \`<title> has <words> words\`;
- \`void archive(std::unique_ptr<Document> doc)\` — print \`archived <title>\`; the document dies when the parameter does.

\`main\` reads \`n\` documents. For each: create it, inspect it (pass \`*doc\`), then if it has fewer than 100 words call \`doc.reset()\` and print \`discarded <title>\`, otherwise call \`archive(std::move(doc))\`. Then print \`owner empty: true\` or \`false\` (\`std::boolalpha\`) — after either path the owner in \`main\` is null. Finally print \`processed <n>\`.

**Input:** \`n\`, then \`n\` lines of \`<title> <words>\` (the title is one word).
**Output:** five lines per document, then the count.

\`\`\`text
2
report 120
memo 40
\`\`\`
prints
\`\`\`text
created report
report has 120 words
archived report
destroyed report
owner empty: true
created memo
memo has 40 words
destroyed memo
discarded memo
owner empty: true
processed 2
\`\`\``,
          starter: String.raw`#include <iostream>
#include <memory>
#include <string>
#include <utility>

struct Document {
    std::string title;
    int words;
    Document(const std::string& t, int w) : title(t), words(w) {}
    ~Document() { std::cout << "destroyed " << title << '\n'; }
};

std::unique_ptr<Document> make_document(const std::string& title, int words) {
    // TODO: make_unique, print "created <title>", return it
    (void)title;
    (void)words;
    return nullptr;
}

void inspect(const Document& doc) {
    // TODO: "<title> has <words> words"
    (void)doc;
}

void archive(std::unique_ptr<Document> doc) {
    // TODO: "archived <title>"; the document dies with the parameter
    (void)doc;
}

int main() {
    std::cout << std::boolalpha;
    int n;
    std::cin >> n;
    for (int i = 0; i < n; ++i) {
        std::string title;
        int words;
        std::cin >> title >> words;
        // TODO: create, inspect, then discard (reset) or archive (move); print "owner empty: <bool>"
    }
    std::cout << "processed " << n << '\n';
    return 0;
}
`,
          solution: String.raw`#include <iostream>
#include <memory>
#include <string>
#include <utility>

struct Document {
    std::string title;
    int words;
    Document(const std::string& t, int w) : title(t), words(w) {}
    ~Document() { std::cout << "destroyed " << title << '\n'; }
};

std::unique_ptr<Document> make_document(const std::string& title, int words) {
    auto doc = std::make_unique<Document>(title, words);
    std::cout << "created " << doc->title << '\n';
    return doc;
}

void inspect(const Document& doc) {
    std::cout << doc.title << " has " << doc.words << " words\n";
}

void archive(std::unique_ptr<Document> doc) {
    std::cout << "archived " << doc->title << '\n';
}

int main() {
    std::cout << std::boolalpha;
    int n;
    std::cin >> n;
    for (int i = 0; i < n; ++i) {
        std::string title;
        int words;
        std::cin >> title >> words;
        std::unique_ptr<Document> doc = make_document(title, words);
        inspect(*doc);
        if (words < 100) {
            doc.reset();
            std::cout << "discarded " << title << '\n';
        } else {
            archive(std::move(doc));
        }
        std::cout << "owner empty: " << (doc == nullptr) << '\n';
    }
    std::cout << "processed " << n << '\n';
    return 0;
}
`,
          hints: [
            "A factory returns its local unique_ptr by value; no std::move is needed on the return line.",
            "inspect wants the object, not the pointer: pass *doc.",
            "archive(std::move(doc)) hands ownership over; doc is null afterwards, and the parameter's death inside archive prints destroyed.",
          ],
          cases: [
            { stdin: "2\nreport 120\nmemo 40\n", expected: "created report\nreport has 120 words\narchived report\ndestroyed report\nowner empty: true\ncreated memo\nmemo has 40 words\ndestroyed memo\ndiscarded memo\nowner empty: true\nprocessed 2\n" },
            { stdin: "1\nthesis 100\n", expected: "created thesis\nthesis has 100 words\narchived thesis\ndestroyed thesis\nowner empty: true\nprocessed 1\n" },
            { stdin: "0\n", expected: "processed 0\n", hidden: true },
            { stdin: "3\na 99\nb 1000\nc 0\n", expected: "created a\na has 99 words\ndestroyed a\ndiscarded a\nowner empty: true\ncreated b\nb has 1000 words\narchived b\ndestroyed b\nowner empty: true\ncreated c\nc has 0 words\ndestroyed c\ndiscarded c\nowner empty: true\nprocessed 3\n", hidden: true },
          ],
        },
        {
          title: "A stack that owns its nodes",
          prompt: `Implement a stack as a chain of nodes where each node owns the next through a \`std::unique_ptr<Node>\`, so that no \`delete\` appears anywhere in the program.

Commands, one per line: \`push <v>\`, \`pop\` (print \`popped <v>\` or \`empty\`), \`peek\` (print \`top=<v>\` or \`empty\`), \`size\` (print \`size=<k>\`), \`print\` (print \`stack: <top> … <bottom>\` or \`stack: (empty)\`).

Push must be \`head_ = std::make_unique<Node>(v, std::move(head_))\`. Pop must be the two-step form from the lesson — detach the head into a local \`unique_ptr\`, then move its \`next\` into \`head_\` — and the destructor must pop in a loop rather than let the chain destroy itself recursively.

**Input:** commands.
**Output:** one line per command other than \`push\`.

\`\`\`text
push 1
push 2
push 3
print
pop
peek
size
pop
pop
pop
print
\`\`\`
prints
\`\`\`text
stack: 3 2 1
popped 3
top=2
size=2
popped 2
popped 1
empty
stack: (empty)
\`\`\``,
          starter: String.raw`#include <cstddef>
#include <iostream>
#include <memory>
#include <string>
#include <utility>

struct Node {
    int value;
    std::unique_ptr<Node> next;
    Node(int v, std::unique_ptr<Node> n) : value(v), next(std::move(n)) {}
};

class Stack {
public:
    ~Stack() {
        // TODO: pop in a loop until empty
    }

    void push(int v) {
        // TODO
        (void)v;
    }

    bool pop(int& out) {
        // TODO: detach the head, move its next into head_, hand back the value
        (void)out;
        return false;
    }

    bool peek(int& out) const {
        // TODO
        (void)out;
        return false;
    }

    std::size_t size() const { return size_; }

    void print() const {
        // TODO: "stack: 3 2 1" or "stack: (empty)"
    }

private:
    std::unique_ptr<Node> head_;
    std::size_t size_ = 0;
};

int main() {
    Stack stack;
    std::string cmd;
    while (std::cin >> cmd) {
        if (cmd == "push") {
            int v;
            std::cin >> v;
            stack.push(v);
        } else if (cmd == "pop") {
            int v;
            if (stack.pop(v)) std::cout << "popped " << v << '\n';
            else std::cout << "empty\n";
        } else if (cmd == "peek") {
            int v;
            if (stack.peek(v)) std::cout << "top=" << v << '\n';
            else std::cout << "empty\n";
        } else if (cmd == "size") {
            std::cout << "size=" << stack.size() << '\n';
        } else if (cmd == "print") {
            stack.print();
        }
    }
    return 0;
}
`,
          solution: String.raw`#include <cstddef>
#include <iostream>
#include <memory>
#include <string>
#include <utility>

struct Node {
    int value;
    std::unique_ptr<Node> next;
    Node(int v, std::unique_ptr<Node> n) : value(v), next(std::move(n)) {}
};

class Stack {
public:
    ~Stack() {
        while (head_) {
            std::unique_ptr<Node> old = std::move(head_);
            head_ = std::move(old->next);
        }   // old deletes one node per iteration: no recursion, however long the chain
    }

    void push(int v) {
        head_ = std::make_unique<Node>(v, std::move(head_));
        ++size_;
    }

    bool pop(int& out) {
        if (!head_) return false;
        std::unique_ptr<Node> old = std::move(head_);   // detach
        head_ = std::move(old->next);                   // take the successor
        out = old->value;
        --size_;
        return true;                                    // old dies here and frees the node
    }

    bool peek(int& out) const {
        if (!head_) return false;
        out = head_->value;
        return true;
    }

    std::size_t size() const { return size_; }

    void print() const {
        std::cout << "stack:";
        if (!head_) {
            std::cout << " (empty)\n";
            return;
        }
        for (const Node* cur = head_.get(); cur != nullptr; cur = cur->next.get()) {
            std::cout << ' ' << cur->value;
        }
        std::cout << '\n';
    }

private:
    std::unique_ptr<Node> head_;
    std::size_t size_ = 0;
};

int main() {
    Stack stack;
    std::string cmd;
    while (std::cin >> cmd) {
        if (cmd == "push") {
            int v;
            std::cin >> v;
            stack.push(v);
        } else if (cmd == "pop") {
            int v;
            if (stack.pop(v)) std::cout << "popped " << v << '\n';
            else std::cout << "empty\n";
        } else if (cmd == "peek") {
            int v;
            if (stack.peek(v)) std::cout << "top=" << v << '\n';
            else std::cout << "empty\n";
        } else if (cmd == "size") {
            std::cout << "size=" << stack.size() << '\n';
        } else if (cmd == "print") {
            stack.print();
        }
    }
    return 0;
}
`,
          hints: [
            "std::move(head_) in the make_unique call hands the current chain to the new node before head_ is reassigned.",
            "Walk the chain for printing with raw borrowed pointers: head_.get() and cur->next.get(); nobody deletes through them.",
            "The destructor is pop without the value: detach, take next, let the local die — repeat while head_ is non-null.",
          ],
          cases: [
            { stdin: "push 1\npush 2\npush 3\nprint\npop\npeek\nsize\npop\npop\npop\nprint\n", expected: "stack: 3 2 1\npopped 3\ntop=2\nsize=2\npopped 2\npopped 1\nempty\nstack: (empty)\n" },
            { stdin: "peek\npop\nsize\nprint\n", expected: "empty\nempty\nsize=0\nstack: (empty)\n" },
            { stdin: "push -5\npush 0\npeek\nprint\npop\nprint\nsize\n", expected: "top=0\nstack: 0 -5\npopped 0\nstack: -5\nsize=1\n", hidden: true },
            { stdin: "push 1\npush 2\npop\npush 3\npush 4\nprint\nsize\n", expected: "popped 2\nstack: 4 3 1\nsize=3\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "What does this print?\n\n```cpp\nauto a = std::make_unique<int>(5);\nauto b = std::move(a);\nstd::cout << (a ? \"a\" : \"-\") << (b ? \"b\" : \"-\") << *b;\n```",
          options: ["`ab5`", "`-b5`", "`a-5`", "Undefined behaviour"],
          answer: 1,
          explanation: "`std::move` transfers ownership: `b` holds the int and `a` is null — a defined state you may test. Only dereferencing `a` afterwards would be undefined; testing it is exactly what the null state is for.",
        },
        {
          prompt: "Which parameter type says \"this function takes ownership of the object\"?",
          options: ["`void f(const Widget&)`", "`void f(Widget*)`", "`void f(std::unique_ptr<Widget>)`", "`void f(const std::unique_ptr<Widget>&)`"],
          answer: 2,
          explanation: "A `unique_ptr` by value can only be passed with `std::move`, which is the transfer made visible at the call site. References and raw pointers lend; a `const unique_ptr&` lends awkwardly, forcing the caller to own a `unique_ptr` for no reason.",
        },
        {
          prompt: "`std::unique_ptr<int> a = std::make_unique<int>(1); auto b = a;` — what happens?",
          options: ["Compile error: the copy constructor is deleted", "`b` becomes null and `a` keeps ownership", "Both own the object and it is deleted twice", "A run-time exception"],
          answer: 0,
          explanation: "Exclusive ownership is enforced at compile time — a copy would create the second owner that a raw pointer cannot prevent. Transfer needs an explicit `std::move`.",
        },
        {
          prompt: "What does `p.release()` do to a `std::unique_ptr<T> p`?",
          options: ["Deletes the object and sets `p` to null", "Returns the raw pointer and sets `p` to null without deleting — the caller now owns it", "Decrements a reference count", "Returns the raw pointer while `p` keeps ownership"],
          answer: 1,
          explanation: "`release()` gives ownership away; discarding its result is a leak. `reset()` is the one that deletes; `get()` is the one that borrows without changing ownership.",
        },
        {
          prompt: "A `std::unique_ptr<Node>` heads a chain of one million nodes, each owning the next. The head goes out of scope with the default destructor. What happens?",
          options: ["Nothing special — the nodes are freed in a loop", "Each node's destructor destroys the next: a million-deep recursion that may overflow the stack", "A leak: only the first node is freed", "Undefined behaviour"],
          answer: 1,
          explanation: "The default destructor of `Node` destroys its `next`, whose destructor destroys *its* `next`, one frame per node. Write a destructor that pops from the front in a loop for long chains.",
        },
        {
          prompt: "Why prefer `std::make_unique<T>(x)` over `std::unique_ptr<T>(new T(x))`?",
          options: ["It is measurably faster at run time", "No naked `new`, and it cannot leak between the allocation and the wrap when used as one of several function arguments", "It allows the pointer to be copied", "`make_unique` bounds-checks the object"],
          answer: 1,
          explanation: "Before C++17, `f(std::unique_ptr<T>(new T), g())` could evaluate `new T`, then `g()` — which throws — before the wrap, leaking the `T`. `make_unique` is one call. The run-time cost is identical.",
        },
        {
          prompt: "How much larger is `std::unique_ptr<T>` than a raw `T*`, with the default deleter?",
          options: ["Twice as large — it stores a deleter pointer", "The same size", "Larger by a control block", "It depends on `T`"],
          answer: 1,
          explanation: "The default deleter is an empty class stored with the empty-base optimisation, so the smart pointer is one pointer wide and the indirection is identical. A function-pointer deleter would add a word; `shared_ptr` is the one with a control block.",
        },
      ],
    },
    {
      slug: "shared-ptr-and-weak-ptr",
      file: "05-shared-ptr-and-weak-ptr.md",
      exercises: [
        {
          title: "An album and its tracks",
          prompt: `Build the ownership graph from the lesson and print the counts it defines. An \`Album\` owns its tracks through \`std::vector<std::shared_ptr<Track>>\`; each \`Track\` points back with a \`std::weak_ptr<Album>\`. The album's destructor prints \`album <title> released\`.

Read the album title (a whole line), then \`n\`, then \`n\` track titles (whole lines). Create the album with \`std::make_shared\`, then each track with \`std::make_shared\`, set its back-pointer and push it into the album. Then print:

1. \`album <title>: <n> tracks, owners=<album.use_count()>\`;
2. for each track, iterating by \`const auto&\`: \`lock()\` the back-pointer and print \`<track> -> <album title> (track owners=<track.use_count()>, album owners=<locked.use_count()>)\`;
3. if there are no tracks, print \`no tracks\`, reset the album and stop;
4. otherwise copy the first track into a \`std::shared_ptr<Track> first\` and print \`first track owners=<first.use_count()>\`;
5. reset the album pointer in \`main\` (the destructor line prints here);
6. print \`first track owners=<first.use_count()>\` again, then \`album expired=<first->album.expired()>\` with \`std::boolalpha\`.

Every number is fixed by the rules: a \`weak_ptr\` is not an owner, a \`const auto&\` loop makes no copies, and \`lock()\` is an owner for as long as it lives.

**Input:** the album title line, \`n\`, then \`n\` title lines.
**Output:** as above.

\`\`\`text
Abbey Road
2
Come Together
Something
\`\`\`
prints
\`\`\`text
album Abbey Road: 2 tracks, owners=1
Come Together -> Abbey Road (track owners=1, album owners=2)
Something -> Abbey Road (track owners=1, album owners=2)
first track owners=2
album Abbey Road released
first track owners=1
album expired=true
\`\`\``,
          starter: String.raw`#include <iostream>
#include <memory>
#include <string>
#include <vector>

struct Album;

struct Track {
    std::string title;
    std::weak_ptr<Album> album;
};

struct Album {
    std::string title;
    std::vector<std::shared_ptr<Track>> tracks;
    ~Album() { std::cout << "album " << title << " released\n"; }
};

int main() {
    std::cout << std::boolalpha;
    std::string title;
    std::getline(std::cin, title);
    int n;
    std::cin >> n;
    std::cin.ignore();
    // TODO: build the album and its tracks, then print the six steps
    for (int i = 0; i < n; ++i) {
        std::string trackTitle;
        std::getline(std::cin, trackTitle);
    }
    return 0;
}
`,
          solution: String.raw`#include <iostream>
#include <memory>
#include <string>
#include <vector>

struct Album;

struct Track {
    std::string title;
    std::weak_ptr<Album> album;
};

struct Album {
    std::string title;
    std::vector<std::shared_ptr<Track>> tracks;
    ~Album() { std::cout << "album " << title << " released\n"; }
};

int main() {
    std::cout << std::boolalpha;
    std::string title;
    std::getline(std::cin, title);
    int n;
    std::cin >> n;
    std::cin.ignore();

    auto album = std::make_shared<Album>();
    album->title = title;
    for (int i = 0; i < n; ++i) {
        auto track = std::make_shared<Track>();
        std::getline(std::cin, track->title);
        track->album = album;                 // weak: the album's count stays 1
        album->tracks.push_back(track);
    }                                         // the loop's track dies: the vector is the only owner

    std::cout << "album " << album->title << ": " << album->tracks.size()
              << " tracks, owners=" << album.use_count() << '\n';
    for (const auto& track : album->tracks) {
        if (auto owner = track->album.lock()) {
            std::cout << track->title << " -> " << owner->title
                      << " (track owners=" << track.use_count()
                      << ", album owners=" << owner.use_count() << ")\n";
        }
    }
    if (album->tracks.empty()) {
        std::cout << "no tracks\n";
        album.reset();
        return 0;
    }
    std::shared_ptr<Track> first = album->tracks.front();
    std::cout << "first track owners=" << first.use_count() << '\n';
    album.reset();                            // last owner: the album and its vector die here
    std::cout << "first track owners=" << first.use_count() << '\n';
    std::cout << "album expired=" << first->album.expired() << '\n';
    return 0;
}
`,
          hints: [
            "Assigning a shared_ptr to a weak_ptr does not change use_count; that is the whole point of the back-pointer.",
            "Iterate with const auto& — a by-value loop variable would be a second owner and print track owners=2.",
            "After album.reset() the album's vector is gone, so every track but first has no owner left; first survives with a count of 1 and its weak_ptr reports expired.",
          ],
          cases: [
            { stdin: "Abbey Road\n2\nCome Together\nSomething\n", expected: "album Abbey Road: 2 tracks, owners=1\nCome Together -> Abbey Road (track owners=1, album owners=2)\nSomething -> Abbey Road (track owners=1, album owners=2)\nfirst track owners=2\nalbum Abbey Road released\nfirst track owners=1\nalbum expired=true\n" },
            { stdin: "Solo\n1\nOnly Song\n", expected: "album Solo: 1 tracks, owners=1\nOnly Song -> Solo (track owners=1, album owners=2)\nfirst track owners=2\nalbum Solo released\nfirst track owners=1\nalbum expired=true\n" },
            { stdin: "Silence\n0\n", expected: "album Silence: 0 tracks, owners=1\nno tracks\nalbum Silence released\n", hidden: true },
            { stdin: "Blue\n3\nA\nB\nC\n", expected: "album Blue: 3 tracks, owners=1\nA -> Blue (track owners=1, album owners=2)\nB -> Blue (track owners=1, album owners=2)\nC -> Blue (track owners=1, album owners=2)\nfirst track owners=2\nalbum Blue released\nfirst track owners=1\nalbum expired=true\n", hidden: true },
          ],
        },
        {
          title: "Observers that may vanish",
          prompt: `A \`Subject\` keeps a list of listeners it does not own — \`std::vector<std::weak_ptr<Listener>>\` — so that a listener that has been destroyed elsewhere simply stops receiving. Owners live in a \`std::map<std::string, std::shared_ptr<Listener>>\` in \`main\`.

Commands, one per line:

- \`add <name>\` — if the name exists print \`exists <name>\`; otherwise create the listener with \`std::make_shared\`, store it in the map, subscribe it to the subject and print \`added <name> (owners=<use_count>)\` — which must be 1, because the subject holds only a \`weak_ptr\`;
- \`drop <name>\` — erase it from the map (print \`dropped <name>\`), or \`unknown <name>\` if absent;
- \`notify <word>\` — for each weak pointer in subscription order, \`lock()\` it; a live listener prints \`<name> received <word>\`, a dead one is counted; then remove the expired entries with \`std::erase_if\` and print \`delivered=<d> pruned=<p>\`.

**Input:** commands.
**Output:** one line per \`add\`/\`drop\`, and the notification lines.

\`\`\`text
add ann
add bob
notify hello
drop ann
notify again
add ann
notify third
\`\`\`
prints
\`\`\`text
added ann (owners=1)
added bob (owners=1)
ann received hello
bob received hello
delivered=2 pruned=0
dropped ann
bob received again
delivered=1 pruned=1
added ann (owners=1)
bob received third
ann received third
delivered=2 pruned=0
\`\`\``,
          starter: String.raw`#include <iostream>
#include <map>
#include <memory>
#include <string>
#include <vector>

struct Listener {
    std::string name;
};

class Subject {
public:
    void subscribe(const std::shared_ptr<Listener>& listener) {
        // TODO: remember the listener without owning it
        (void)listener;
    }

    void notify(const std::string& message) {
        // TODO: lock each weak_ptr, deliver or count, prune the expired, print the summary
        (void)message;
    }

private:
    std::vector<std::weak_ptr<Listener>> listeners_;
};

int main() {
    std::map<std::string, std::shared_ptr<Listener>> owners;
    Subject subject;
    std::string cmd;
    while (std::cin >> cmd) {
        if (cmd == "add") {
            std::string name;
            std::cin >> name;
            // TODO
        } else if (cmd == "drop") {
            std::string name;
            std::cin >> name;
            // TODO
        } else if (cmd == "notify") {
            std::string word;
            std::cin >> word;
            subject.notify(word);
        }
    }
    return 0;
}
`,
          solution: String.raw`#include <iostream>
#include <map>
#include <memory>
#include <string>
#include <vector>

struct Listener {
    std::string name;
};

class Subject {
public:
    void subscribe(const std::shared_ptr<Listener>& listener) {
        listeners_.push_back(listener);       // shared_ptr converts to weak_ptr: no ownership taken
    }

    void notify(const std::string& message) {
        int delivered = 0;
        int pruned = 0;
        for (const auto& weak : listeners_) {
            if (auto listener = weak.lock()) {
                std::cout << listener->name << " received " << message << '\n';
                ++delivered;
            } else {
                ++pruned;
            }
        }
        std::erase_if(listeners_, [](const std::weak_ptr<Listener>& w) { return w.expired(); });
        std::cout << "delivered=" << delivered << " pruned=" << pruned << '\n';
    }

private:
    std::vector<std::weak_ptr<Listener>> listeners_;
};

int main() {
    std::map<std::string, std::shared_ptr<Listener>> owners;
    Subject subject;
    std::string cmd;
    while (std::cin >> cmd) {
        if (cmd == "add") {
            std::string name;
            std::cin >> name;
            if (owners.contains(name)) {
                std::cout << "exists " << name << '\n';
                continue;
            }
            auto& slot = owners[name];
            slot = std::make_shared<Listener>();
            slot->name = name;
            subject.subscribe(slot);
            std::cout << "added " << name << " (owners=" << slot.use_count() << ")\n";
        } else if (cmd == "drop") {
            std::string name;
            std::cin >> name;
            if (owners.erase(name) == 1) std::cout << "dropped " << name << '\n';
            else std::cout << "unknown " << name << '\n';
        } else if (cmd == "notify") {
            std::string word;
            std::cin >> word;
            subject.notify(word);
        }
    }
    return 0;
}
`,
          hints: [
            "A std::shared_ptr converts to a std::weak_ptr on push_back; store the weak one and the count stays 1.",
            "Build the listener straight into the map slot (auto& slot = owners[name]) so no extra local shared_ptr is alive when you print the count.",
            "std::erase_if(vec, pred) is the C++20 one-liner for the erase-remove idiom; the predicate is w.expired().",
          ],
          cases: [
            { stdin: "add ann\nadd bob\nnotify hello\ndrop ann\nnotify again\nadd ann\nnotify third\n", expected: "added ann (owners=1)\nadded bob (owners=1)\nann received hello\nbob received hello\ndelivered=2 pruned=0\ndropped ann\nbob received again\ndelivered=1 pruned=1\nadded ann (owners=1)\nbob received third\nann received third\ndelivered=2 pruned=0\n" },
            { stdin: "notify empty\nadd x\nadd x\ndrop y\n", expected: "delivered=0 pruned=0\nadded x (owners=1)\nexists x\nunknown y\n" },
            { stdin: "add a\nadd b\nadd c\ndrop a\ndrop c\nnotify one\nnotify two\n", expected: "added a (owners=1)\nadded b (owners=1)\nadded c (owners=1)\ndropped a\ndropped c\nb received one\ndelivered=1 pruned=2\nb received two\ndelivered=1 pruned=0\n", hidden: true },
            { stdin: "add a\ndrop a\ndrop a\nnotify gone\nnotify still\n", expected: "added a (owners=1)\ndropped a\nunknown a\ndelivered=0 pruned=1\ndelivered=0 pruned=0\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "What does this print?\n\n```cpp\nauto a = std::make_shared<int>(1);\nstd::weak_ptr<int> w = a;\nauto b = a;\nstd::cout << a.use_count();\nb.reset();\nstd::cout << a.use_count() << w.expired();\na.reset();\nstd::cout << w.expired();\n```",
          options: ["`2101`", "`3101`", "`2100`", "`2111`"],
          answer: 0,
          explanation: "The weak pointer is not an owner, so the count is 2 with `a` and `b`, 1 after `b.reset()`, and `w` is not yet expired (`0`). After `a.reset()` the last owner is gone, the int is deleted, and `w.expired()` is `1`.",
        },
        {
          prompt: "Two objects hold `std::shared_ptr`s to each other: `x->other = y; y->other = x;`. After both `x` and `y` in `main` go out of scope…",
          options: ["Both objects are destroyed in reverse order", "Neither is destroyed: each count drops from 2 to 1 and stays there — a leak", "Only `x` is destroyed", "The program terminates with `std::bad_weak_ptr`"],
          answer: 1,
          explanation: "Each object is still owned by the other, so neither count reaches zero. Reference counting cannot collect cycles; one direction must be a `weak_ptr`.",
        },
        {
          prompt: "What does `std::weak_ptr<T>::lock()` return when the object has already been destroyed?",
          options: ["It throws `std::bad_weak_ptr`", "An empty `std::shared_ptr<T>`", "A dangling `std::shared_ptr<T>` — undefined to use", "A raw `nullptr` of type `T*`"],
          answer: 1,
          explanation: "`lock()` never throws; it yields an empty `shared_ptr` you test with `if (auto p = w.lock())`. Constructing a `shared_ptr` *directly* from an expired `weak_ptr` is the call that throws `bad_weak_ptr`.",
        },
        {
          prompt: "Why is `std::make_shared<T>(…)` preferred over `std::shared_ptr<T>(new T(…))`?",
          options: ["One allocation holds both the object and the control block, and no naked `new` appears", "Only `make_shared` objects can be observed by a `weak_ptr`", "It makes `use_count()` exact", "It avoids atomic operations on the count"],
          answer: 0,
          explanation: "`make_shared` co-allocates object and control block — faster, better locality, exception safe. `weak_ptr`, exactness and atomics are the same either way.",
        },
        {
          prompt: "Inside a member function of an object already owned by a `shared_ptr`, what is wrong with `std::shared_ptr<T> self(this);`?",
          options: ["Nothing — it shares the existing count", "It creates a second, independent control block, so the object is deleted twice", "It increments the count twice", "It does not compile"],
          answer: 1,
          explanation: "A `shared_ptr` built from a raw pointer knows nothing about other owners; two control blocks each delete the object once. `std::enable_shared_from_this` gives `shared_from_this()`, which reuses the existing block.",
        },
        {
          prompt: "A function only reads a `Widget` that its caller happens to own through a `std::shared_ptr`. Which signature is right?",
          options: ["`void f(std::shared_ptr<Widget>)`", "`void f(const std::shared_ptr<Widget>&)`", "`void f(const Widget&)`", "`void f(std::weak_ptr<Widget>)`"],
          answer: 2,
          explanation: "Ownership is not the function's concern, so it should not appear in the signature. `const Widget&` works for any owner — stack, `unique_ptr`, `shared_ptr` — and costs no atomic increment. Take a `shared_ptr` by value only when you will keep a copy.",
        },
        {
          prompt: "Which part of a `std::shared_ptr` is thread-safe without further locking?",
          options: ["The pointed-to object", "The reference count updates", "Both the count and the object", "Neither"],
          answer: 1,
          explanation: "Copying and destroying `shared_ptr`s from several threads is safe because the count is atomic. The object itself has no such protection: concurrent writes through the pointer need a mutex (Module 17).",
        },
      ],
    },
    {
      slug: "memory-errors-and-tools",
      file: "06-memory-errors-and-tools.md",
      exercises: [
        {
          title: "A leak detector",
          prompt: `A real leak detector watches every allocation and free; yours audits a ledger of them, since the judge cannot observe real memory errors. Read commands until the input ends:

- \`alloc <id> <bytes>\` — a new block. If \`id\` is currently live, print \`already allocated: <id>\` and ignore the command.
- \`free <id>\` — release the block. If \`id\` was never allocated print \`invalid free: <id>\`; if it was allocated but is already freed print \`double free: <id>\`.

An id may be allocated again after it has been freed; that is a new block. When the input ends, list every block still live in order of allocation as \`leaked: <id> (<bytes> bytes)\` — or a single \`no leaks\` line — followed by \`summary: allocs=<a> frees=<f> leaked=<k> blocks / <total> bytes, errors=<e>\`, where \`allocs\` and \`frees\` count successful commands and \`errors\` counts the three error kinds. Bytes are summed in \`long long\`.

**Input:** commands.
**Output:** error lines as they occur, then the leak list and the summary.

\`\`\`text
alloc a 64
alloc b 32
free b
free b
free z
alloc c 16
\`\`\`
prints
\`\`\`text
double free: b
invalid free: z
leaked: a (64 bytes)
leaked: c (16 bytes)
summary: allocs=3 frees=1 leaked=2 blocks / 80 bytes, errors=2
\`\`\``,
          starter: String.raw`#include <algorithm>
#include <iostream>
#include <map>
#include <string>
#include <utility>
#include <vector>

struct Block {
    long long bytes = 0;
    bool live = false;
    int seq = 0;      // allocation order, for the leak listing
};

int main() {
    std::map<std::string, Block> blocks;
    int allocs = 0;
    int frees = 0;
    int errors = 0;
    int seq = 0;
    std::string cmd;
    while (std::cin >> cmd) {
        if (cmd == "alloc") {
            std::string id;
            long long bytes;
            std::cin >> id >> bytes;
            // TODO
        } else if (cmd == "free") {
            std::string id;
            std::cin >> id;
            // TODO
        }
    }
    // TODO: collect the live blocks, sort by seq, print the leak lines or "no leaks", then the summary
    (void)seq;
    std::cout << "summary: allocs=" << allocs << " frees=" << frees
              << " leaked=0 blocks / 0 bytes, errors=" << errors << '\n';
    return 0;
}
`,
          solution: String.raw`#include <algorithm>
#include <iostream>
#include <map>
#include <string>
#include <utility>
#include <vector>

struct Block {
    long long bytes = 0;
    bool live = false;
    int seq = 0;      // allocation order, for the leak listing
};

int main() {
    std::map<std::string, Block> blocks;
    int allocs = 0;
    int frees = 0;
    int errors = 0;
    int seq = 0;
    std::string cmd;
    while (std::cin >> cmd) {
        if (cmd == "alloc") {
            std::string id;
            long long bytes;
            std::cin >> id >> bytes;
            auto it = blocks.find(id);
            if (it != blocks.end() && it->second.live) {
                std::cout << "already allocated: " << id << '\n';
                ++errors;
                continue;
            }
            blocks[id] = Block{bytes, true, seq++};
            ++allocs;
        } else if (cmd == "free") {
            std::string id;
            std::cin >> id;
            auto it = blocks.find(id);
            if (it == blocks.end()) {
                std::cout << "invalid free: " << id << '\n';
                ++errors;
            } else if (!it->second.live) {
                std::cout << "double free: " << id << '\n';
                ++errors;
            } else {
                it->second.live = false;
                ++frees;
            }
        }
    }
    std::vector<std::pair<int, std::string>> leaked;   // (seq, id)
    for (const auto& entry : blocks) {
        if (entry.second.live) leaked.emplace_back(entry.second.seq, entry.first);
    }
    std::sort(leaked.begin(), leaked.end());
    long long total = 0;
    if (leaked.empty()) std::cout << "no leaks\n";
    for (const auto& entry : leaked) {
        const Block& b = blocks[entry.second];
        total += b.bytes;
        std::cout << "leaked: " << entry.second << " (" << b.bytes << " bytes)\n";
    }
    std::cout << "summary: allocs=" << allocs << " frees=" << frees
              << " leaked=" << leaked.size() << " blocks / " << total
              << " bytes, errors=" << errors << '\n';
    return 0;
}
`,
          hints: [
            "Three states per id: never seen (invalid free), seen and live, seen and freed (double free); a map from id to Block holds the last two.",
            "Stamp each successful alloc with an increasing sequence number; a re-allocated id gets a new stamp, which is what puts it later in the leak list.",
            "Collect (seq, id) pairs for the live blocks and std::sort them — a pair sorts by its first member.",
          ],
          cases: [
            { stdin: "alloc a 64\nalloc b 32\nfree b\nfree b\nfree z\nalloc c 16\n", expected: "double free: b\ninvalid free: z\nleaked: a (64 bytes)\nleaked: c (16 bytes)\nsummary: allocs=3 frees=1 leaked=2 blocks / 80 bytes, errors=2\n" },
            { stdin: "alloc x 8\nfree x\nalloc x 24\nfree x\n", expected: "no leaks\nsummary: allocs=2 frees=2 leaked=0 blocks / 0 bytes, errors=0\n" },
            { stdin: "", expected: "no leaks\nsummary: allocs=0 frees=0 leaked=0 blocks / 0 bytes, errors=0\n", hidden: true },
            { stdin: "alloc a 8\nalloc a 8\nfree a\n", expected: "already allocated: a\nno leaks\nsummary: allocs=1 frees=1 leaked=0 blocks / 0 bytes, errors=1\n", hidden: true },
            { stdin: "alloc a 1\nalloc b 2\nfree a\nalloc a 3\n", expected: "leaked: b (2 bytes)\nleaked: a (3 bytes)\nsummary: allocs=3 frees=1 leaked=2 blocks / 5 bytes, errors=0\n", hidden: true },
          ],
        },
        {
          title: "A buffer that refuses to overflow",
          prompt: `An unchecked write past the end of a buffer silently corrupts whatever lives next to it; a checked one reports. Read the buffer size \`n\` and create a \`std::vector<int>\` of \`n\` zeros, then process commands:

- \`set <i> <v>\` — store \`v\` at index \`i\` through \`.at()\`;
- \`get <i>\` — print \`buf[<i>]=<value>\`;
- \`sum\` — print \`sum=<total>\` (\`long long\`).

Read \`i\` as a \`long long\` and index with \`static_cast<std::size_t>(i)\`; a negative \`i\` becomes a huge unsigned value, which \`.at()\` rejects like any other out-of-range index. Catch the \`std::out_of_range\` that \`.at()\` throws and print \`out of range: <i>\` with the index as it was read. Never let the exception escape \`main\`.

**Input:** \`n\`, then commands.
**Output:** one line per \`get\`/\`sum\`, and one per rejected index.

\`\`\`text
5
set 0 10
set 4 20
set 5 30
get 4
get -1
sum
\`\`\`
prints
\`\`\`text
out of range: 5
buf[4]=20
out of range: -1
sum=30
\`\`\``,
          starter: String.raw`#include <cstddef>
#include <iostream>
#include <stdexcept>
#include <string>
#include <vector>

int main() {
    std::size_t n;
    std::cin >> n;
    std::vector<int> buf(n);
    std::string cmd;
    while (std::cin >> cmd) {
        if (cmd == "set") {
            long long i;
            int v;
            std::cin >> i >> v;
            // TODO: buf.at(...) = v inside a try; report out of range
        } else if (cmd == "get") {
            long long i;
            std::cin >> i;
            // TODO: read through buf.at(...) first, then print "buf[<i>]=<value>"
        } else if (cmd == "sum") {
            // TODO
        }
    }
    return 0;
}
`,
          solution: String.raw`#include <cstddef>
#include <iostream>
#include <stdexcept>
#include <string>
#include <vector>

int main() {
    std::size_t n;
    std::cin >> n;
    std::vector<int> buf(n);
    std::string cmd;
    while (std::cin >> cmd) {
        if (cmd == "set") {
            long long i;
            int v;
            std::cin >> i >> v;
            try {
                buf.at(static_cast<std::size_t>(i)) = v;
            } catch (const std::out_of_range&) {
                std::cout << "out of range: " << i << '\n';
            }
        } else if (cmd == "get") {
            long long i;
            std::cin >> i;
            try {
                const int value = buf.at(static_cast<std::size_t>(i));   // read first: nothing printed on failure
                std::cout << "buf[" << i << "]=" << value << '\n';
            } catch (const std::out_of_range&) {
                std::cout << "out of range: " << i << '\n';
            }
        } else if (cmd == "sum") {
            long long total = 0;
            for (int x : buf) total += x;
            std::cout << "sum=" << total << '\n';
        }
    }
    return 0;
}
`,
          hints: [
            "vector::at throws std::out_of_range; operator[] would silently read or write the neighbour.",
            "For get, fetch the value into a local before streaming anything, or a rejected index leaves a half-printed line.",
            "A buffer of size 0 rejects every index, including 0.",
          ],
          cases: [
            { stdin: "5\nset 0 10\nset 4 20\nset 5 30\nget 4\nget -1\nsum\n", expected: "out of range: 5\nbuf[4]=20\nout of range: -1\nsum=30\n" },
            { stdin: "3\nset 1 -7\nget 1\nget 0\nsum\n", expected: "buf[1]=-7\nbuf[0]=0\nsum=-7\n" },
            { stdin: "0\nget 0\nset 0 1\nsum\n", expected: "out of range: 0\nout of range: 0\nsum=0\n", hidden: true },
            { stdin: "2\nset 0 2000000000\nset 1 2000000000\nsum\nget 2\n", expected: "sum=4000000000\nout of range: 2\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "Which tool reports a read of an uninitialised heap `int` without recompiling the program?",
          options: ["AddressSanitizer", "UndefinedBehaviorSanitizer", "Valgrind memcheck", "`-Wall -Wextra`"],
          answer: 2,
          explanation: "Valgrind runs the unmodified binary and tracks every byte's initialisation state. ASan and UBSan are compiled in and neither tracks uninitialised heap values; `-Wall` sees only what is visible at compile time.",
        },
        {
          prompt: "An AddressSanitizer `heap-use-after-free` report shows three stack traces. Which three?",
          options: ["Where the bad access happened, where the block was freed, where it was allocated", "Compile, link and run", "`main`, the current thread and the signal handler", "Only the allocation — the rest is inferred"],
          answer: 0,
          explanation: "Access, free, allocation: the complete story of a use-after-free, which is why the report usually points straight at the fix.",
        },
        {
          prompt: "Classify this:\n\n```cpp\nstd::vector<int> v{1, 2, 3};\nauto it = v.begin();\nv.push_back(4);\nstd::cout << *it;\n```",
          options: ["Fine — `it` still refers to the first element", "An invalidated iterator: `push_back` may reallocate, and `*it` is undefined behaviour", "A leak", "A double free"],
          answer: 1,
          explanation: "Insertion into a `std::vector` can move every element to a new block; iterators, pointers and references into the old block dangle. Take the iterator after the insertion, or keep an index.",
        },
        {
          prompt: "Which flag makes `v[i]` on a libstdc++ `std::vector` abort with a message when `i` is out of range?",
          options: ["`-O2`", "`-D_GLIBCXX_ASSERTIONS`", "`-Wall`", "`-fsanitize=undefined`"],
          answer: 1,
          explanation: "`_GLIBCXX_ASSERTIONS` turns on the library's own bounds checks for `operator[]`, nearly free. UBSan checks arrays whose bound the compiler knows, not a vector's heap block; ASan would catch the access only if it left the allocated block.",
        },
        {
          prompt: "A program reads through a dangling pointer, prints the expected value and passes the judge. What is the correct description?",
          options: ["The judge ignores memory errors, so the program is correct", "The behaviour is undefined; the optimised binary happened to produce the expected value, and nothing about the program is established", "The judge runs with AddressSanitizer, which repaired the read", "A dangling read always returns the old value"],
          answer: 1,
          explanation: "Undefined behaviour has no required outcome, and the judge's `-O2` build has no sanitizers. A passing run is not evidence; test with ASan and UBSan before trusting it.",
        },
        {
          prompt: "In a Valgrind leak summary, what distinguishes \"definitely lost\" from \"still reachable\"?",
          options: ["Both are leaks of equal severity", "Definitely lost has no pointer to it anywhere; still reachable is pointed at by something (a global, say) at exit and is usually not a bug", "Still reachable is the more serious of the two", "They are two names for the same category"],
          answer: 1,
          explanation: "A block nothing points at can never be freed — a real leak. A block a global still references at exit was never lost; the process end reclaims it. \"Indirectly lost\" is the third kind: reachable only from a lost block.",
        },
        {
          prompt: "Which rule prevents use-after-free through an element of a `std::vector`?",
          options: ["Always use `.at()` instead of `[]`", "Never keep a pointer, reference or iterator into the vector across an insertion; keep an index", "Store the elements as `std::shared_ptr`", "Call `reserve(0)` before every loop"],
          answer: 1,
          explanation: "The danger is reallocation moving the elements; an index survives it, a pointer does not. `.at()` checks the index, not whether an old pointer is still valid.",
        },
      ],
    },
    {
      slug: "memory-checkpoint",
      file: "07-checkpoint.md",
      kind: "test",
      passMark: 70,
      exercises: [
        {
          title: "A growable stack over raw storage",
          prompt: `Write \`IntStack\`, a stack that owns an \`int\` array obtained with \`new int[capacity]\`, starting at capacity 2. When a push finds the array full, allocate one of double the capacity, copy the elements across, release the old block with \`delete[]\`, and print \`grow <old> -> <new>\`. The destructor releases the block and prints \`released capacity <capacity>\`. Copying is deleted.

Commands, one per line: \`push <v>\`; \`pop\` (print \`popped <v>\` or \`empty\`); \`top\` (print \`top=<v>\` or \`empty\`); \`size\` (print \`size=<k>\`); \`print\` (print \`stack: <bottom> … <top>\` or \`stack: (empty)\`). Popping never shrinks the array.

**Input:** commands.
**Output:** the command output, the \`grow\` lines as they happen, and the destructor's line last.

\`\`\`text
push 1
push 2
push 3
size
print
pop
pop
top
pop
pop
\`\`\`
prints
\`\`\`text
grow 2 -> 4
size=3
stack: 1 2 3
popped 3
popped 2
top=1
popped 1
empty
released capacity 4
\`\`\``,
          starter: String.raw`#include <algorithm>
#include <cstddef>
#include <iostream>
#include <string>

class IntStack {
public:
    IntStack() : capacity_(2), size_(0), data_(new int[2]) {}
    ~IntStack() {
        // TODO: release, then print "released capacity <capacity>"
    }
    IntStack(const IntStack&) = delete;
    IntStack& operator=(const IntStack&) = delete;

    void push(int v) {
        // TODO: grow when full, then store
        (void)v;
    }
    bool pop(int& out) {
        // TODO
        (void)out;
        return false;
    }
    bool top(int& out) const {
        // TODO
        (void)out;
        return false;
    }
    std::size_t size() const { return size_; }
    void print() const {
        // TODO: "stack: 1 2 3" or "stack: (empty)"
    }

private:
    void grow() {
        // TODO: new block of twice the capacity, copy, delete[] the old, print "grow <old> -> <new>"
    }

    std::size_t capacity_;
    std::size_t size_;
    int* data_;
};

int main() {
    IntStack stack;
    std::string cmd;
    while (std::cin >> cmd) {
        if (cmd == "push") {
            int v;
            std::cin >> v;
            stack.push(v);
        } else if (cmd == "pop") {
            int v;
            if (stack.pop(v)) std::cout << "popped " << v << '\n';
            else std::cout << "empty\n";
        } else if (cmd == "top") {
            int v;
            if (stack.top(v)) std::cout << "top=" << v << '\n';
            else std::cout << "empty\n";
        } else if (cmd == "size") {
            std::cout << "size=" << stack.size() << '\n';
        } else if (cmd == "print") {
            stack.print();
        }
    }
    return 0;
}
`,
          solution: String.raw`#include <algorithm>
#include <cstddef>
#include <iostream>
#include <string>

class IntStack {
public:
    IntStack() : capacity_(2), size_(0), data_(new int[2]) {}
    ~IntStack() {
        delete[] data_;
        std::cout << "released capacity " << capacity_ << '\n';
    }
    IntStack(const IntStack&) = delete;
    IntStack& operator=(const IntStack&) = delete;

    void push(int v) {
        if (size_ == capacity_) grow();
        data_[size_] = v;
        ++size_;
    }
    bool pop(int& out) {
        if (size_ == 0) return false;
        --size_;
        out = data_[size_];
        return true;
    }
    bool top(int& out) const {
        if (size_ == 0) return false;
        out = data_[size_ - 1];
        return true;
    }
    std::size_t size() const { return size_; }
    void print() const {
        std::cout << "stack:";
        if (size_ == 0) {
            std::cout << " (empty)\n";
            return;
        }
        for (std::size_t i = 0; i < size_; ++i) std::cout << ' ' << data_[i];
        std::cout << '\n';
    }

private:
    void grow() {
        const std::size_t bigger = capacity_ * 2;
        int* fresh = new int[bigger];
        std::copy(data_, data_ + size_, fresh);   // copy before the old block goes
        delete[] data_;
        data_ = fresh;
        std::cout << "grow " << capacity_ << " -> " << bigger << '\n';
        capacity_ = bigger;
    }

    std::size_t capacity_;
    std::size_t size_;
    int* data_;
};

int main() {
    IntStack stack;
    std::string cmd;
    while (std::cin >> cmd) {
        if (cmd == "push") {
            int v;
            std::cin >> v;
            stack.push(v);
        } else if (cmd == "pop") {
            int v;
            if (stack.pop(v)) std::cout << "popped " << v << '\n';
            else std::cout << "empty\n";
        } else if (cmd == "top") {
            int v;
            if (stack.top(v)) std::cout << "top=" << v << '\n';
            else std::cout << "empty\n";
        } else if (cmd == "size") {
            std::cout << "size=" << stack.size() << '\n';
        } else if (cmd == "print") {
            stack.print();
        }
    }
    return 0;
}
`,
          hints: [
            "Allocate the new block, copy size_ elements (std::copy or a loop), and only then delete[] the old one.",
            "Growth happens on the push that would exceed the capacity: the third push with capacity 2 prints grow 2 -> 4.",
            "The destructor reports the final capacity, which never shrinks.",
          ],
          cases: [
            { stdin: "push 1\npush 2\npush 3\nsize\nprint\npop\npop\ntop\npop\npop\n", expected: "grow 2 -> 4\nsize=3\nstack: 1 2 3\npopped 3\npopped 2\ntop=1\npopped 1\nempty\nreleased capacity 4\n" },
            { stdin: "top\npop\nprint\nsize\n", expected: "empty\nempty\nstack: (empty)\nsize=0\nreleased capacity 2\n" },
            { stdin: "", expected: "released capacity 2\n", hidden: true },
            { stdin: "push 1\npush 2\npush 3\npush 4\npush 5\nprint\npop\npush 9\nprint\n", expected: "grow 2 -> 4\ngrow 4 -> 8\nstack: 1 2 3 4 5\npopped 5\nstack: 1 2 3 4 9\nreleased capacity 8\n", hidden: true },
            { stdin: "push -1\npop\npush -2\npush -3\ntop\nsize\n", expected: "popped -1\ntop=-3\nsize=2\nreleased capacity 2\n", hidden: true },
          ],
        },
        {
          title: "A ledger of shared handles",
          prompt: `Named handles own resources through \`std::shared_ptr\`; several handles may share one resource. \`Resource\` has a name and a destructor that prints \`freed <name>\`. Keep the handles in a \`std::map<std::string, std::shared_ptr<Resource>>\` and process commands:

- \`create <handle> <resource>\` — if the handle exists print \`handle <handle> in use\`; otherwise \`std::make_shared\` the resource and print \`<resource> owners=<use_count>\`;
- \`alias <new> <existing>\` — if \`existing\` is unknown print \`unknown handle <existing>\`; if \`new\` is taken print \`handle <new> in use\`; otherwise copy the pointer and print \`<resource> owners=<use_count>\`;
- \`release <handle>\` — if unknown print \`unknown handle <handle>\`; otherwise erase it: when other owners remain print \`<resource> owners=<remaining>\`, and when it was the last owner the destructor's \`freed\` line is the only output.

When the input ends, release every remaining handle **in alphabetical order of handle name**, with exactly the output an explicit \`release\` would give — so every resource is freed before \`main\` returns and the order is defined.

**Input:** commands.
**Output:** one line per command, then the end-of-input releases.

\`\`\`text
create a disk
alias b a
create c net
release a
release b
release c
\`\`\`
prints
\`\`\`text
disk owners=1
disk owners=2
net owners=1
disk owners=1
freed disk
freed net
\`\`\``,
          starter: String.raw`#include <iostream>
#include <map>
#include <memory>
#include <string>
#include <utility>

struct Resource {
    std::string name;
    explicit Resource(const std::string& n) : name(n) {}
    ~Resource() { std::cout << "freed " << name << '\n'; }
};

using Handles = std::map<std::string, std::shared_ptr<Resource>>;

void release(Handles& handles, const std::string& handle) {
    // TODO: unknown handle, or erase and report the remaining owners (the destructor reports the last one)
    (void)handles;
    (void)handle;
}

int main() {
    Handles handles;
    std::string cmd;
    while (std::cin >> cmd) {
        if (cmd == "create") {
            std::string handle, name;
            std::cin >> handle >> name;
            // TODO
        } else if (cmd == "alias") {
            std::string fresh, existing;
            std::cin >> fresh >> existing;
            // TODO
        } else if (cmd == "release") {
            std::string handle;
            std::cin >> handle;
            release(handles, handle);
        }
    }
    // TODO: release the remaining handles in name order
    return 0;
}
`,
          solution: String.raw`#include <iostream>
#include <map>
#include <memory>
#include <string>
#include <utility>

struct Resource {
    std::string name;
    explicit Resource(const std::string& n) : name(n) {}
    ~Resource() { std::cout << "freed " << name << '\n'; }
};

using Handles = std::map<std::string, std::shared_ptr<Resource>>;

void release(Handles& handles, const std::string& handle) {
    auto it = handles.find(handle);
    if (it == handles.end()) {
        std::cout << "unknown handle " << handle << '\n';
        return;
    }
    const std::string name = it->second->name;          // copy: the resource may die on erase
    const long remaining = it->second.use_count() - 1;
    handles.erase(it);                                   // last owner: "freed <name>" prints here
    if (remaining > 0) std::cout << name << " owners=" << remaining << '\n';
}

int main() {
    Handles handles;
    std::string cmd;
    while (std::cin >> cmd) {
        if (cmd == "create") {
            std::string handle, name;
            std::cin >> handle >> name;
            if (handles.contains(handle)) {
                std::cout << "handle " << handle << " in use\n";
                continue;
            }
            auto& slot = handles[handle];
            slot = std::make_shared<Resource>(name);
            std::cout << name << " owners=" << slot.use_count() << '\n';
        } else if (cmd == "alias") {
            std::string fresh, existing;
            std::cin >> fresh >> existing;
            auto it = handles.find(existing);
            if (it == handles.end()) {
                std::cout << "unknown handle " << existing << '\n';
                continue;
            }
            if (handles.contains(fresh)) {
                std::cout << "handle " << fresh << " in use\n";
                continue;
            }
            handles[fresh] = it->second;                 // one more owner
            std::cout << it->second->name << " owners=" << it->second.use_count() << '\n';
        } else if (cmd == "release") {
            std::string handle;
            std::cin >> handle;
            release(handles, handle);
        }
    }
    while (!handles.empty()) {
        const std::string first = handles.begin()->first;   // copy: erase invalidates the key reference
        release(handles, first);
    }
    return 0;
}
`,
          hints: [
            "Copy the resource's name out before erasing the handle — after the erase the resource may already be gone.",
            "use_count() before the erase minus one is what remains; print it only when it is positive, because the destructor already reports the zero case.",
            "A std::map iterates in key order, so releasing handles.begin() until empty gives the alphabetical cleanup; copy the key before erasing it.",
          ],
          cases: [
            { stdin: "create a disk\nalias b a\ncreate c net\nrelease a\nrelease b\nrelease c\n", expected: "disk owners=1\ndisk owners=2\nnet owners=1\ndisk owners=1\nfreed disk\nfreed net\n" },
            { stdin: "create x cache\nalias y x\nalias z x\nrelease y\n", expected: "cache owners=1\ncache owners=2\ncache owners=3\ncache owners=2\ncache owners=1\nfreed cache\n" },
            { stdin: "release nothing\nalias q p\ncreate a r\ncreate a s\nalias b a\nalias b a\n", expected: "unknown handle nothing\nunknown handle p\nr owners=1\nhandle a in use\nr owners=2\nhandle b in use\nr owners=1\nfreed r\n", hidden: true },
            { stdin: "create z last\ncreate m mid\ncreate a first\n", expected: "last owners=1\nmid owners=1\nfirst owners=1\nfreed first\nfreed mid\nfreed last\n", hidden: true },
          ],
        },
        {
          title: "A pipeline on the exception path",
          prompt: `Combine a scope guard with a \`unique_ptr\` factory and watch both on the exception path. \`ScopeGuard\` prints \`start <id>\` in its constructor and \`cleanup <id>\` in its destructor. Write:

- \`std::unique_ptr<Result> run_task(const std::string& id, long long value)\` — declare a \`ScopeGuard\` for \`id\`; if \`value\` is negative \`throw std::invalid_argument("negative value for " + id)\`; otherwise return a \`Result\` made with \`std::make_unique\` holding \`id\` and \`value * value\`;
- \`long long store(std::unique_ptr<Result> result)\` — a sink: print \`stored <id> -> <square>\` and return the square.

\`main\` reads \`n\` tasks. For each, inside a \`try\`, call \`run_task\` and pass the result to \`store\` with \`std::move\`, adding the square to a total; \`catch\` the \`std::invalid_argument\` and print \`error: <what()>\`. Finally print \`results=<stored> total=<sum>\`. The guard's \`cleanup\` line must come before both \`stored\` (the guard dies when \`run_task\` returns) and \`error\` (unwinding runs it before the handler).

**Input:** \`n\`, then \`n\` lines of \`<id> <value>\` (|value| ≤ 1 000 000).
**Output:** three lines per task, then the summary.

\`\`\`text
3
a 3
b -2
c 10
\`\`\`
prints
\`\`\`text
start a
cleanup a
stored a -> 9
start b
cleanup b
error: negative value for b
start c
cleanup c
stored c -> 100
results=2 total=109
\`\`\``,
          starter: String.raw`#include <iostream>
#include <memory>
#include <stdexcept>
#include <string>
#include <utility>

struct Result {
    std::string id;
    long long square = 0;
};

class ScopeGuard {
public:
    explicit ScopeGuard(const std::string& id) : id_(id) {
        // TODO: "start <id>"
    }
    ~ScopeGuard() {
        // TODO: "cleanup <id>"
    }
    ScopeGuard(const ScopeGuard&) = delete;
    ScopeGuard& operator=(const ScopeGuard&) = delete;

private:
    std::string id_;
};

std::unique_ptr<Result> run_task(const std::string& id, long long value) {
    // TODO: guard, throw for negative, make_unique the result
    (void)id;
    (void)value;
    return nullptr;
}

long long store(std::unique_ptr<Result> result) {
    // TODO: "stored <id> -> <square>", return the square
    (void)result;
    return 0;
}

int main() {
    int n;
    std::cin >> n;
    int stored = 0;
    long long total = 0;
    for (int i = 0; i < n; ++i) {
        std::string id;
        long long value;
        std::cin >> id >> value;
        // TODO: try { run, store, count } catch (const std::invalid_argument& e) { "error: <what>" }
    }
    std::cout << "results=" << stored << " total=" << total << '\n';
    return 0;
}
`,
          solution: String.raw`#include <iostream>
#include <memory>
#include <stdexcept>
#include <string>
#include <utility>

struct Result {
    std::string id;
    long long square = 0;
};

class ScopeGuard {
public:
    explicit ScopeGuard(const std::string& id) : id_(id) {
        std::cout << "start " << id_ << '\n';
    }
    ~ScopeGuard() {
        std::cout << "cleanup " << id_ << '\n';
    }
    ScopeGuard(const ScopeGuard&) = delete;
    ScopeGuard& operator=(const ScopeGuard&) = delete;

private:
    std::string id_;
};

std::unique_ptr<Result> run_task(const std::string& id, long long value) {
    ScopeGuard guard(id);
    if (value < 0) throw std::invalid_argument("negative value for " + id);
    auto result = std::make_unique<Result>();
    result->id = id;
    result->square = value * value;
    return result;                                   // guard dies after the return value is ready
}

long long store(std::unique_ptr<Result> result) {
    std::cout << "stored " << result->id << " -> " << result->square << '\n';
    return result->square;                           // result dies at the brace
}

int main() {
    int n;
    std::cin >> n;
    int stored = 0;
    long long total = 0;
    for (int i = 0; i < n; ++i) {
        std::string id;
        long long value;
        std::cin >> id >> value;
        try {
            auto result = run_task(id, value);
            total += store(std::move(result));
            ++stored;
        } catch (const std::invalid_argument& e) {
            std::cout << "error: " << e.what() << '\n';
        }
    }
    std::cout << "results=" << stored << " total=" << total << '\n';
    return 0;
}
`,
          hints: [
            "The guard is a local of run_task, so its cleanup prints when run_task returns or throws — before main does anything with the result.",
            "Nothing special is needed for the exception path: unwinding destroys the guard, then the catch prints the message.",
            "store takes the unique_ptr by value; pass it with std::move and let the parameter's death free the Result.",
          ],
          cases: [
            { stdin: "3\na 3\nb -2\nc 10\n", expected: "start a\ncleanup a\nstored a -> 9\nstart b\ncleanup b\nerror: negative value for b\nstart c\ncleanup c\nstored c -> 100\nresults=2 total=109\n" },
            { stdin: "1\nzero 0\n", expected: "start zero\ncleanup zero\nstored zero -> 0\nresults=1 total=0\n" },
            { stdin: "0\n", expected: "results=0 total=0\n", hidden: true },
            { stdin: "2\nbig 1000000\nbad -1\n", expected: "start big\ncleanup big\nstored big -> 1000000000000\nstart bad\ncleanup bad\nerror: negative value for bad\nresults=1 total=1000000000000\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "What is the storage duration of a function parameter?",
          options: ["Static", "Automatic — it lives in the call's frame and dies when the call returns", "Dynamic", "Thread"],
          answer: 1,
          explanation: "Parameters are locals of the call: constructed on entry, destroyed on return, in the frame. Nothing about them survives the call, which is why returning a reference to one dangles.",
        },
        {
          prompt: "What does this print?\n\n```cpp\nstruct T {\n    char c;\n    T(char ch) : c(ch) { std::cout << c; }\n    ~T() { std::cout << '~' << c; }\n};\nvoid f(bool early) {\n    T a('a');\n    if (early) return;\n    T b('b');\n}\nint main() { f(true); f(false); }\n```",
          options: ["`a~aab~b~a`", "`a~aab~a~b`", "`ab~b~aab~b~a`", "`a~ab~b`"],
          answer: 0,
          explanation: "On the early path only `a` exists, so `a~a`. On the full path `b` is constructed after `a` and destroyed before it: `ab~b~a`. Objects declared after a `return` that is taken are never constructed.",
        },
        {
          prompt: "`int* p = new int[8]; delete p;` — what is the problem?",
          options: ["None — `delete` frees any pointer from `new`", "Mismatched forms: a `new[]` block must be released with `delete[]`; this is undefined behaviour", "A leak of seven ints", "A compile error"],
          answer: 1,
          explanation: "The array form records the element count and destroys each element; plain `delete` does neither. The standard makes the mismatch undefined, however it behaves on one allocator.",
        },
        {
          prompt: "Which `new` returns `nullptr` instead of throwing when memory is exhausted?",
          options: ["`new int[n]`", "`new (std::nothrow) int[n]`", "`new int[n]{}`", "`std::make_unique<int[]>(n)`"],
          answer: 1,
          explanation: "Only the `std::nothrow` placement form returns null. Every other form, including `make_unique`, throws `std::bad_alloc`.",
        },
        {
          prompt: "What does RAII give a function that manual acquire-and-release code cannot?",
          options: ["Faster allocation", "The release runs on every exit path — `return`, `break`, and an exception unwinding through — without any code in the function", "Automatic reference counting", "Protection against uninitialised reads"],
          answer: 1,
          explanation: "The destructor is the one cleanup the language guarantees to call, at every exit. Manual code must repeat the release at every `return` and cannot run it at all when an exception passes through.",
        },
        {
          prompt: "During stack unwinding from a `throw` to its `catch`, when do the destructors of automatic objects in the abandoned frames run?",
          options: ["After the handler finishes", "Before the handler body runs", "Only if the handler rethrows", "They do not run — unwinding skips destructors"],
          answer: 1,
          explanation: "Every frame between the throw and the handler is destroyed, its automatics in reverse order, before the handler's first statement. That is what makes RAII cleanup reliable on the exception path.",
        },
        {
          prompt: "After `auto b = std::move(a);` where `a` is a `std::unique_ptr<T>`, what is `a`?",
          options: ["Unchanged — `std::move` copies", "Null — a defined state you can test with `if (a)`", "Valid but unspecified", "Destroyed; using its name is a compile error"],
          answer: 1,
          explanation: "`unique_ptr`'s move constructor takes the pointer and leaves the source empty. Unlike a moved-from `std::string`, the state is specified: exactly `nullptr`.",
        },
        {
          prompt: "A function reads a `Document` and never stores it. The caller owns it through a `std::unique_ptr<Document>`. The parameter should be…",
          options: ["`std::unique_ptr<Document>`", "`std::unique_ptr<Document>&`", "`const Document&`", "`std::shared_ptr<Document>`"],
          answer: 2,
          explanation: "Lending is `const T&`; the caller passes `*doc`. By value would demand a `std::move` and take the document away; a `unique_ptr&` is for reseating; `shared_ptr` would force a change of ownership model for a read.",
        },
        {
          prompt: "What is special about `std::unique_ptr<int[]>`?",
          options: ["It bounds-checks `operator[]`", "It releases with `delete[]` and provides `operator[]`", "It cannot be created with `make_unique`", "It is the same as `std::vector<int>`"],
          answer: 1,
          explanation: "The array specialisation matches the array form of `new`. `std::make_unique<int[]>(n)` creates it, value-initialised. There is no bounds check, and no size, growth or iteration — which is why `std::vector` is usually the better choice.",
        },
        {
          prompt: "What does this print?\n\n```cpp\nauto a = std::make_shared<int>(7);\nauto b = a;\n{\n    auto c = b;\n    std::cout << a.use_count();\n}\nstd::cout << a.use_count();\n```",
          options: ["`32`", "`21`", "`33`", "`22`"],
          answer: 0,
          explanation: "Three owners while `c` exists, two after it is destroyed at the inner brace. Every copy is an owner; every destroyed copy decrements.",
        },
        {
          prompt: "What is `std::weak_ptr` for?",
          options: ["A faster `shared_ptr` without atomics", "Observing an object owned by `shared_ptr`s without keeping it alive — breaking cycles, caches, observer lists", "A `unique_ptr` that can be copied", "A pointer that is automatically null-checked"],
          answer: 1,
          explanation: "A `weak_ptr` holds the control block, not an ownership share. `lock()` produces a temporary owner when the object is still alive; a parent-child cycle with the back-pointer weak can reach zero and be freed.",
        },
        {
          prompt: "Why does a class use `std::enable_shared_from_this`?",
          options: ["To let a member function obtain a `shared_ptr` to `*this` that shares the existing control block", "To make its constructor return a `shared_ptr`", "To disable copying", "To allow `weak_ptr`s to point at it"],
          answer: 0,
          explanation: "`std::shared_ptr<T>(this)` would create a second control block and a double delete; `shared_from_this()` reuses the block of the `shared_ptr` that already owns the object. It works only once such an owner exists — not in the constructor.",
        },
        {
          prompt: "Which compiler flags enable AddressSanitizer with usable line numbers?",
          options: ["`-O2 -Wall`", "`-fsanitize=address -g`", "`-D_GLIBCXX_ASSERTIONS`", "`-fanalyzer`"],
          answer: 1,
          explanation: "`-fsanitize=address` instruments the binary; `-g` gives the report file and line numbers. `_GLIBCXX_ASSERTIONS` checks container indexing only; `-fanalyzer` is a compile-time analysis.",
        },
        {
          prompt: "Which of these is NOT undefined behaviour?",
          options: ["`delete nullptr;`", "`delete p; delete p;`", "`delete` on a pointer from `new[]`", "Reading `*p` after `delete p`"],
          answer: 0,
          explanation: "Deleting a null pointer is a defined no-op — the reason `delete` needs no null check. The other three are a double free, a mismatched form and a use after free.",
        },
      ],
    },
  ],
});

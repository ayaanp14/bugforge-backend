import { defineModule } from "../../dsl.js";

export default defineModule(import.meta.url, {
  slug: "classes",
  title: "Classes and objects",
  blurb: "Structs, aggregates and designated initialisers; constructors, the member-initialiser list and declaration-order initialisation; this, const member functions, mutable and chaining; static members and named constructors; invariants, friends and operator<<; the header/source split and a worked class design.",
  icon: "box",
  overview: `A \`struct\` or \`class\` is a type you define, and in C++ it is a *value*: held in the variable itself, copied on assignment, destroyed with its scope, laid out in memory exactly as its members are declared. Everything a Java programmer knows about objects is here, but with the handle removed — which is what makes a class able to own a heap block or a file, and what makes the questions of construction, constness and copying matter in a way they do not elsewhere.

The module builds a class from the outside in. Structs and aggregates first: default access, member functions inside and outside the class, brace and designated initialisation, and when a transparent bundle of data is the right design. Then constructors — the ones you write, the ones the compiler writes, the member-initialiser list, the rule that members are initialised in declaration order whatever the list says, delegation, \`explicit\`, and validation as the constructor's job. \`this\` and \`const\` member functions turn "does not modify" into a checked promise, with \`mutable\` for caches and \`return *this\` for chaining. Static members hold state that belongs to the type, from instance counters to named constructors. Encapsulation makes the case for private data precisely — an invariant the constructor establishes, mutators preserve and readers assume — and introduces \`friend\` for the few operations that need private access from outside, \`operator<<\` first among them. The last lesson splits a class across a header and a source file and walks one design from representation to interface.

Every exercise is a judged program on the Clang 18 / C++20 runtime: a bounding box built from aggregates, inventory records filled with designated initialisers, \`Money\` with three delegating constructors, a construction trace that proves the declaration-order rule, a statistics class whose cached mean counts its rebuilds, a query builder whose chain silently breaks when a mutator returns by value, counted sessions with copying deleted, temperatures built by named constructors, \`Money\` that prints itself through a friend, an \`Account\` audited by a friend class, a \`Date\` with \`dayOfYear\` and \`nextDay\`, and a \`Fraction\` written from a blank file through the eight-question checklist. The checkpoint adds a chaining gradebook, a grid with const and non-const \`at()\`, and an instrumented assembly line whose trace shows construction and destruction order.`,
  lessons: [
    {
      slug: "structs-and-classes",
      file: "01-structs-and-classes.md",
      exercises: [
        {
          title: "Bounding box",
          prompt: `Complete two structs and a free function. \`Point\` has \`int x = 0; int y = 0;\` and a member function \`int manhattan() const\` returning \`|x| + |y|\`, **declared inside the struct and defined outside it** with \`Point::manhattan\`. \`Rect\` has \`x\`, \`y\`, \`w\`, \`h\` (all \`int\`, defaulting to 0), \`long long area() const\` defined outside the struct, and \`bool isSquare() const\` defined inside it. \`Rect bounds(const std::vector<Point>&)\` returns the smallest rectangle containing every point — \`x\`/\`y\` its lowest corner, \`w\`/\`h\` its extent — **returned as a bare brace list** (\`return {minX, minY, ...};\`), since \`Rect\` is an aggregate.

Read \`n\` points and build each with a designated initialiser (\`Point{.x = x, .y = y}\`). Print the box, its area, whether it is square (a zero-by-zero box is), and the largest Manhattan distance of any point from the origin.

**Input:** \`n\` (at least 1), then \`n\` lines \`x y\`.
**Output:** four lines — \`bbox <x> <y> <w> <h>\`, \`area <area>\`, \`square yes|no\`, \`farthest <distance>\`.

\`\`\`text
4
1 2
5 -1
-3 4
2 2
\`\`\`
→
\`\`\`text
bbox -3 -1 8 5
area 40
square no
farthest 7
\`\`\``,
          starter: String.raw`#include <iostream>
#include <vector>

struct Point {
    int x = 0;
    int y = 0;
    // TODO: declare int manhattan() const here, define it outside
};

struct Rect {
    int x = 0;
    int y = 0;
    int w = 0;
    int h = 0;
    // TODO: long long area() const (defined outside) and bool isSquare() const (defined inside)
};

// TODO: Point::manhattan and Rect::area

Rect bounds(const std::vector<Point>& pts) {
    // TODO: lowest corner and extent, returned as a brace list
    return {};
}

int main() {
    int n;
    std::cin >> n;
    std::vector<Point> pts;
    for (int i = 0; i < n; ++i) {
        int x, y;
        std::cin >> x >> y;
        pts.push_back(Point{.x = x, .y = y});
    }
    Rect r = bounds(pts);
    // TODO: print bbox, area, square, farthest
    (void)r;
    return 0;
}
`,
          solution: String.raw`#include <iostream>
#include <vector>

struct Point {
    int x = 0;
    int y = 0;
    int manhattan() const;
};

struct Rect {
    int x = 0;
    int y = 0;
    int w = 0;
    int h = 0;
    long long area() const;
    bool isSquare() const { return w == h; }
};

int Point::manhattan() const {
    return (x < 0 ? -x : x) + (y < 0 ? -y : y);
}

long long Rect::area() const {
    return static_cast<long long>(w) * h;
}

Rect bounds(const std::vector<Point>& pts) {
    int minX = pts[0].x, maxX = pts[0].x;
    int minY = pts[0].y, maxY = pts[0].y;
    for (const Point& p : pts) {
        if (p.x < minX) minX = p.x;
        if (p.x > maxX) maxX = p.x;
        if (p.y < minY) minY = p.y;
        if (p.y > maxY) maxY = p.y;
    }
    return {minX, minY, maxX - minX, maxY - minY};
}

int main() {
    int n;
    std::cin >> n;
    std::vector<Point> pts;
    pts.reserve(static_cast<std::size_t>(n));
    for (int i = 0; i < n; ++i) {
        int x, y;
        std::cin >> x >> y;
        pts.push_back(Point{.x = x, .y = y});
    }
    Rect r = bounds(pts);
    int farthest = 0;
    for (const Point& p : pts) {
        if (p.manhattan() > farthest) farthest = p.manhattan();
    }
    std::cout << "bbox " << r.x << ' ' << r.y << ' ' << r.w << ' ' << r.h << '\n';
    std::cout << "area " << r.area() << '\n';
    std::cout << "square " << (r.isSquare() ? "yes" : "no") << '\n';
    std::cout << "farthest " << farthest << '\n';
    return 0;
}
`,
          hints: [
            "An out-of-class definition repeats the signature under the qualified name: int Point::manhattan() const { ... } — the const included.",
            "Start every min and max from the first point, not from 0; a box of only negative points has a negative maximum.",
            "return {minX, minY, maxX - minX, maxY - minY}; fills Rect's members in declaration order, exactly like Rect r{...} would.",
          ],
          cases: [
            { stdin: "4\n1 2\n5 -1\n-3 4\n2 2\n", expected: "bbox -3 -1 8 5\narea 40\nsquare no\nfarthest 7\n" },
            { stdin: "1\n3 -3\n", expected: "bbox 3 -3 0 0\narea 0\nsquare yes\nfarthest 6\n" },
            { stdin: "3\n0 0\n4 0\n0 4\n", expected: "bbox 0 0 4 4\narea 16\nsquare yes\nfarthest 4\n", hidden: true },
            { stdin: "2\n-2 -2\n2 5\n", expected: "bbox -2 -2 4 7\narea 28\nsquare no\nfarthest 7\n", hidden: true },
          ],
        },
        {
          title: "Inventory records",
          prompt: `Define the aggregate \`struct Item { std::string name; int quantity = 0; long long unitCents = 0; bool discontinued = false; }\` with one member function, \`long long value() const\`, returning \`quantity * unitCents\`. Read \`n\` stock lines and build every \`Item\` with a **designated initialiser** naming the members you set — \`Item{.name = name, .quantity = qty, .unitCents = cents, .discontinued = flag == "x"}\` — so that a reader sees which value went where.

Print one line per item: \`<name>: <quantity> at <unitCents> -> <value>\`, with \` discontinued\` appended when the flag is \`x\`. Then \`stock value <sum of value() over items still stocked>\` and \`discontinued <count>\`.

**Input:** \`n\`, then \`n\` lines \`name quantity unitCents flag\` where \`flag\` is \`ok\` or \`x\`.
**Output:** \`n + 2\` lines.

\`\`\`text
3
bolt 10 25 ok
nut 40 5 ok
gear 2 1500 x
\`\`\`
→
\`\`\`text
bolt: 10 at 25 -> 250
nut: 40 at 5 -> 200
gear: 2 at 1500 -> 3000 discontinued
stock value 450
discontinued 1
\`\`\``,
          starter: String.raw`#include <iostream>
#include <string>
#include <vector>

// TODO: struct Item — name, quantity, unitCents, discontinued (with defaults) and value()

int main() {
    int n;
    std::cin >> n;
    for (int i = 0; i < n; ++i) {
        std::string name, flag;
        int qty;
        long long cents;
        std::cin >> name >> qty >> cents >> flag;
        // TODO: build an Item with a designated initialiser and keep it
    }
    // TODO: print each item, the stock value and the discontinued count
    return 0;
}
`,
          solution: String.raw`#include <iostream>
#include <string>
#include <vector>

struct Item {
    std::string name;
    int quantity = 0;
    long long unitCents = 0;
    bool discontinued = false;
    long long value() const { return quantity * unitCents; }
};

int main() {
    int n;
    std::cin >> n;
    std::vector<Item> items;
    for (int i = 0; i < n; ++i) {
        std::string name, flag;
        int qty;
        long long cents;
        std::cin >> name >> qty >> cents >> flag;
        items.push_back(Item{.name = name, .quantity = qty, .unitCents = cents, .discontinued = flag == "x"});
    }
    long long stock = 0;
    int gone = 0;
    for (const Item& it : items) {
        std::cout << it.name << ": " << it.quantity << " at " << it.unitCents << " -> " << it.value();
        if (it.discontinued) {
            std::cout << " discontinued";
            ++gone;
        } else {
            stock += it.value();
        }
        std::cout << '\n';
    }
    std::cout << "stock value " << stock << '\n';
    std::cout << "discontinued " << gone << '\n';
    return 0;
}
`,
          hints: [
            "A struct with public members, no constructor and no virtual functions is an aggregate; braces initialise it member by member.",
            "Designators must follow declaration order: .name, .quantity, .unitCents, .discontinued — a different order is a compile error.",
            "quantity * unitCents is int times long long, so the product is computed in long long; keep value() returning long long.",
          ],
          cases: [
            { stdin: "3\nbolt 10 25 ok\nnut 40 5 ok\ngear 2 1500 x\n", expected: "bolt: 10 at 25 -> 250\nnut: 40 at 5 -> 200\ngear: 2 at 1500 -> 3000 discontinued\nstock value 450\ndiscontinued 1\n" },
            { stdin: "1\nwidget 0 999 ok\n", expected: "widget: 0 at 999 -> 0\nstock value 0\ndiscontinued 0\n" },
            { stdin: "2\na 1 1 x\nb 1 1 x\n", expected: "a: 1 at 1 -> 1 discontinued\nb: 1 at 1 -> 1 discontinued\nstock value 0\ndiscontinued 2\n", hidden: true },
            { stdin: "2\nrod 100000 100000 ok\ncap 3 7 ok\n", expected: "rod: 100000 at 100000 -> 10000000000\ncap: 3 at 7 -> 21\nstock value 10000000021\ndiscontinued 0\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "What are the differences between `struct` and `class` in C++?",
          options: ["A `struct` cannot have member functions", "Only default member access (public vs private) and default inheritance access", "A `class` is allocated on the heap, a `struct` on the stack", "A `struct` cannot have a constructor"],
          answer: 1,
          explanation: "The two keywords define the same kind of type. Members of a `struct` are public and its bases inherited publicly by default; for a `class` both default to private. Where an object lives depends on how it is declared, not on the keyword.",
        },
        {
          prompt: "```cpp\nPoint p();\np.x = 3;\n```\nWhy does the second line fail to compile?",
          options: ["`Point` has no default constructor", "`p` is a function declaration — the most vexing parse — so it has no member `x`", "`x` is private", "A `Point` must be initialised with braces"],
          answer: 1,
          explanation: "`Point p();` declares a function named `p` taking no arguments and returning `Point`. Write `Point p;` or `Point p{};` to declare an object.",
        },
        {
          prompt: "```cpp\nstruct Config { std::string host = \"localhost\"; int port = 8080; bool verbose = false; };\nConfig c{.verbose = true, .port = 9000};\n```\nWhat happens?",
          options: ["`c` is `{\"localhost\", 9000, true}`", "Compile error: designators must appear in declaration order", "`c` is `{\"localhost\", 8080, true}` — `port` is ignored", "Undefined behaviour"],
          answer: 1,
          explanation: "Designated initialisers must name members in the order they are declared; naming `verbose` before `port` is an error, not a reordering. `Config c{.port = 9000, .verbose = true};` is the valid spelling.",
        },
        {
          prompt: "With the same `Config`, what does `Config b{\"example.org\"};` produce?",
          options: ["Compile error: all three members must be given", "`host` is set; `port` and `verbose` keep their default member initialisers (8080, false)", "`host` is set; `port` and `verbose` are indeterminate", "`host` is set; `port` and `verbose` are zero and false regardless of the defaults"],
          answer: 1,
          explanation: "Positional aggregate initialisation fills members in order and leaves the rest to their default member initialisers. Only a member with no initialiser would be value-initialised to zero.",
        },
        {
          prompt: "```cpp\nstruct Rect { int w, h; int area() const; };\nint area() { return 0; }   // intended as Rect::area\n```\nWhat is the result?",
          options: ["It works: the compiler matches the name to the declaration", "Compile error on the definition", "An unrelated free function; calling `r.area()` fails at link time with an undefined reference", "`Rect::area` returns 0"],
          answer: 2,
          explanation: "Without the `Rect::` qualifier the definition is a free function named `area`, and the member is declared but never defined. The compiler accepts the call; the linker reports `Rect::area() const` as undefined.",
        },
        {
          prompt: "```cpp\nPoint a{1, 2};\nPoint b = a;\nb.x = 10;\nstd::cout << a.x;\n```\nWhat is printed?",
          options: ["`10`", "`1`", "It depends on whether `Point` is a `struct` or a `class`", "Undefined behaviour"],
          answer: 1,
          explanation: "`b` is a copy: a separate object with its own members. Objects are values, not handles, so changing `b` never affects `a`.",
        },
        {
          prompt: "Which of these types is an aggregate?",
          options: ["```cpp\nstruct A { int x; explicit A(int v) : x(v) {} };\n```", "```cpp\nclass B { int x; public: int get() const { return x; } };\n```", "```cpp\nstruct C { std::string name; int count = 0; double ratio = 1.0; };\n```", "```cpp\nstruct D { int x; virtual int f() { return x; } };\n```"],
          answer: 2,
          explanation: "An aggregate has no user-declared constructors, no private or protected non-static data members, no virtual functions and no base classes; default member initialisers are allowed. `A` declares a constructor, `B` has private data, `D` has a virtual function.",
        },
      ],
    },
    {
      slug: "constructors",
      file: "02-constructors.md",
      exercises: [
        {
          title: "Money, three ways",
          prompt: `Write \`class Money\` holding \`long long cents_\` with three constructors. \`explicit Money(long long cents)\` is the target: it initialises the member in its **member-initialiser list** and throws \`std::invalid_argument\` when \`cents\` is negative. \`Money(long long units, int hundredths)\` **delegates** to it with \`units * 100 + hundredths\`, then checks in its own body that \`hundredths\` is 0–99 and throws otherwise. \`Money()\` delegates with 0. Add \`long long cents() const\`, \`Money add(const Money&) const\` (a new object; \`Money\` is a value) and \`std::string text() const\` printing \`<units>.<two digits>\`.

Read \`n\` commands. \`c <cents>\` builds with the first constructor, \`u <units> <hundredths>\` with the second, \`z\` with the third. Print each amount's \`text()\`, or \`invalid\` when the constructor threw (catch \`const std::invalid_argument&\`), and keep a running total of the valid ones starting from \`Money()\`. Finish with \`total <text>\`.

**Input:** \`n\`, then \`n\` command lines.
**Output:** \`n + 1\` lines.

\`\`\`text
4
c 1234
u 5 7
z
u 2 150
\`\`\`
→
\`\`\`text
12.34
5.07
0.00
invalid
total 17.41
\`\`\``,
          starter: String.raw`#include <iostream>
#include <stdexcept>
#include <string>

class Money {
    long long cents_;
public:
    // TODO: rewrite these three. The first initialises cents_ in its list and throws
    //       std::invalid_argument on a negative; the second delegates to it with
    //       units * 100 + hundredths and then checks hundredths is 0..99; the third
    //       delegates with 0. The placeholders only keep the file compiling.
    explicit Money(long long cents) : cents_(cents) {}
    Money(long long units, int hundredths) : cents_(units * 100 + hundredths) {}
    Money() : cents_(0) {}
    long long cents() const { return cents_; }
    Money add(const Money& other) const;
    std::string text() const;
};

Money Money::add(const Money& other) const {
    return Money(cents_ + other.cents_);
}

std::string Money::text() const {
    std::string tail = std::to_string(cents_ % 100);
    if (tail.size() < 2) tail = "0" + tail;
    return std::to_string(cents_ / 100) + "." + tail;
}

Money readMoney(char kind) {
    if (kind == 'c') {
        long long c;
        std::cin >> c;
        return Money(c);
    }
    if (kind == 'u') {
        long long u;
        int h;
        std::cin >> u >> h;
        return Money(u, h);
    }
    return Money();
}

int main() {
    int n;
    std::cin >> n;
    Money total;
    for (int i = 0; i < n; ++i) {
        char kind;
        std::cin >> kind;
        // TODO: build the amount, print text() or "invalid", add valid ones to total
    }
    std::cout << "total " << total.text() << '\n';
    return 0;
}
`,
          solution: String.raw`#include <iostream>
#include <stdexcept>
#include <string>

class Money {
    long long cents_;
public:
    explicit Money(long long cents) : cents_(cents) {
        if (cents < 0) throw std::invalid_argument("negative amount");
    }
    Money(long long units, int hundredths) : Money(units * 100 + hundredths) {
        if (hundredths < 0 || hundredths > 99) throw std::invalid_argument("bad hundredths");
    }
    Money() : Money(0) {}
    long long cents() const { return cents_; }
    Money add(const Money& other) const;
    std::string text() const;
};

Money Money::add(const Money& other) const {
    return Money(cents_ + other.cents_);
}

std::string Money::text() const {
    std::string tail = std::to_string(cents_ % 100);
    if (tail.size() < 2) tail = "0" + tail;
    return std::to_string(cents_ / 100) + "." + tail;
}

Money readMoney(char kind) {
    if (kind == 'c') {
        long long c;
        std::cin >> c;
        return Money(c);
    }
    if (kind == 'u') {
        long long u;
        int h;
        std::cin >> u >> h;
        return Money(u, h);
    }
    return Money();
}

int main() {
    int n;
    std::cin >> n;
    Money total;
    for (int i = 0; i < n; ++i) {
        char kind;
        std::cin >> kind;
        try {
            Money m = readMoney(kind);
            std::cout << m.text() << '\n';
            total = total.add(m);
        } catch (const std::invalid_argument&) {
            std::cout << "invalid\n";
        }
    }
    std::cout << "total " << total.text() << '\n';
    return 0;
}
`,
          hints: [
            "A delegating constructor's initialiser list is exactly one entry — the other constructor: Money(long long units, int hundredths) : Money(units * 100 + hundredths) { ... }.",
            "The delegating constructor's body runs after the target has finished, so the hundredths check goes there; a throw from it means no object is created.",
            "Read the numbers before constructing, so a throwing constructor does not leave unread tokens on the stream.",
          ],
          cases: [
            { stdin: "4\nc 1234\nu 5 7\nz\nu 2 150\n", expected: "12.34\n5.07\n0.00\ninvalid\ntotal 17.41\n" },
            { stdin: "2\nc -5\nu 0 99\n", expected: "invalid\n0.99\ntotal 0.99\n" },
            { stdin: "3\nu 100 0\nc 5\nu -1 50\n", expected: "100.00\n0.05\ninvalid\ntotal 100.05\n", hidden: true },
            { stdin: "1\nz\n", expected: "0.00\ntotal 0.00\n", hidden: true },
          ],
        },
        {
          title: "Robots, traced",
          prompt: `\`Part\` is an instrumented member type: its constructor prints \`build <name>\` and its destructor \`scrap <name>\`. \`Robot\` has three \`Part\` members declared in the order \`head_\`, \`arm_\`, \`leg_\`, each with a **default member initialiser** naming it \`head\`, \`arm\` and \`leg\`, and a defaulted default constructor. Add two constructors:

- \`explicit Robot(const std::string& prefix)\` initialises all three members **in the member-initialiser list** as \`<prefix>-head\`, \`<prefix>-arm\`, \`<prefix>-leg\`, then its body prints \`robot <prefix> ready\`;
- \`explicit Robot(int serial)\` **delegates** to the first with \`"r" + std::to_string(serial)\`, then its body prints \`serial <serial>\`.

Read \`n\` commands, each run in its own block so the robot is destroyed at the closing brace: \`d\` builds \`Robot r;\`, \`p <prefix>\` builds \`Robot r(prefix);\`, \`n <serial>\` builds \`Robot r(serial);\`. Print \`--\` after each block. Predict the trace before you run it: members are built in declaration order and scrapped in reverse, whatever any list says.

**Input:** \`n\`, then \`n\` commands.
**Output:** the trace.

\`\`\`text
2
d
n 7
\`\`\`
→
\`\`\`text
build head
build arm
build leg
scrap leg
scrap arm
scrap head
--
build r7-head
build r7-arm
build r7-leg
robot r7 ready
serial 7
scrap r7-leg
scrap r7-arm
scrap r7-head
--
\`\`\``,
          starter: String.raw`#include <iostream>
#include <string>

struct Part {
    std::string name;
    explicit Part(std::string n) : name(std::move(n)) { std::cout << "build " << name << '\n'; }
    ~Part() { std::cout << "scrap " << name << '\n'; }
};

class Robot {
    Part head_{"head"};
    Part arm_{"arm"};
    Part leg_{"leg"};
public:
    Robot() = default;
    // TODO: explicit Robot(const std::string& prefix) — initialiser list, then "robot <prefix> ready"
    // TODO: explicit Robot(int serial) — delegates with "r" + std::to_string(serial), then "serial <serial>"
};

int main() {
    int n;
    std::cin >> n;
    for (int i = 0; i < n; ++i) {
        char cmd;
        std::cin >> cmd;
        if (cmd == 'd') {
            Robot r;
        } else if (cmd == 'p') {
            std::string prefix;
            std::cin >> prefix;
            // TODO: Robot r(prefix);
        } else {
            int serial;
            std::cin >> serial;
            // TODO: Robot r(serial);
        }
        std::cout << "--\n";
    }
    return 0;
}
`,
          solution: String.raw`#include <iostream>
#include <string>

struct Part {
    std::string name;
    explicit Part(std::string n) : name(std::move(n)) { std::cout << "build " << name << '\n'; }
    ~Part() { std::cout << "scrap " << name << '\n'; }
};

class Robot {
    Part head_{"head"};
    Part arm_{"arm"};
    Part leg_{"leg"};
public:
    Robot() = default;
    explicit Robot(const std::string& prefix)
        : head_(prefix + "-head"), arm_(prefix + "-arm"), leg_(prefix + "-leg") {
        std::cout << "robot " << prefix << " ready\n";
    }
    explicit Robot(int serial) : Robot("r" + std::to_string(serial)) {
        std::cout << "serial " << serial << '\n';
    }
};

int main() {
    int n;
    std::cin >> n;
    for (int i = 0; i < n; ++i) {
        char cmd;
        std::cin >> cmd;
        if (cmd == 'd') {
            Robot r;
        } else if (cmd == 'p') {
            std::string prefix;
            std::cin >> prefix;
            Robot r(prefix);
        } else {
            int serial;
            std::cin >> serial;
            Robot r(serial);
        }
        std::cout << "--\n";
    }
    return 0;
}
`,
          hints: [
            "An entry in the initialiser list replaces the default member initialiser for that member: head_(prefix + \"-head\").",
            "The delegating form is : Robot(\"r\" + std::to_string(serial)) with nothing else in the list; its body runs after the target's body.",
            "Every Robot in a block is destroyed at the block's closing brace, so the scrap lines come before the -- line.",
          ],
          cases: [
            { stdin: "2\nd\nn 7\n", expected: "build head\nbuild arm\nbuild leg\nscrap leg\nscrap arm\nscrap head\n--\nbuild r7-head\nbuild r7-arm\nbuild r7-leg\nrobot r7 ready\nserial 7\nscrap r7-leg\nscrap r7-arm\nscrap r7-head\n--\n" },
            { stdin: "1\np x\n", expected: "build x-head\nbuild x-arm\nbuild x-leg\nrobot x ready\nscrap x-leg\nscrap x-arm\nscrap x-head\n--\n" },
            { stdin: "2\np mk2\nd\n", expected: "build mk2-head\nbuild mk2-arm\nbuild mk2-leg\nrobot mk2 ready\nscrap mk2-leg\nscrap mk2-arm\nscrap mk2-head\n--\nbuild head\nbuild arm\nbuild leg\nscrap leg\nscrap arm\nscrap head\n--\n", hidden: true },
            { stdin: "1\nn 42\n", expected: "build r42-head\nbuild r42-arm\nbuild r42-leg\nrobot r42 ready\nserial 42\nscrap r42-leg\nscrap r42-arm\nscrap r42-head\n--\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "A class had only compiler-generated constructors and `Account a;` compiled. After `Account(std::string owner, long long opening)` is added, `Account a;` fails. Why?",
          options: ["Every constructor must now take arguments", "Declaring any constructor stops the compiler generating the default one; add `Account() = default;`", "`std::string` members cannot be default-constructed", "The class became an aggregate"],
          answer: 1,
          explanation: "The implicit default constructor exists only while the class declares no constructor at all. `= default` asks for it explicitly; the members' types are irrelevant.",
        },
        {
          prompt: "```cpp\nclass Buffer {\n    std::vector<int> data_;\n    std::size_t size_;\npublic:\n    Buffer(std::size_t n) : size_(n), data_(size_) {}\n};\n```\nWhat does `Buffer b(10);` do?",
          options: ["Creates a vector of 10 elements; the list order is what counts", "Undefined behaviour: `data_` is declared first, so `data_(size_)` runs before `size_` is initialised", "Compile error: the initialiser list is out of order", "Creates an empty vector, then resizes it to 10"],
          answer: 1,
          explanation: "Members are initialised in declaration order, so `data_` is built from an indeterminate `size_`. `-Wreorder` warns; the fix is `data_(n)` — read the parameter, never a later member.",
        },
        {
          prompt: "Why must a `const` member or a reference member be initialised in the member-initialiser list rather than assigned in the constructor body?",
          options: ["Because the body cannot see private members", "Because by the time the body runs every member already exists, and neither a `const` nor a reference can be assigned afterwards", "Because the initialiser list is faster and the compiler enforces the faster form", "It is a style rule only; both compile"],
          answer: 1,
          explanation: "Initialisation happens before the body; a member not in the list is default-initialised, which is a compile error for a reference and leaves a `const` unassignable. For a `std::string` the body form merely does two operations instead of one.",
        },
        {
          prompt: "```cpp\nMoney(long long units, int hundredths) : Money(units * 100 + hundredths), cents_(0) {}\n```\nWhat happens?",
          options: ["Delegates, then sets `cents_` to 0", "Compile error: a delegating constructor's initialiser list may contain nothing but the delegation", "`cents_` is initialised twice; the second wins", "Undefined behaviour"],
          answer: 1,
          explanation: "When a constructor delegates, the target constructor is the entire initialiser list. Anything else there is an error; extra work belongs in the delegating constructor's body.",
        },
        {
          prompt: "With `explicit Money(long long cents);` and `void charge(Money m);`, which line does **not** compile?",
          options: ["`Money m{250};`", "`Money m(250);`", "`Money m = 250;`", "`charge(Money{250});`"],
          answer: 2,
          explanation: "`explicit` forbids implicit conversion from the argument type, and copy-initialisation with `=` is an implicit conversion. Direct initialisation with braces or parentheses and an explicit `Money{250}` argument all still work.",
        },
        {
          prompt: "A constructor validates its arguments and throws `std::invalid_argument`. What exists after the throw?",
          options: ["A half-built object whose destructor runs at scope exit", "No object at all; members already constructed are destroyed during unwinding", "An object in a default state", "A null object that must be checked before use"],
          answer: 1,
          explanation: "A constructor that exits by exception produces no object, so the destructor never runs; the fully constructed members are destroyed automatically. That is what makes \"an object that exists is valid\" a guarantee.",
        },
        {
          prompt: "What does `Session() = delete;` achieve?",
          options: ["Removes the destructor", "Declares the default constructor so that using it is a compile error naming the deleted function", "Makes the class abstract", "Prevents the class from being copied"],
          answer: 1,
          explanation: "`= delete` declares a function and forbids its use; `Session s;` then fails with \"use of deleted function\". Copying is governed by the copy constructor and assignment (Module 9), not by the default constructor.",
        },
      ],
    },
    {
      slug: "this-and-const-members",
      file: "03-this-and-const-members.md",
      exercises: [
        {
          title: "A cached mean, counted",
          prompt: `Complete \`class Stats\`: \`void add(double)\` appends a value and invalidates the cache; \`double mean() const\` returns the mean (0 for no values), recomputing it only when the cache is invalid and counting every recomputation; \`int rebuilds() const\` reports that count; \`std::size_t count() const\` the number of values. The cache — \`cachedMean_\`, \`cacheValid_\` and \`rebuilds_\` — must be \`mutable\`, because \`mean()\` is \`const\` and is called through the free function \`report(const Stats&)\`, which can reach only const members.

Read \`n\` commands: \`add <x>\`, \`mean\` (call \`report\`, which prints \`mean <m> of <count>\` with two decimals), \`rebuilds\` (prints \`rebuilds <k>\`).

**Input:** \`n\`, then \`n\` commands.
**Output:** one line per \`mean\` or \`rebuilds\` command.

\`\`\`text
7
add 4
add 6
mean
mean
add 11
mean
rebuilds
\`\`\`
→
\`\`\`text
mean 5.00 of 2
mean 5.00 of 2
mean 7.00 of 3
rebuilds 2
\`\`\``,
          starter: String.raw`#include <iomanip>
#include <iostream>
#include <string>
#include <vector>

class Stats {
    std::vector<double> values_;
    // TODO: mutable cache members — cachedMean_, cacheValid_, rebuilds_
public:
    void add(double v) {
        values_.push_back(v);
        // TODO: invalidate the cache
    }
    std::size_t count() const { return values_.size(); }
    double mean() const {
        // TODO: rebuild only when the cache is invalid, counting rebuilds
        double sum = 0;
        for (double v : values_) sum += v;
        return values_.empty() ? 0 : sum / static_cast<double>(values_.size());
    }
    int rebuilds() const { return 0; }   // TODO
};

void report(const Stats& s) {
    std::cout << "mean " << s.mean() << " of " << s.count() << '\n';
}

int main() {
    std::cout << std::fixed << std::setprecision(2);
    int n;
    std::cin >> n;
    Stats s;
    for (int i = 0; i < n; ++i) {
        std::string cmd;
        std::cin >> cmd;
        if (cmd == "add") {
            double v;
            std::cin >> v;
            s.add(v);
        } else if (cmd == "mean") {
            report(s);
        } else {
            std::cout << "rebuilds " << s.rebuilds() << '\n';
        }
    }
    return 0;
}
`,
          solution: String.raw`#include <iomanip>
#include <iostream>
#include <string>
#include <vector>

class Stats {
    std::vector<double> values_;
    mutable double cachedMean_ = 0;
    mutable bool cacheValid_ = false;
    mutable int rebuilds_ = 0;
public:
    void add(double v) {
        values_.push_back(v);
        cacheValid_ = false;
    }
    std::size_t count() const { return values_.size(); }
    double mean() const {
        if (!cacheValid_) {
            double sum = 0;
            for (double v : values_) sum += v;
            cachedMean_ = values_.empty() ? 0 : sum / static_cast<double>(values_.size());
            cacheValid_ = true;
            ++rebuilds_;
        }
        return cachedMean_;
    }
    int rebuilds() const { return rebuilds_; }
};

void report(const Stats& s) {
    std::cout << "mean " << s.mean() << " of " << s.count() << '\n';
}

int main() {
    std::cout << std::fixed << std::setprecision(2);
    int n;
    std::cin >> n;
    Stats s;
    for (int i = 0; i < n; ++i) {
        std::string cmd;
        std::cin >> cmd;
        if (cmd == "add") {
            double v;
            std::cin >> v;
            s.add(v);
        } else if (cmd == "mean") {
            report(s);
        } else {
            std::cout << "rebuilds " << s.rebuilds() << '\n';
        }
    }
    return 0;
}
`,
          hints: [
            "Without mutable, assigning to cachedMean_ inside a const member function is an error: the object is const there.",
            "A rebuild happens on the first mean() after any add — and on the very first mean() of an empty Stats, which still counts.",
            "add() only marks the cache invalid; the recomputation is deferred until someone asks for the mean.",
          ],
          cases: [
            { stdin: "7\nadd 4\nadd 6\nmean\nmean\nadd 11\nmean\nrebuilds\n", expected: "mean 5.00 of 2\nmean 5.00 of 2\nmean 7.00 of 3\nrebuilds 2\n" },
            { stdin: "3\nmean\nmean\nrebuilds\n", expected: "mean 0.00 of 0\nmean 0.00 of 0\nrebuilds 1\n" },
            { stdin: "5\nadd 1.5\nadd 2.5\nrebuilds\nmean\nrebuilds\n", expected: "rebuilds 0\nmean 2.00 of 2\nrebuilds 1\n", hidden: true },
            { stdin: "6\nadd -3\nmean\nadd -3\nadd 9\nmean\nrebuilds\n", expected: "mean -3.00 of 1\nmean 1.00 of 3\nrebuilds 2\n", hidden: true },
          ],
        },
        {
          title: "A chaining query builder",
          prompt: `Complete \`class Query\`. The three mutators — \`from(std::string table)\`, \`where(std::string condition)\` (appends; any number may be given) and \`limit(int n)\` — must each **return \`Query&\`** with \`return *this;\` so that calls chain on the same object. \`std::string text() const\` renders \`SELECT * FROM <table>\`, then \` WHERE <c1> AND <c2> ...\` when there are conditions, then \` LIMIT <n>\` when the limit is positive.

For each of \`n\` queries, read \`table limit k\` and then \`k\` condition lines (they may contain spaces). Build it as \`q.from(table).limit(limit);\` followed by one \`q.where(c)\` per condition, and print \`q.text()\` through a \`const Query&\`. If your mutators return by value, the chain modifies a temporary and the limit is silently lost — the visible case catches it.

**Input:** \`n\`, then for each query a line \`table limit k\` and \`k\` lines.
**Output:** \`n\` lines of SQL.

\`\`\`text
2
users 10 2
age > 18
city is pune
orders 0 0
\`\`\`
→
\`\`\`text
SELECT * FROM users WHERE age > 18 AND city is pune LIMIT 10
SELECT * FROM orders
\`\`\``,
          starter: String.raw`#include <iostream>
#include <string>
#include <vector>

class Query {
    std::string table_;
    std::vector<std::string> where_;
    int limit_ = 0;
public:
    // TODO: these must return Query& and return *this
    Query from(std::string t) { table_ = std::move(t); return *this; }
    Query where(std::string w) { where_.push_back(std::move(w)); return *this; }
    Query limit(int n) { limit_ = n; return *this; }
    std::string text() const {
        // TODO: SELECT * FROM table [WHERE c1 AND c2 ...] [LIMIT n]
        return "SELECT * FROM " + table_;
    }
};

void print(const Query& q) {
    std::cout << q.text() << '\n';
}

int main() {
    int n;
    std::cin >> n;
    for (int i = 0; i < n; ++i) {
        std::string table;
        int lim, k;
        std::cin >> table >> lim >> k;
        std::cin.ignore();
        Query q;
        q.from(table).limit(lim);
        for (int j = 0; j < k; ++j) {
            std::string cond;
            std::getline(std::cin, cond);
            q.where(cond);
        }
        print(q);
    }
    return 0;
}
`,
          solution: String.raw`#include <iostream>
#include <string>
#include <vector>

class Query {
    std::string table_;
    std::vector<std::string> where_;
    int limit_ = 0;
public:
    Query& from(std::string t) { table_ = std::move(t); return *this; }
    Query& where(std::string w) { where_.push_back(std::move(w)); return *this; }
    Query& limit(int n) { limit_ = n; return *this; }
    std::string text() const {
        std::string out = "SELECT * FROM " + table_;
        for (std::size_t i = 0; i < where_.size(); ++i) {
            out += (i == 0 ? " WHERE " : " AND ") + where_[i];
        }
        if (limit_ > 0) out += " LIMIT " + std::to_string(limit_);
        return out;
    }
};

void print(const Query& q) {
    std::cout << q.text() << '\n';
}

int main() {
    int n;
    std::cin >> n;
    for (int i = 0; i < n; ++i) {
        std::string table;
        int lim, k;
        std::cin >> table >> lim >> k;
        std::cin.ignore();
        Query q;
        q.from(table).limit(lim);
        for (int j = 0; j < k; ++j) {
            std::string cond;
            std::getline(std::cin, cond);
            q.where(cond);
        }
        print(q);
    }
    return 0;
}
`,
          hints: [
            "Change the return type of each mutator to Query&; return *this then yields the object itself, not a copy.",
            "With the by-value version, q.from(table) modifies q and returns a copy; .limit(lim) then modifies that copy, which is destroyed at the semicolon.",
            "Join conditions with \" WHERE \" before the first and \" AND \" before each later one; std::to_string turns the limit into text.",
          ],
          cases: [
            { stdin: "2\nusers 10 2\nage > 18\ncity is pune\norders 0 0\n", expected: "SELECT * FROM users WHERE age > 18 AND city is pune LIMIT 10\nSELECT * FROM orders\n" },
            { stdin: "1\nlogs 5 1\nlevel above warn\n", expected: "SELECT * FROM logs WHERE level above warn LIMIT 5\n" },
            { stdin: "1\nt 0 3\na\nb\nc\n", expected: "SELECT * FROM t WHERE a AND b AND c\n", hidden: true },
            { stdin: "2\nx 1 0\ny 2 1\nz\n", expected: "SELECT * FROM x LIMIT 1\nSELECT * FROM y WHERE z LIMIT 2\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "Inside `long long Account::balance() const`, what is the type of `this`?",
          options: ["`Account*`", "`const Account*`", "`Account&`", "`const Account`"],
          answer: 1,
          explanation: "The trailing `const` qualifies `this`: it becomes a pointer to a `const Account`, which is why the body cannot assign to members or call non-const member functions.",
        },
        {
          prompt: "```cpp\nclass Query {\npublic:\n    Query from(std::string t) { table_ = std::move(t); return *this; }\n    Query limit(int n) { limit_ = n; return *this; }\n    // ...\n};\nQuery q;\nq.from(\"users\").limit(5);\n```\nAfter these lines, what does `q` hold?",
          options: ["Table `users`, limit 5", "Table `users`, limit 0 — `limit` ran on a copy returned by value", "Nothing: both calls ran on temporaries", "Compile error: `*this` cannot be returned by value"],
          answer: 1,
          explanation: "`q.from(...)` modifies `q` and returns a copy; `.limit(5)` modifies that temporary, which dies at the semicolon. Returning `Query&` makes the whole chain act on `q`.",
        },
        {
          prompt: "A function takes `const Account& a`. Which of `a`'s member functions can it call?",
          options: ["All of them; `const` only prevents reassigning `a`", "Only those declared `const` after the parameter list", "Only static member functions", "Only those that return `void`"],
          answer: 1,
          explanation: "Through a reference to `const`, the object is const, and only const member functions are callable; calling `a.deposit(5)` is rejected with \"discards qualifiers\". This is why every non-mutating member should be `const`.",
        },
        {
          prompt: "Which member is a correct use of `mutable`?",
          options: ["The `balance_` of an `Account`, so `deposit` can be `const`", "A `cachedMean_` that a const `mean()` recomputes lazily and callers cannot observe changing", "Every member, so that const objects can be modified freely", "A member that must be assigned in the constructor body"],
          answer: 1,
          explanation: "`mutable` exempts a member from the const promise and is right only when its changes are invisible through the interface — caches, counters, a mutex. Marking the logical value `mutable` makes the promise a lie.",
        },
        {
          prompt: "```cpp\nstruct Rect {\n    int area() const;\n};\nint Rect::area() { return w * h; }\n```\nWhat happens?",
          options: ["Compiles; `const` on the declaration is enough", "Compile error: no declaration matches `int Rect::area()` — the `const` is part of the signature", "Compiles, but `area` is no longer callable on const objects", "Linker error"],
          answer: 1,
          explanation: "The const qualifier belongs to the function's type, so the definition must repeat it. The compiler sees a definition for an `area()` that was never declared.",
        },
        {
          prompt: "```cpp\nclass Readings {\npublic:\n    double& at(std::size_t i);\n    const double& at(std::size_t i) const;\n};\nconst Readings& view = r;\nauto x = view.at(0);\n```\nWhich overload is called, and what is `x`?",
          options: ["The non-const one; `x` is `double&`", "The const one; `x` is a `double` copy of the element", "The const one; `x` is `const double&`", "Ambiguous: compile error"],
          answer: 1,
          explanation: "`view` is const, so only the const overload is viable. Plain `auto` drops the reference and the const, so `x` is an independent `double`.",
        },
        {
          prompt: "`bool isEmpty(const Stack& s)` can be written using only `s.size()`. Where should it live, and why?",
          options: ["As a member, because members are faster", "As a non-member non-friend function, because that increases encapsulation — one fewer function can touch the private data", "As a friend, so it can read the private size directly", "As a static member function"],
          answer: 1,
          explanation: "Anything expressible through the public interface gains nothing from private access and adds one more function that could break the invariant. Prefer non-member non-friend functions when the public interface suffices.",
        },
      ],
    },
    {
      slug: "static-members",
      file: "04-static-members.md",
      exercises: [
        {
          title: "Sessions, counted",
          prompt: `Complete \`class Session\`. Two \`inline static\` data members hold class-level state: \`alive_\` (how many sessions exist now) and \`nextId_\` (the next id to hand out, starting at 1). The constructor takes a user name, assigns \`id_ = nextId_++\` and increments \`alive_\`; the destructor decrements \`alive_\`. **Delete the copy constructor and copy assignment** — a copied session would carry a duplicate id and skip the count. Publish the counters through static member functions \`alive()\` and \`created()\` (ids handed out so far).

Sessions are kept in a \`std::vector<std::unique_ptr<Session>>\` (a non-copyable type cannot live in a vector by value). Commands: \`open <user>\` creates one and prints \`#<id> <user> opened (alive <n>)\`; \`close <id>\` destroys it and prints \`#<id> closed (alive <n>)\`, or \`no session #<id>\` when no open session has that id; \`report\` prints \`alive <a> created <c>\`. Every count is read *after* the change.

**Input:** \`n\`, then \`n\` commands.
**Output:** one line per command.

\`\`\`text
6
open ada
open bob
report
close 1
close 1
report
\`\`\`
→
\`\`\`text
#1 ada opened (alive 1)
#2 bob opened (alive 2)
alive 2 created 2
#1 closed (alive 1)
no session #1
alive 1 created 2
\`\`\``,
          starter: String.raw`#include <iostream>
#include <memory>
#include <string>
#include <vector>

class Session {
    std::string user_;
    int id_;
    // TODO: inline static counters alive_ and nextId_
public:
    explicit Session(std::string user) : user_(std::move(user)), id_(0) {
        // TODO: take the next id, count the session
    }
    ~Session() {
        // TODO: uncount
    }
    // TODO: delete copying
    int id() const { return id_; }
    const std::string& user() const { return user_; }
    static int alive() { return 0; }     // TODO
    static int created() { return 0; }   // TODO
};

int main() {
    int n;
    std::cin >> n;
    std::vector<std::unique_ptr<Session>> open;
    for (int i = 0; i < n; ++i) {
        std::string cmd;
        std::cin >> cmd;
        if (cmd == "open") {
            std::string user;
            std::cin >> user;
            open.push_back(std::make_unique<Session>(user));
            // TODO: print "#<id> <user> opened (alive <n>)"
        } else if (cmd == "close") {
            int id;
            std::cin >> id;
            // TODO: find it, erase it (the destructor runs), print the outcome
        } else {
            std::cout << "alive " << Session::alive() << " created " << Session::created() << '\n';
        }
    }
    return 0;
}
`,
          solution: String.raw`#include <iostream>
#include <memory>
#include <string>
#include <vector>

class Session {
    std::string user_;
    int id_;
    inline static int alive_ = 0;
    inline static int nextId_ = 1;
public:
    explicit Session(std::string user) : user_(std::move(user)), id_(nextId_++) {
        ++alive_;
    }
    ~Session() {
        --alive_;
    }
    Session(const Session&) = delete;
    Session& operator=(const Session&) = delete;
    int id() const { return id_; }
    const std::string& user() const { return user_; }
    static int alive() { return alive_; }
    static int created() { return nextId_ - 1; }
};

int main() {
    int n;
    std::cin >> n;
    std::vector<std::unique_ptr<Session>> open;
    for (int i = 0; i < n; ++i) {
        std::string cmd;
        std::cin >> cmd;
        if (cmd == "open") {
            std::string user;
            std::cin >> user;
            open.push_back(std::make_unique<Session>(user));
            const Session& s = *open.back();
            std::cout << '#' << s.id() << ' ' << s.user() << " opened (alive " << Session::alive() << ")\n";
        } else if (cmd == "close") {
            int id;
            std::cin >> id;
            bool found = false;
            for (auto it = open.begin(); it != open.end(); ++it) {
                if ((*it)->id() == id) {
                    open.erase(it);
                    found = true;
                    break;
                }
            }
            if (found) {
                std::cout << '#' << id << " closed (alive " << Session::alive() << ")\n";
            } else {
                std::cout << "no session #" << id << '\n';
            }
        } else {
            std::cout << "alive " << Session::alive() << " created " << Session::created() << '\n';
        }
    }
    return 0;
}
`,
          hints: [
            "inline static int alive_ = 0; inside the class is both the declaration and the one definition; there is one alive_ for every Session.",
            "id_(nextId_++) in the initialiser list hands out 1, 2, 3, ... and created() is simply nextId_ - 1.",
            "Erasing the unique_ptr from the vector destroys the Session, so alive() is already one lower when you print the closed line.",
          ],
          cases: [
            { stdin: "6\nopen ada\nopen bob\nreport\nclose 1\nclose 1\nreport\n", expected: "#1 ada opened (alive 1)\n#2 bob opened (alive 2)\nalive 2 created 2\n#1 closed (alive 1)\nno session #1\nalive 1 created 2\n" },
            { stdin: "2\nreport\nclose 5\n", expected: "alive 0 created 0\nno session #5\n" },
            { stdin: "5\nopen a\nclose 1\nopen b\nopen c\nreport\n", expected: "#1 a opened (alive 1)\n#1 closed (alive 0)\n#2 b opened (alive 1)\n#3 c opened (alive 2)\nalive 2 created 3\n", hidden: true },
            { stdin: "4\nopen x\nopen y\nclose 2\nreport\n", expected: "#1 x opened (alive 1)\n#2 y opened (alive 2)\n#2 closed (alive 1)\nalive 1 created 2\n", hidden: true },
          ],
        },
        {
          title: "Temperatures by named constructor",
          prompt: `\`class Temperature\` stores kelvin in a \`double\` behind a **private** constructor, so the only ways in are three static factories: \`fromKelvin(double)\` (throws \`std::invalid_argument\` below 0 K), \`fromCelsius(double)\` and \`fromFahrenheit(double)\`, each converting and delegating to \`fromKelvin\` so the check lives once. Keep the constant \`static constexpr double kAbsoluteZeroC = -273.15;\` in the class and use it for both conversions. Readers \`kelvin()\`, \`celsius()\` and \`fahrenheit()\` are \`const\`. A private \`inline static int created_\` counts how many temperatures the constructor built, published by \`static int created()\`.

Read \`n\` lines \`<unit> <value>\` with unit \`C\`, \`F\` or \`K\`. Print \`<c> C | <f> F | <k> K\` with two decimals, or \`invalid\` when the factory threw. Then \`lowest <c> C\` for the lowest valid temperature (\`lowest none\` if there was none) and \`created <count>\`.

**Input:** \`n\`, then \`n\` lines.
**Output:** \`n + 2\` lines.

\`\`\`text
3
C 25
F 98.6
K 0
\`\`\`
→
\`\`\`text
25.00 C | 77.00 F | 298.15 K
37.00 C | 98.60 F | 310.15 K
-273.15 C | -459.67 F | 0.00 K
lowest -273.15 C
created 3
\`\`\``,
          starter: String.raw`#include <iomanip>
#include <iostream>
#include <stdexcept>
#include <string>

class Temperature {
    double kelvin_;
    // TODO: inline static int created_
    explicit Temperature(double k) : kelvin_(k) {}   // private: only the factories reach it
public:
    static constexpr double kAbsoluteZeroC = -273.15;
    // TODO: static Temperature fromKelvin(double k) — throws below 0
    // TODO: static Temperature fromCelsius(double c) and fromFahrenheit(double f)
    double kelvin() const { return kelvin_; }
    double celsius() const { return kelvin_ + kAbsoluteZeroC; }
    double fahrenheit() const { return celsius() * 9.0 / 5.0 + 32.0; }
    static int created() { return 0; }   // TODO
};

int main() {
    std::cout << std::fixed << std::setprecision(2);
    int n;
    std::cin >> n;
    bool any = false;
    double lowest = 0;
    for (int i = 0; i < n; ++i) {
        char unit;
        double value;
        std::cin >> unit >> value;
        // TODO: build through the right factory; print the line or "invalid"; track the lowest
    }
    if (any) std::cout << "lowest " << lowest << " C\n"; else std::cout << "lowest none\n";
    std::cout << "created " << Temperature::created() << '\n';
    return 0;
}
`,
          solution: String.raw`#include <iomanip>
#include <iostream>
#include <stdexcept>
#include <string>

class Temperature {
    double kelvin_;
    inline static int created_ = 0;
    explicit Temperature(double k) : kelvin_(k) { ++created_; }
public:
    static constexpr double kAbsoluteZeroC = -273.15;
    static Temperature fromKelvin(double k) {
        if (k < 0) throw std::invalid_argument("below absolute zero");
        return Temperature(k);
    }
    static Temperature fromCelsius(double c) { return fromKelvin(c - kAbsoluteZeroC); }
    static Temperature fromFahrenheit(double f) { return fromCelsius((f - 32.0) * 5.0 / 9.0); }
    double kelvin() const { return kelvin_; }
    double celsius() const { return kelvin_ + kAbsoluteZeroC; }
    double fahrenheit() const { return celsius() * 9.0 / 5.0 + 32.0; }
    static int created() { return created_; }
};

Temperature build(char unit, double value) {
    if (unit == 'C') return Temperature::fromCelsius(value);
    if (unit == 'F') return Temperature::fromFahrenheit(value);
    return Temperature::fromKelvin(value);
}

int main() {
    std::cout << std::fixed << std::setprecision(2);
    int n;
    std::cin >> n;
    bool any = false;
    double lowest = 0;
    for (int i = 0; i < n; ++i) {
        char unit;
        double value;
        std::cin >> unit >> value;
        try {
            Temperature t = build(unit, value);
            std::cout << t.celsius() << " C | " << t.fahrenheit() << " F | " << t.kelvin() << " K\n";
            if (!any || t.celsius() < lowest) lowest = t.celsius();
            any = true;
        } catch (const std::invalid_argument&) {
            std::cout << "invalid\n";
        }
    }
    if (any) std::cout << "lowest " << lowest << " C\n"; else std::cout << "lowest none\n";
    std::cout << "created " << Temperature::created() << '\n';
    return 0;
}
`,
          hints: [
            "A static member function can call the private constructor because it is inside the class; main cannot, which is the point.",
            "Celsius to kelvin is c - kAbsoluteZeroC (subtracting a negative); fahrenheit to celsius is (f - 32) * 5 / 9 — delegate rather than repeating the check.",
            "Count in the private constructor; a factory that throws never reaches it, so invalid inputs are not counted.",
          ],
          cases: [
            { stdin: "3\nC 25\nF 98.6\nK 0\n", expected: "25.00 C | 77.00 F | 298.15 K\n37.00 C | 98.60 F | 310.15 K\n-273.15 C | -459.67 F | 0.00 K\nlowest -273.15 C\ncreated 3\n" },
            { stdin: "2\nC -300\nC 100\n", expected: "invalid\n100.00 C | 212.00 F | 373.15 K\nlowest 100.00 C\ncreated 1\n" },
            { stdin: "1\nK -1\n", expected: "invalid\nlowest none\ncreated 0\n", hidden: true },
            { stdin: "3\nF 32\nF -40\nK 300\n", expected: "0.00 C | 32.00 F | 273.15 K\n-40.00 C | -40.00 F | 233.15 K\n26.85 C | 80.33 F | 300.00 K\nlowest -40.00 C\ncreated 3\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "What does `inline static int alive_ = 0;` inside a class body mean?",
          options: ["Each object gets its own `alive_`, initialised to 0", "One `alive_` for the whole class, and this line is its definition — no out-of-class `int T::alive_ = 0;` needed", "A constant that cannot change", "A local variable of every member function"],
          answer: 1,
          explanation: "A static data member has one instance per class. Since C++17 `inline` lets the in-class declaration serve as the single definition, which is what makes it header-safe; before that the definition had to appear in exactly one source file.",
        },
        {
          prompt: "A class increments a static `count_` in its constructor and decrements it in the destructor, but declares no copy operations. After `Session b = a;` and the destruction of both, what is `count_`?",
          options: ["0", "-1 — the generated copy constructor did not increment, but both destructors decremented", "1", "2"],
          answer: 1,
          explanation: "The compiler-generated copy constructor copies members and runs none of your constructor's body. Either count in a hand-written copy constructor or delete copying for a class whose identity should not be duplicated.",
        },
        {
          prompt: "```cpp\nclass Session {\n    int id_;\npublic:\n    static int id() { return id_; }\n};\n```\nWhy does this fail to compile?",
          options: ["`id_` is private", "A static member function has no `this`, so it cannot read a non-static member", "Static functions cannot return `int`", "`id_` is uninitialised"],
          answer: 1,
          explanation: "A static member function is called on the class, not on an object; there is no object whose `id_` it could mean. It may read static members only.",
        },
        {
          prompt: "Why do `Angle::fromDegrees(double)` and `Angle::fromRadians(double)` exist as static functions with the constructor private?",
          options: ["Constructors cannot take `double`", "Two constructors taking one `double` cannot be told apart, and a static factory gives each way of building an `Angle` a name", "Static functions are faster than constructors", "To make the class a singleton"],
          answer: 1,
          explanation: "A constructor is only ever called by the class's name, so two meanings for one `double` need named entry points. The private constructor makes the factories the only way in, so every `Angle` went through one of them.",
        },
        {
          prompt: "Which is the preferred way to give a class a compile-time constant `kMaxSide` of 1024?",
          options: ["`#define kMaxSide 1024` above the class", "`static constexpr int kMaxSide = 1024;` inside the class", "`const int kMaxSide = 1024;` as a non-static member", "`enum { kMaxSide = 1024 };` inside the class"],
          answer: 1,
          explanation: "A `static constexpr` member is typed, scoped to the class (`Grid::kMaxSide`), usable in constant expressions and implicitly `inline`. The macro has no scope or type, a non-static `const` member costs space in every object, and the enum trick predates `constexpr`.",
        },
        {
          prompt: "```cpp\nstatic Logger& instance() {\n    static Logger only;\n    return only;\n}\n```\nWhat does the function-local static buy over a global `Logger g_logger;`?",
          options: ["Nothing; both are constructed before `main`", "Lazy, thread-safe construction on first use, and immunity to the static initialisation order fiasco across translation units", "A new `Logger` on every call", "Automatic destruction when the last caller returns"],
          answer: 1,
          explanation: "A function-local static is initialised on first call, once, with the initialisation guaranteed thread-safe since C++11, so no other translation unit's global can observe it before it exists. It remains a hidden global dependency — the design problem is not solved by the mechanism.",
        },
        {
          prompt: "```cpp\nSession a(\"x\");\n{\n    Session b(\"y\");\n    std::cout << Session::alive();\n}\nstd::cout << Session::alive();\n```\nWith a correct counter, what is printed?",
          options: ["`22`", "`21`", "`11`", "`12`"],
          answer: 1,
          explanation: "Inside the block two sessions exist, so `2`; `b` is destroyed at the closing brace and its destructor decrements the counter, so the second print shows `1`.",
        },
      ],
    },
    {
      slug: "encapsulation-and-friends",
      file: "05-encapsulation-and-friends.md",
      exercises: [
        {
          title: "Money that prints itself",
          prompt: `\`class Money\` keeps \`long long cents_\` private with the invariant \`cents_ >= 0\`, established by \`explicit Money(long long cents)\` (throws \`std::invalid_argument\` on a negative). Add \`static Money parse(const std::string&)\`, which accepts exactly \`<digits>.<two digits>\` (\`0.25\`, \`15.00\`) and throws \`std::invalid_argument\` for anything else — no sign, no missing dot, not one or three decimals. Add the const operations \`add(const Money&)\` and \`times(int)\`, each returning a new \`Money\`. Then write \`operator<<\` as a **friend free function** defined inside the class body — it must be a free function because the stream is the left operand — printing \`<units>.<two digits>\`.

Read \`n\` receipt lines \`name quantity price\`. For each, print \`<name>: <quantity> x <price> -> <line total>\` using \`operator<<\` for both amounts, or \`<name>: invalid price\` when \`parse\` threw (the line is skipped). Finish with \`total <sum of line totals>\`.

**Input:** \`n\`, then \`n\` lines.
**Output:** \`n + 1\` lines.

\`\`\`text
3
bolt 10 0.25
gear 2 15.00
widget 3 abc
\`\`\`
→
\`\`\`text
bolt: 10 x 0.25 -> 2.50
gear: 2 x 15.00 -> 30.00
widget: invalid price
total 32.50
\`\`\``,
          starter: String.raw`#include <cctype>
#include <iostream>
#include <stdexcept>
#include <string>

class Money {
    long long cents_;   // invariant: cents_ >= 0
public:
    explicit Money(long long cents) : cents_(cents) {
        if (cents < 0) throw std::invalid_argument("negative amount");
    }
    static Money parse(const std::string& text);
    Money add(const Money& other) const { return Money(cents_ + other.cents_); }
    Money times(int n) const { return Money(cents_ * n); }
    // TODO: friend std::ostream& operator<<(std::ostream& os, const Money& m)
};

Money Money::parse(const std::string& text) {
    // TODO: exactly <digits>.<two digits>, else throw std::invalid_argument
    return Money(std::stoll(text));
}

int main() {
    int n;
    std::cin >> n;
    Money total(0);
    for (int i = 0; i < n; ++i) {
        std::string name, price;
        int qty;
        std::cin >> name >> qty >> price;
        // TODO: parse, print the line (or "invalid price"), accumulate
    }
    // TODO: print the total through operator<<
    return 0;
}
`,
          solution: String.raw`#include <cctype>
#include <iostream>
#include <stdexcept>
#include <string>

class Money {
    long long cents_;   // invariant: cents_ >= 0
public:
    explicit Money(long long cents) : cents_(cents) {
        if (cents < 0) throw std::invalid_argument("negative amount");
    }
    static Money parse(const std::string& text);
    Money add(const Money& other) const { return Money(cents_ + other.cents_); }
    Money times(int n) const { return Money(cents_ * n); }
    friend std::ostream& operator<<(std::ostream& os, const Money& m) {
        long long tail = m.cents_ % 100;
        return os << m.cents_ / 100 << '.' << (tail < 10 ? "0" : "") << tail;
    }
};

Money Money::parse(const std::string& text) {
    std::size_t dot = text.find('.');
    if (dot == std::string::npos || dot == 0 || text.size() - dot - 1 != 2) {
        throw std::invalid_argument("bad price");
    }
    for (std::size_t i = 0; i < text.size(); ++i) {
        if (i == dot) continue;
        if (!std::isdigit(static_cast<unsigned char>(text[i]))) throw std::invalid_argument("bad price");
    }
    long long units = std::stoll(text.substr(0, dot));
    int hundredths = std::stoi(text.substr(dot + 1));
    return Money(units * 100 + hundredths);
}

int main() {
    int n;
    std::cin >> n;
    Money total(0);
    for (int i = 0; i < n; ++i) {
        std::string name, price;
        int qty;
        std::cin >> name >> qty >> price;
        try {
            Money unit = Money::parse(price);
            Money line = unit.times(qty);
            std::cout << name << ": " << qty << " x " << unit << " -> " << line << '\n';
            total = total.add(line);
        } catch (const std::invalid_argument&) {
            std::cout << name << ": invalid price\n";
        }
    }
    std::cout << "total " << total << '\n';
    return 0;
}
`,
          hints: [
            "A friend defined inside the class body is still a free function: no Money:: prefix, and the Money argument is what lets the compiler find it.",
            "Validate the shape first — one dot, at least one digit before it, exactly two after, digits everywhere else — and only then call std::stoll on the two halves.",
            "Return the stream from operator<< so that << 'newline' can follow it in the same expression.",
          ],
          cases: [
            { stdin: "3\nbolt 10 0.25\ngear 2 15.00\nwidget 3 abc\n", expected: "bolt: 10 x 0.25 -> 2.50\ngear: 2 x 15.00 -> 30.00\nwidget: invalid price\ntotal 32.50\n" },
            { stdin: "2\npen 1 1.5\ncap 4 0.05\n", expected: "pen: invalid price\ncap: 4 x 0.05 -> 0.20\ntotal 0.20\n" },
            { stdin: "1\nx 0 9.99\n", expected: "x: 0 x 9.99 -> 0.00\ntotal 0.00\n", hidden: true },
            { stdin: "2\na 1 -1.00\nb 100000 100.00\n", expected: "a: invalid price\nb: 100000 x 100.00 -> 10000000.00\ntotal 10000000.00\n", hidden: true },
          ],
        },
        {
          title: "Account and Auditor",
          prompt: `\`class Account\` holds a name, a balance with the invariant \`balance_ >= 0\`, and a private \`int rejected_\` counting refused withdrawals — **no public function exposes it**. The public interface is \`deposit(amount)\` (refused, and nothing changes, when \`amount <= 0\`), \`bool withdraw(amount)\` (refused and counted when \`amount <= 0\` or above the balance), \`balance()\` and \`name()\`. Two friends complete it: the free function \`bool transfer(Account& from, Account& to, long long amount)\`, declared \`friend\` inside the class, which moves the amount or refuses (counted against \`from\`) when \`amount <= 0\`, \`from\` cannot cover it, or the two are the same object; and \`friend class Auditor\`, whose \`static void report(const Account&)\` prints \`<name>: balance <b> rejected <r>\` — the only code outside the class that can see \`rejected_\`.

The first line names two accounts with opening balances. Then \`n\` commands: \`deposit <name> <amount>\`, \`withdraw <name> <amount>\`, \`transfer <from> <to> <amount>\`; print \`ok\` or \`refused\` for each. Finally audit both accounts in the order they were given.

**Input:** \`nameA openingA nameB openingB\`, then \`n\`, then \`n\` commands.
**Output:** \`n\` result lines, then two audit lines.

\`\`\`text
ada 100 bob 20
5
withdraw ada 30
withdraw bob 50
transfer ada bob 70
transfer bob ada 500
deposit bob 5
\`\`\`
→
\`\`\`text
ok
refused
ok
refused
ok
ada: balance 0 rejected 0
bob: balance 95 rejected 2
\`\`\``,
          starter: String.raw`#include <iostream>
#include <string>

class Account {
    std::string name_;
    long long balance_;   // invariant: balance_ >= 0
    int rejected_ = 0;    // refused withdrawals and transfers out; not exposed
public:
    Account(std::string name, long long opening) : name_(std::move(name)), balance_(opening) {}
    bool deposit(long long amount) {
        if (amount <= 0) return false;
        balance_ += amount;
        return true;
    }
    bool withdraw(long long amount) {
        // TODO: refuse and count when amount <= 0 or amount > balance_
        balance_ -= amount;
        return true;
    }
    long long balance() const { return balance_; }
    const std::string& name() const { return name_; }
    // TODO: friend bool transfer(Account& from, Account& to, long long amount);
    // TODO: friend class Auditor;
};

bool transfer(Account& from, Account& to, long long amount) {
    // TODO: refuse (counted against from) when amount <= 0, insufficient, or &from == &to
    (void)from; (void)to; (void)amount;
    return false;
}

class Auditor {
public:
    static void report(const Account& a) {
        // TODO: "<name>: balance <b> rejected <r>"
        std::cout << a.name() << '\n';
    }
};

Account& pick(const std::string& name, Account& a, Account& b) {
    return name == a.name() ? a : b;
}

int main() {
    std::string nameA, nameB;
    long long openA, openB;
    std::cin >> nameA >> openA >> nameB >> openB;
    Account a(nameA, openA), b(nameB, openB);
    int n;
    std::cin >> n;
    for (int i = 0; i < n; ++i) {
        std::string cmd;
        std::cin >> cmd;
        bool ok = false;
        if (cmd == "transfer") {
            std::string from, to;
            long long amount;
            std::cin >> from >> to >> amount;
            ok = transfer(pick(from, a, b), pick(to, a, b), amount);
        } else {
            std::string who;
            long long amount;
            std::cin >> who >> amount;
            Account& acc = pick(who, a, b);
            ok = cmd == "deposit" ? acc.deposit(amount) : acc.withdraw(amount);
        }
        std::cout << (ok ? "ok" : "refused") << '\n';
    }
    Auditor::report(a);
    Auditor::report(b);
    return 0;
}
`,
          solution: String.raw`#include <iostream>
#include <string>

class Account {
    std::string name_;
    long long balance_;   // invariant: balance_ >= 0
    int rejected_ = 0;    // refused withdrawals and transfers out; not exposed
public:
    Account(std::string name, long long opening) : name_(std::move(name)), balance_(opening) {}
    bool deposit(long long amount) {
        if (amount <= 0) return false;
        balance_ += amount;
        return true;
    }
    bool withdraw(long long amount) {
        if (amount <= 0 || amount > balance_) {
            ++rejected_;
            return false;
        }
        balance_ -= amount;
        return true;
    }
    long long balance() const { return balance_; }
    const std::string& name() const { return name_; }
    friend bool transfer(Account& from, Account& to, long long amount);
    friend class Auditor;
};

bool transfer(Account& from, Account& to, long long amount) {
    if (amount <= 0 || from.balance_ < amount || &from == &to) {
        ++from.rejected_;
        return false;
    }
    from.balance_ -= amount;
    to.balance_ += amount;
    return true;
}

class Auditor {
public:
    static void report(const Account& a) {
        std::cout << a.name_ << ": balance " << a.balance_ << " rejected " << a.rejected_ << '\n';
    }
};

Account& pick(const std::string& name, Account& a, Account& b) {
    return name == a.name() ? a : b;
}

int main() {
    std::string nameA, nameB;
    long long openA, openB;
    std::cin >> nameA >> openA >> nameB >> openB;
    Account a(nameA, openA), b(nameB, openB);
    int n;
    std::cin >> n;
    for (int i = 0; i < n; ++i) {
        std::string cmd;
        std::cin >> cmd;
        bool ok = false;
        if (cmd == "transfer") {
            std::string from, to;
            long long amount;
            std::cin >> from >> to >> amount;
            ok = transfer(pick(from, a, b), pick(to, a, b), amount);
        } else {
            std::string who;
            long long amount;
            std::cin >> who >> amount;
            Account& acc = pick(who, a, b);
            ok = cmd == "deposit" ? acc.deposit(amount) : acc.withdraw(amount);
        }
        std::cout << (ok ? "ok" : "refused") << '\n';
    }
    Auditor::report(a);
    Auditor::report(b);
    return 0;
}
`,
          hints: [
            "The friend declaration inside the class is not a member: transfer is defined outside without Account:: and reads from.balance_ directly.",
            "Compare identities with &from == &to; a self-transfer would otherwise subtract and add the same amount and look fine.",
            "friend class Auditor grants every member function of Auditor access, which is how report reads rejected_ without an accessor.",
          ],
          cases: [
            { stdin: "ada 100 bob 20\n5\nwithdraw ada 30\nwithdraw bob 50\ntransfer ada bob 70\ntransfer bob ada 500\ndeposit bob 5\n", expected: "ok\nrefused\nok\nrefused\nok\nada: balance 0 rejected 0\nbob: balance 95 rejected 2\n" },
            { stdin: "x 0 y 0\n2\nwithdraw x 1\ntransfer y y 0\n", expected: "refused\nrefused\nx: balance 0 rejected 1\ny: balance 0 rejected 1\n" },
            { stdin: "a 10 b 10\n3\ndeposit a 0\ntransfer a b 10\nwithdraw b 20\n", expected: "refused\nok\nok\na: balance 0 rejected 0\nb: balance 0 rejected 0\n", hidden: true },
            { stdin: "p 5 q 5\n4\nwithdraw p 5\nwithdraw p 1\nwithdraw q -3\ntransfer q p 5\n", expected: "ok\nrefused\nrefused\nok\np: balance 5 rejected 1\nq: balance 0 rejected 1\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "What is a class invariant, and who is responsible for it?",
          options: ["A `const` member; the compiler enforces it", "A statement about the members that is true between operations; the constructor establishes it, mutators preserve it, readers may assume it", "A rule that members must be initialised in declaration order", "A comment the compiler checks with `static_assert`"],
          answer: 1,
          explanation: "The invariant is the contract that makes private data worth it: one check in the constructor covers the program, because no public operation may leave the object in a state that violates it.",
        },
        {
          prompt: "Which accessor breaks encapsulation?",
          options: ["`long long balance() const`", "`const std::vector<int>& items() const`", "`std::vector<int>& items()` returning a non-const reference to a private member", "`bool withdraw(long long amount)`"],
          answer: 2,
          explanation: "A non-const reference to private state lets any caller edit it without going through the class, so the invariant can be broken from outside. The const reference only allows reading; the others are operations.",
        },
        {
          prompt: "`Auditor` is a friend of `Account`, and `Inspector` is a friend of `Auditor`. What can `Inspector` access in `Account`?",
          options: ["Everything, because friendship is transitive", "Only the public members of `Account` — friendship is neither transitive nor inherited", "Only the private members that `Auditor` uses", "Everything, because friendship is mutual"],
          answer: 1,
          explanation: "Friendship is granted by a class to specific functions or classes and stops there: a friend of a friend gets nothing, a derived class of a friend gets nothing, and `Account` gains no access to `Auditor`.",
        },
        {
          prompt: "Why can `std::ostream& operator<<(std::ostream&, const Money&)` not be a member function of `Money`?",
          options: ["Members cannot return references", "A member operator's left operand is the object it is called on, and the left operand of `<<` here is the stream, not the `Money`", "Streams cannot be passed to members", "It can, but only if declared `static`"],
          answer: 1,
          explanation: "A member `Money::operator<<` would be invoked as `money << stream`. To write `std::cout << m` the function must be free, and `friend` gives it the private access it usually needs.",
        },
        {
          prompt: "```cpp\nclass Account {\n    long long balance_;\npublic:\n    friend bool transfer(Account& from, Account& to, long long amount);\n};\n```\nWhat is `transfer`?",
          options: ["A member function called as `from.transfer(to, amount)`", "A static member function", "A free function with access to `balance_`, called as `transfer(a, b, amount)` and defined without `Account::`", "A pure virtual function"],
          answer: 2,
          explanation: "The `friend` line is a declaration of an ordinary non-member function plus a grant of access. It has no `this`, and its definition carries no class qualifier.",
        },
        {
          prompt: "A class makes every member private and adds a `getX()`/`setX()` pair for each one. What has been gained?",
          options: ["Full encapsulation", "Nothing: every member can still be set to anything, so no invariant is enforced — it is a struct with extra steps", "Thread safety", "The compiler-generated copy is now safe"],
          answer: 1,
          explanation: "Accessors earn their place by validating, deriving or protecting the representation. A setter for every member gives the invariant a second entrance and the readers no guarantee.",
        },
        {
          prompt: "Which operation belongs as a `friend` rather than a member or a plain free function?",
          options: ["`bool isEmpty() const` when `size()` is public", "`bool transfer(Account&, Account&, long long)` — it needs private access to two objects symmetrically", "`void deposit(long long)`", "`std::string name() const`"],
          answer: 1,
          explanation: "A member would be lopsided (`from.transferTo(to, n)`) and a non-friend cannot reach `balance_`; a friend free function is symmetric and has the access. `isEmpty` needs no private access; the others modify or read one object.",
        },
      ],
    },
    {
      slug: "designing-a-class",
      file: "06-designing-a-class.md",
      exercises: [
        {
          title: "Date, dayOfYear and nextDay",
          prompt: `The lesson's \`Date\` is given with its header half (the class definition) and source half (the bodies) marked by comments, as the judge compiles one file. Complete it with two derived operations that earn their place on a value type: \`int dayOfYear() const\` (1 for 1 January, 366 for 31 December of a leap year) and \`Date nextDay() const\`, which returns a **new** \`Date\` — there is no setter — rolling over month and year ends, built through the constructor so the invariant is re-established rather than assumed. \`iso()\` formats with \`std::format("{:04}-{:02}-{:02}", ...)\`.

Read \`n\` lines \`year month day\`. For each, print \`<iso> day <dayOfYear> next <iso of nextDay>\`, or \`<year>-<month>-<day> invalid\` (the raw numbers, unpadded) when the constructor threw \`std::invalid_argument\`.

**Input:** \`n\`, then \`n\` lines.
**Output:** \`n\` lines.

\`\`\`text
3
2024 2 28
2024 12 31
2023 2 29
\`\`\`
→
\`\`\`text
2024-02-28 day 59 next 2024-02-29
2024-12-31 day 366 next 2025-01-01
2023-2-29 invalid
\`\`\``,
          starter: String.raw`#include <format>
#include <iostream>
#include <stdexcept>
#include <string>

// ---- date.h: what every user needs in order to compile a call ----
class Date {
public:
    Date(int year, int month, int day);            // throws std::invalid_argument
    int year() const { return y_; }
    int month() const { return m_; }
    int day() const { return d_; }
    bool isLeapYear() const;
    int dayOfYear() const;
    Date nextDay() const;
    std::string iso() const;
    static int daysInMonth(int year, int month);
private:
    int y_;
    int m_;
    int d_;     // invariant: 1 <= m_ <= 12 and 1 <= d_ <= daysInMonth(y_, m_)
};

// ---- date.cpp: the bodies ----
Date::Date(int year, int month, int day) : y_(year), m_(month), d_(day) {
    if (month < 1 || month > 12 || day < 1 || day > daysInMonth(year, month))
        throw std::invalid_argument("not a calendar date");
}

bool Date::isLeapYear() const { return (y_ % 4 == 0 && y_ % 100 != 0) || y_ % 400 == 0; }

int Date::daysInMonth(int year, int month) {
    static const int days[] = {31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31};
    bool leap = (year % 4 == 0 && year % 100 != 0) || year % 400 == 0;
    return month == 2 && leap ? 29 : days[month - 1];
}

int Date::dayOfYear() const {
    return 0;   // TODO: the day plus the lengths of the months before it
}

Date Date::nextDay() const {
    return *this;   // TODO: a new Date, rolling over the month and the year
}

std::string Date::iso() const { return std::format("{:04}-{:02}-{:02}", y_, m_, d_); }

// ---- main.cpp ----
int main() {
    int n;
    std::cin >> n;
    for (int i = 0; i < n; ++i) {
        int y, m, d;
        std::cin >> y >> m >> d;
        // TODO: construct, print the line, or "<y>-<m>-<d> invalid"
    }
    return 0;
}
`,
          solution: String.raw`#include <format>
#include <iostream>
#include <stdexcept>
#include <string>

// ---- date.h: what every user needs in order to compile a call ----
class Date {
public:
    Date(int year, int month, int day);            // throws std::invalid_argument
    int year() const { return y_; }
    int month() const { return m_; }
    int day() const { return d_; }
    bool isLeapYear() const;
    int dayOfYear() const;
    Date nextDay() const;
    std::string iso() const;
    static int daysInMonth(int year, int month);
private:
    int y_;
    int m_;
    int d_;     // invariant: 1 <= m_ <= 12 and 1 <= d_ <= daysInMonth(y_, m_)
};

// ---- date.cpp: the bodies ----
Date::Date(int year, int month, int day) : y_(year), m_(month), d_(day) {
    if (month < 1 || month > 12 || day < 1 || day > daysInMonth(year, month))
        throw std::invalid_argument("not a calendar date");
}

bool Date::isLeapYear() const { return (y_ % 4 == 0 && y_ % 100 != 0) || y_ % 400 == 0; }

int Date::daysInMonth(int year, int month) {
    static const int days[] = {31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31};
    bool leap = (year % 4 == 0 && year % 100 != 0) || year % 400 == 0;
    return month == 2 && leap ? 29 : days[month - 1];
}

int Date::dayOfYear() const {
    int n = d_;
    for (int m = 1; m < m_; ++m) n += daysInMonth(y_, m);
    return n;
}

Date Date::nextDay() const {
    if (d_ < daysInMonth(y_, m_)) return Date(y_, m_, d_ + 1);
    if (m_ < 12) return Date(y_, m_ + 1, 1);
    return Date(y_ + 1, 1, 1);
}

std::string Date::iso() const { return std::format("{:04}-{:02}-{:02}", y_, m_, d_); }

// ---- main.cpp ----
int main() {
    int n;
    std::cin >> n;
    for (int i = 0; i < n; ++i) {
        int y, m, d;
        std::cin >> y >> m >> d;
        try {
            Date date(y, m, d);
            std::cout << date.iso() << " day " << date.dayOfYear() << " next " << date.nextDay().iso() << '\n';
        } catch (const std::invalid_argument&) {
            std::cout << y << '-' << m << '-' << d << " invalid\n";
        }
    }
    return 0;
}
`,
          hints: [
            "dayOfYear is the day plus daysInMonth(y_, m) for every month m before m_ — the static helper takes the year so February is right.",
            "nextDay has three cases: not the last day of the month, last day of a month before December, and 31 December.",
            "Build the new Date with the constructor rather than copying *this and editing a member; the constructor re-checks the invariant for free.",
          ],
          cases: [
            { stdin: "3\n2024 2 28\n2024 12 31\n2023 2 29\n", expected: "2024-02-28 day 59 next 2024-02-29\n2024-12-31 day 366 next 2025-01-01\n2023-2-29 invalid\n" },
            { stdin: "2\n2000 2 29\n1900 2 29\n", expected: "2000-02-29 day 60 next 2000-03-01\n1900-2-29 invalid\n" },
            { stdin: "3\n2023 1 1\n2023 12 31\n2023 13 1\n", expected: "2023-01-01 day 1 next 2023-01-02\n2023-12-31 day 365 next 2024-01-01\n2023-13-1 invalid\n", hidden: true },
            { stdin: "2\n2021 4 30\n2021 4 31\n", expected: "2021-04-30 day 120 next 2021-05-01\n2021-4-31 invalid\n", hidden: true },
          ],
        },
        {
          title: "Fraction from a blank file",
          prompt: `Run the eight-question checklist on a \`Fraction\` and write it from the (nearly) blank starter. **Representation:** \`long long num_\` and \`long long den_\`. **Invariant:** \`den_ > 0\` and \`gcd(|num_|, den_) == 1\` (zero is stored as \`0/1\`), written as a comment beside the members. **Constructor:** \`explicit Fraction(long long num, long long den)\` throws \`std::invalid_argument\` when \`den == 0\`, moves the sign to the numerator and divides both by \`std::gcd\`; \`explicit Fraction(long long whole)\` delegates with denominator 1. **Interface**, all \`const\` and all returning a new \`Fraction\`: \`add\`, \`subtract\`, \`times\`, \`dividedBy\` (throws \`std::domain_error\` when the divisor is zero); readers \`numerator()\` and \`denominator()\`; a **friend** \`operator<<\` printing \`<num>/<den>\`, or just \`<num>\` when the denominator is 1. No setters: the compiler-generated copy is correct (rule of zero).

Read \`n\` lines \`<lhs> <op> <rhs>\`, where an operand is \`a/b\` or a whole number and \`op\` is \`+\`, \`-\`, \`*\` or \`/\`. Print the normalised result, \`invalid\` when an operand had a zero denominator, or \`undefined\` for division by a zero fraction.

**Input:** \`n\`, then \`n\` lines.
**Output:** \`n\` lines.

\`\`\`text
4
1/2 + 1/3
2/4 * 3/5
5 - 7/2
1/2 / 0/1
\`\`\`
→
\`\`\`text
5/6
3/10
3/2
undefined
\`\`\``,
          starter: String.raw`#include <iostream>
#include <numeric>
#include <stdexcept>
#include <string>

// TODO: class Fraction
//   representation: long long num_, den_
//   invariant: den_ > 0 and gcd(|num_|, den_) == 1
//   explicit Fraction(long long num, long long den) — throws on den == 0, normalises
//   explicit Fraction(long long whole) — delegates
//   const: add, subtract, times, dividedBy (domain_error on a zero divisor), numerator(), denominator()
//   friend std::ostream& operator<<

// TODO: Fraction parse(const std::string& token) — "a/b" or a whole number

int main() {
    int n;
    std::cin >> n;
    for (int i = 0; i < n; ++i) {
        std::string lhs, op, rhs;
        std::cin >> lhs >> op >> rhs;
        // TODO: parse both, apply op, print the result, "invalid" or "undefined"
        std::cout << lhs << ' ' << op << ' ' << rhs << '\n';
    }
    return 0;
}
`,
          solution: String.raw`#include <iostream>
#include <numeric>
#include <stdexcept>
#include <string>

class Fraction {
public:
    explicit Fraction(long long num, long long den) : num_(num), den_(den) {
        if (den == 0) throw std::invalid_argument("zero denominator");
        if (den_ < 0) {
            num_ = -num_;
            den_ = -den_;
        }
        long long g = std::gcd(num_ < 0 ? -num_ : num_, den_);
        num_ /= g;
        den_ /= g;
    }
    explicit Fraction(long long whole) : Fraction(whole, 1) {}

    long long numerator() const { return num_; }
    long long denominator() const { return den_; }

    Fraction add(const Fraction& o) const { return Fraction(num_ * o.den_ + o.num_ * den_, den_ * o.den_); }
    Fraction subtract(const Fraction& o) const { return Fraction(num_ * o.den_ - o.num_ * den_, den_ * o.den_); }
    Fraction times(const Fraction& o) const { return Fraction(num_ * o.num_, den_ * o.den_); }
    Fraction dividedBy(const Fraction& o) const {
        if (o.num_ == 0) throw std::domain_error("division by zero");
        return Fraction(num_ * o.den_, den_ * o.num_);
    }

    friend std::ostream& operator<<(std::ostream& os, const Fraction& f) {
        os << f.num_;
        if (f.den_ != 1) os << '/' << f.den_;
        return os;
    }

private:
    long long num_;
    long long den_;   // invariant: den_ > 0 and gcd(|num_|, den_) == 1
};

Fraction parse(const std::string& token) {
    std::size_t slash = token.find('/');
    if (slash == std::string::npos) return Fraction(std::stoll(token));
    return Fraction(std::stoll(token.substr(0, slash)), std::stoll(token.substr(slash + 1)));
}

int main() {
    int n;
    std::cin >> n;
    for (int i = 0; i < n; ++i) {
        std::string lhs, op, rhs;
        std::cin >> lhs >> op >> rhs;
        try {
            Fraction a = parse(lhs);
            Fraction b = parse(rhs);
            Fraction r = op == "+" ? a.add(b) : op == "-" ? a.subtract(b) : op == "*" ? a.times(b) : a.dividedBy(b);
            std::cout << r << '\n';
        } catch (const std::invalid_argument&) {
            std::cout << "invalid\n";
        } catch (const std::domain_error&) {
            std::cout << "undefined\n";
        }
    }
    return 0;
}
`,
          hints: [
            "Normalise in the constructor only — every operation returns Fraction(...) built from raw numerator and denominator, and inherits the normalisation.",
            "std::gcd wants non-negative arguments; pass the absolute numerator, and std::gcd(0, d) is d, which turns 0/d into 0/1.",
            "Catch std::invalid_argument and std::domain_error separately; the first is a bad operand, the second a bad division.",
          ],
          cases: [
            { stdin: "4\n1/2 + 1/3\n2/4 * 3/5\n5 - 7/2\n1/2 / 0/1\n", expected: "5/6\n3/10\n3/2\nundefined\n" },
            { stdin: "3\n-1/2 + 1/2\n3/-6 - 1/2\n1/0 + 1/2\n", expected: "0\n-1\ninvalid\n" },
            { stdin: "2\n6/8 / 3/4\n0/5 * 7/9\n", expected: "1\n0\n", hidden: true },
            { stdin: "3\n1/3 + 2/3\n-2/3 * -3/2\n10/4 - 1/4\n", expected: "1\n1\n9/4\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "Which of these belongs in `date.h` rather than `date.cpp`?",
          options: ["The body of `Date::iso()`", "The class definition, private members included", "Helper functions only the bodies use", "`#include <format>`, which only `iso()` needs"],
          answer: 1,
          explanation: "Users must see the whole class definition to create a `Date` — the compiler needs its size and layout — so it goes in the header. Bodies, private helpers and the includes only they need stay in the source file.",
        },
        {
          prompt: "A header defines `std::string Date::iso() const { ... }` outside the class body, without `inline`. Two source files include the header. What happens?",
          options: ["Nothing; headers may define functions", "Linker error: multiple definition of `Date::iso() const`", "Compile error in the second file", "Only the first definition is used"],
          answer: 1,
          explanation: "Each translation unit gets its own definition, and the one-definition rule allows only one per program unless the function is `inline`. Members defined inside the class body are implicitly inline; an out-of-class definition in a header must say `inline` or move to the `.cpp`.",
        },
        {
          prompt: "`main.cpp` includes `date.h` and `calendar.h`, and `calendar.h` also includes `date.h`. Without a guard, what does the compiler report?",
          options: ["Nothing; identical definitions are merged", "Redefinition of class `Date`", "Undefined reference to `Date`", "A warning about an unused include"],
          answer: 1,
          explanation: "`#include` pastes text, so the class definition appears twice in one translation unit. `#pragma once` or an `#ifndef` guard makes the second inclusion empty.",
        },
        {
          prompt: "Why is `using namespace std;` wrong in a header even if it is acceptable in a `.cpp`?",
          options: ["It does not compile in headers", "It silently applies to every file that includes the header, causing name clashes far from the cause", "It makes the header slower to compile", "It is fine in headers; the rule is the other way round"],
          answer: 1,
          explanation: "A directive in a header is pasted into every includer, which cannot opt out. The pollution surfaces as ambiguities in files whose authors never wrote the directive.",
        },
        {
          prompt: "The class body defines `int year() const { return y_; }` and the header is included from ten files. Why is there no multiple-definition error?",
          options: ["The linker discards duplicates for members", "A member function defined inside the class body is implicitly `inline`", "Getters are exempt from the one-definition rule", "The compiler only compiles the first include"],
          answer: 1,
          explanation: "In-class definitions are inline by rule, and `inline` allows one definition per translation unit, of which the linker keeps one. That is what lets trivial members live in the header.",
        },
        {
          prompt: "In what order does the lesson recommend taking the design decisions for a class?",
          options: ["Interface, then representation, then constructor, then invariant", "Representation, then the invariant, then a constructor that enforces it, then a small const-correct interface", "Constructor first, then members as needed", "Write all getters and setters, then remove the unused ones"],
          answer: 1,
          explanation: "The representation decides what is cheap; the invariant says what the members must obey; the constructor is the one entry that enforces it; only then is the interface chosen, and kept complete and minimal.",
        },
        {
          prompt: "Why does the worked `Date` have `nextDay()` but no `setDay(int)`?",
          options: ["Setters are not allowed in C++20", "A date is a value: a different date is a new object built through the constructor, so the invariant keeps one entrance", "`setDay` would need to be a friend", "Because `d_` is `const`"],
          answer: 1,
          explanation: "A setter would be a second way to change the members, and it would have to repeat the validation. A derived operation that returns a new `Date` through the constructor gets the check for free.",
        },
      ],
    },
    {
      slug: "classes-checkpoint",
      file: "07-checkpoint.md",
      kind: "test",
      passMark: 70,
      exercises: [
        {
          title: "A chaining gradebook",
          prompt: `Write \`class Student\`: a name, a private \`std::vector<int>\` of marks with the invariant that every stored mark is 0–100, and a private count of rejected marks. \`Student& add(int mark)\` stores a valid mark or counts an invalid one, and **returns \`*this\`** so calls chain. Const readers: \`name()\`, \`average()\` (0 when there are no marks), \`best()\` (the highest mark) and \`rejected()\`. Use \`explicit\` on the constructor.

Read \`n\` students, each as \`name k m1 ... mk\`. Print \`<name> avg <average to two decimals> best <best or none> rejected <count>\` per student, then \`top <name>\` for the highest average (the first one on a tie).

**Input:** \`n\` (at least 1), then \`n\` lines.
**Output:** \`n + 1\` lines.

\`\`\`text
3
ada 3 90 80 101
bob 2 70 -5
cy 0
\`\`\`
→
\`\`\`text
ada avg 85.00 best 90 rejected 1
bob avg 70.00 best 70 rejected 1
cy avg 0.00 best none rejected 0
top ada
\`\`\``,
          starter: String.raw`#include <iomanip>
#include <iostream>
#include <string>
#include <vector>

class Student {
    std::string name_;
    std::vector<int> marks_;   // invariant: every mark is 0..100
    int rejected_ = 0;
public:
    explicit Student(std::string name) : name_(std::move(name)) {}
    // TODO: Student& add(int mark)
    const std::string& name() const { return name_; }
    // TODO: double average() const, int best() const, int rejected() const, bool hasMarks() const
};

int main() {
    std::cout << std::fixed << std::setprecision(2);
    int n;
    std::cin >> n;
    std::vector<Student> all;
    for (int i = 0; i < n; ++i) {
        std::string name;
        int k;
        std::cin >> name >> k;
        Student s(name);
        for (int j = 0; j < k; ++j) {
            int mark;
            std::cin >> mark;
            // TODO: s.add(mark)
        }
        all.push_back(s);
    }
    // TODO: print each student and the top one
    return 0;
}
`,
          solution: String.raw`#include <iomanip>
#include <iostream>
#include <string>
#include <vector>

class Student {
    std::string name_;
    std::vector<int> marks_;   // invariant: every mark is 0..100
    int rejected_ = 0;
public:
    explicit Student(std::string name) : name_(std::move(name)) {}
    Student& add(int mark) {
        if (mark < 0 || mark > 100) {
            ++rejected_;
            return *this;
        }
        marks_.push_back(mark);
        return *this;
    }
    const std::string& name() const { return name_; }
    bool hasMarks() const { return !marks_.empty(); }
    double average() const {
        if (marks_.empty()) return 0;
        long long sum = 0;
        for (int m : marks_) sum += m;
        return static_cast<double>(sum) / static_cast<double>(marks_.size());
    }
    int best() const {
        int b = 0;
        for (int m : marks_) if (m > b) b = m;
        return b;
    }
    int rejected() const { return rejected_; }
};

int main() {
    std::cout << std::fixed << std::setprecision(2);
    int n;
    std::cin >> n;
    std::vector<Student> all;
    for (int i = 0; i < n; ++i) {
        std::string name;
        int k;
        std::cin >> name >> k;
        Student s(name);
        for (int j = 0; j < k; ++j) {
            int mark;
            std::cin >> mark;
            s.add(mark);
        }
        all.push_back(s);
    }
    std::size_t top = 0;
    for (std::size_t i = 0; i < all.size(); ++i) {
        const Student& s = all[i];
        std::cout << s.name() << " avg " << s.average() << " best ";
        if (s.hasMarks()) std::cout << s.best(); else std::cout << "none";
        std::cout << " rejected " << s.rejected() << '\n';
        if (s.average() > all[top].average()) top = i;
    }
    std::cout << "top " << all[top].name() << '\n';
    return 0;
}
`,
          hints: [
            "add returns Student& on both paths — the rejected one too — so s.add(90).add(101) compiles and counts the second.",
            "Print through a const Student&; if a reader is not const, that line will not compile, which is the checklist doing its job.",
            "Track the index of the best average and replace it only on a strictly greater value, so the first of a tie wins.",
          ],
          cases: [
            { stdin: "3\nada 3 90 80 101\nbob 2 70 -5\ncy 0\n", expected: "ada avg 85.00 best 90 rejected 1\nbob avg 70.00 best 70 rejected 1\ncy avg 0.00 best none rejected 0\ntop ada\n" },
            { stdin: "2\nx 1 100\ny 1 100\n", expected: "x avg 100.00 best 100 rejected 0\ny avg 100.00 best 100 rejected 0\ntop x\n" },
            { stdin: "1\nz 3 0 0 0\n", expected: "z avg 0.00 best 0 rejected 0\ntop z\n", hidden: true },
            { stdin: "2\na 2 200 300\nb 3 50 60 55\n", expected: "a avg 0.00 best none rejected 2\nb avg 55.00 best 60 rejected 0\ntop b\n", hidden: true },
          ],
        },
        {
          title: "A grid with const and non-const at()",
          prompt: `Write \`class Grid\` over a row-major \`std::vector<int>\` with \`rows()\`, \`cols()\`, and two overloads of \`at(r, c)\`: \`int& at(int, int)\` for writing and \`const int& at(int, int) const\` for reading, both throwing \`std::out_of_range\` for a bad cell. Two mutators return \`Grid&\` so they chain: \`flipRows()\` reverses the order of the rows and \`flipCols()\` reverses every row; a half-turn of the grid is the one chain \`g.flipRows().flipCols()\`. \`long long sum() const\` totals the cells. The free function \`show(const Grid&)\` prints the rows, space-separated, through the const \`at\`.

Read \`R C\`, the grid, then \`q\` commands: \`set r c v\` (writes through the non-const \`at\`; prints nothing), \`get r c\` (reads through a \`const Grid&\`; prints the value), \`turn\` (the chain; prints nothing), \`show\`, \`sum\`. A \`set\` or \`get\` on a bad cell prints \`out of range\`.

**Input:** \`R C\`, \`R\` rows of \`C\` integers, \`q\`, then \`q\` commands.
**Output:** the lines the commands produce.

\`\`\`text
2 3
1 2 3
4 5 6
5
get 1 2
turn
show
set 0 0 9
get 0 0
\`\`\`
→
\`\`\`text
6
6 5 4
3 2 1
9
\`\`\``,
          starter: String.raw`#include <iostream>
#include <stdexcept>
#include <string>
#include <vector>

class Grid {
    int rows_;
    int cols_;
    std::vector<int> cells_;   // row-major: cell (r, c) is cells_[r * cols_ + c]
public:
    Grid(int rows, int cols) : rows_(rows), cols_(cols), cells_(static_cast<std::size_t>(rows) * cols, 0) {}
    int rows() const { return rows_; }
    int cols() const { return cols_; }
    // TODO: int& at(int r, int c) and const int& at(int r, int c) const, both range-checked
    // TODO: Grid& flipRows(), Grid& flipCols()
    long long sum() const { return 0; }   // TODO
};

void show(const Grid& g) {
    // TODO: each row on a line, values separated by single spaces
    (void)g;
}

int main() {
    int R, C;
    std::cin >> R >> C;
    Grid g(R, C);
    for (int r = 0; r < R; ++r) {
        for (int c = 0; c < C; ++c) {
            int v;
            std::cin >> v;
            // TODO: g.at(r, c) = v;
            (void)v;
        }
    }
    const Grid& view = g;
    int q;
    std::cin >> q;
    for (int i = 0; i < q; ++i) {
        std::string cmd;
        std::cin >> cmd;
        // TODO: set / get / turn / show / sum
        (void)view;
    }
    return 0;
}
`,
          solution: String.raw`#include <iostream>
#include <stdexcept>
#include <string>
#include <vector>

class Grid {
    int rows_;
    int cols_;
    std::vector<int> cells_;   // row-major: cell (r, c) is cells_[r * cols_ + c]
    void check(int r, int c) const {
        if (r < 0 || r >= rows_ || c < 0 || c >= cols_) throw std::out_of_range("cell");
    }
public:
    Grid(int rows, int cols) : rows_(rows), cols_(cols), cells_(static_cast<std::size_t>(rows) * cols, 0) {}
    int rows() const { return rows_; }
    int cols() const { return cols_; }
    int& at(int r, int c) {
        check(r, c);
        return cells_[static_cast<std::size_t>(r) * cols_ + c];
    }
    const int& at(int r, int c) const {
        check(r, c);
        return cells_[static_cast<std::size_t>(r) * cols_ + c];
    }
    Grid& flipRows() {
        for (int r = 0; r < rows_ / 2; ++r) {
            for (int c = 0; c < cols_; ++c) std::swap(at(r, c), at(rows_ - 1 - r, c));
        }
        return *this;
    }
    Grid& flipCols() {
        for (int r = 0; r < rows_; ++r) {
            for (int c = 0; c < cols_ / 2; ++c) std::swap(at(r, c), at(r, cols_ - 1 - c));
        }
        return *this;
    }
    long long sum() const {
        long long s = 0;
        for (int v : cells_) s += v;
        return s;
    }
};

void show(const Grid& g) {
    for (int r = 0; r < g.rows(); ++r) {
        for (int c = 0; c < g.cols(); ++c) {
            if (c > 0) std::cout << ' ';
            std::cout << g.at(r, c);
        }
        std::cout << '\n';
    }
}

int main() {
    int R, C;
    std::cin >> R >> C;
    Grid g(R, C);
    for (int r = 0; r < R; ++r) {
        for (int c = 0; c < C; ++c) {
            int v;
            std::cin >> v;
            g.at(r, c) = v;
        }
    }
    const Grid& view = g;
    int q;
    std::cin >> q;
    for (int i = 0; i < q; ++i) {
        std::string cmd;
        std::cin >> cmd;
        if (cmd == "set") {
            int r, c, v;
            std::cin >> r >> c >> v;
            try {
                g.at(r, c) = v;
            } catch (const std::out_of_range&) {
                std::cout << "out of range\n";
            }
        } else if (cmd == "get") {
            int r, c;
            std::cin >> r >> c;
            try {
                std::cout << view.at(r, c) << '\n';
            } catch (const std::out_of_range&) {
                std::cout << "out of range\n";
            }
        } else if (cmd == "turn") {
            g.flipRows().flipCols();
        } else if (cmd == "show") {
            show(view);
        } else {
            std::cout << view.sum() << '\n';
        }
    }
    return 0;
}
`,
          hints: [
            "The two at() overloads have identical bodies; a private const check(r, c) keeps the range test in one place and is callable from both.",
            "flipRows swaps row r with row rows-1-r for r below rows/2; flipCols does the same within each row; both end with return *this.",
            "view is a const Grid&, so view.at picks the const overload and show can only read — exactly what a printer should be able to do.",
          ],
          cases: [
            { stdin: "2 3\n1 2 3\n4 5 6\n5\nget 1 2\nturn\nshow\nset 0 0 9\nget 0 0\n", expected: "6\n6 5 4\n3 2 1\n9\n" },
            { stdin: "1 1\n7\n3\nget 0 1\nset 1 0 3\nsum\n", expected: "out of range\nout of range\n7\n" },
            { stdin: "3 2\n1 2\n3 4\n5 6\n3\nturn\nshow\nsum\n", expected: "6 5\n4 3\n2 1\n21\n", hidden: true },
            { stdin: "2 2\n1 2\n3 4\n4\nset 1 1 10\nturn\nshow\nget 0 0\n", expected: "10 3\n2 1\n10\n", hidden: true },
          ],
        },
        {
          title: "Assembly line, traced",
          prompt: `\`Part\` prints \`make <name>\` when constructed and \`scrap <name>\` when destroyed. Write \`class Widget\` with three \`Part\` members declared in the order \`frame_\`, \`motor_\`, \`shell_\`, an \`int serial_\`, and an \`inline static int built_\` counting every widget assembled. The constructor takes a model name, initialises the parts as \`<model>-frame\`, \`<model>-motor\`, \`<model>-shell\` and the serial as \`++built_\` — all in the member-initialiser list — then prints \`assembled #<serial> <model>\`. The destructor prints \`disassemble #<serial>\`; the parts are then scrapped in reverse order by the language. Delete copying, so the count cannot drift, and publish the count through \`static int built()\`.

Commands, each in its own block followed by \`--\`: \`one <model>\` builds one widget; \`two <a> <b>\` builds \`a\` then \`b\` in the same block. Finish with \`built <count>\`. Trace it on paper first: the checkpoint says so.

**Input:** \`n\`, then \`n\` commands.
**Output:** the trace, then the count.

\`\`\`text
1
two b c
\`\`\`
→
\`\`\`text
make b-frame
make b-motor
make b-shell
assembled #1 b
make c-frame
make c-motor
make c-shell
assembled #2 c
disassemble #2
scrap c-shell
scrap c-motor
scrap c-frame
disassemble #1
scrap b-shell
scrap b-motor
scrap b-frame
--
built 2
\`\`\``,
          starter: String.raw`#include <iostream>
#include <string>

struct Part {
    std::string name;
    explicit Part(std::string n) : name(std::move(n)) { std::cout << "make " << name << '\n'; }
    ~Part() { std::cout << "scrap " << name << '\n'; }
};

class Widget {
    Part frame_;
    Part motor_;
    Part shell_;
    int serial_;
    // TODO: inline static int built_
public:
    explicit Widget(const std::string& model)
        : frame_(model), motor_(model), shell_(model), serial_(0) {
        // TODO: initialise the parts as <model>-frame etc. and serial_ as ++built_, then print
    }
    // TODO: destructor, deleted copying, static int built()
};

int main() {
    int n;
    std::cin >> n;
    for (int i = 0; i < n; ++i) {
        std::string cmd, a, b;
        std::cin >> cmd >> a;
        if (cmd == "one") {
            Widget w(a);
        } else {
            std::cin >> b;
            Widget x(a);
            Widget y(b);
        }
        std::cout << "--\n";
    }
    // TODO: print built <count>
    return 0;
}
`,
          solution: String.raw`#include <iostream>
#include <string>

struct Part {
    std::string name;
    explicit Part(std::string n) : name(std::move(n)) { std::cout << "make " << name << '\n'; }
    ~Part() { std::cout << "scrap " << name << '\n'; }
};

class Widget {
    Part frame_;
    Part motor_;
    Part shell_;
    int serial_;
    inline static int built_ = 0;
public:
    explicit Widget(const std::string& model)
        : frame_(model + "-frame"), motor_(model + "-motor"), shell_(model + "-shell"), serial_(++built_) {
        std::cout << "assembled #" << serial_ << ' ' << model << '\n';
    }
    ~Widget() { std::cout << "disassemble #" << serial_ << '\n'; }
    Widget(const Widget&) = delete;
    Widget& operator=(const Widget&) = delete;
    static int built() { return built_; }
};

int main() {
    int n;
    std::cin >> n;
    for (int i = 0; i < n; ++i) {
        std::string cmd, a, b;
        std::cin >> cmd >> a;
        if (cmd == "one") {
            Widget w(a);
        } else {
            std::cin >> b;
            Widget x(a);
            Widget y(b);
        }
        std::cout << "--\n";
    }
    std::cout << "built " << Widget::built() << '\n';
    return 0;
}
`,
          hints: [
            "Members are constructed in declaration order before the constructor body runs, so the three make lines precede the assembled line.",
            "The destructor body runs first, then the members are destroyed last-declared first: disassemble, then shell, motor, frame.",
            "Two objects in one block are destroyed in reverse order of construction: y before x.",
          ],
          cases: [
            { stdin: "1\ntwo b c\n", expected: "make b-frame\nmake b-motor\nmake b-shell\nassembled #1 b\nmake c-frame\nmake c-motor\nmake c-shell\nassembled #2 c\ndisassemble #2\nscrap c-shell\nscrap c-motor\nscrap c-frame\ndisassemble #1\nscrap b-shell\nscrap b-motor\nscrap b-frame\n--\nbuilt 2\n" },
            { stdin: "1\none alpha\n", expected: "make alpha-frame\nmake alpha-motor\nmake alpha-shell\nassembled #1 alpha\ndisassemble #1\nscrap alpha-shell\nscrap alpha-motor\nscrap alpha-frame\n--\nbuilt 1\n" },
            { stdin: "0\n", expected: "built 0\n", hidden: true },
            { stdin: "2\none a\ntwo b c\n", expected: "make a-frame\nmake a-motor\nmake a-shell\nassembled #1 a\ndisassemble #1\nscrap a-shell\nscrap a-motor\nscrap a-frame\n--\nmake b-frame\nmake b-motor\nmake b-shell\nassembled #2 b\nmake c-frame\nmake c-motor\nmake c-shell\nassembled #3 c\ndisassemble #3\nscrap c-shell\nscrap c-motor\nscrap c-frame\ndisassemble #2\nscrap b-shell\nscrap b-motor\nscrap b-frame\n--\nbuilt 3\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "What are the only two differences between `struct` and `class`?",
          options: ["Structs cannot have constructors or destructors", "Default member access and default inheritance access", "Structs are values and classes are references", "Classes can be templates; structs cannot"],
          answer: 1,
          explanation: "Members and bases of a `struct` default to public, of a `class` to private. Everything else — constructors, value semantics, templates — is identical.",
        },
        {
          prompt: "```cpp\nclass P {\n    int a_;\n    int b_;\npublic:\n    P(int x) : b_(x), a_(b_ * 2) {}\n};\n```\nWhat does `P p(5);` do?",
          options: ["Sets `b_` to 5 and `a_` to 10", "Initialises `a_` first (declaration order) from an indeterminate `b_` — undefined behaviour, and `-Wreorder` warns", "Compile error: the list is out of order", "Sets both to 5"],
          answer: 1,
          explanation: "The initialiser list's order is ignored; members are initialised as declared, so `a_(b_ * 2)` reads `b_` before `b_(x)` runs. Read the parameter instead: `a_(x * 2)`.",
        },
        {
          prompt: "With `explicit Money(long long cents);`, why does `Money m = 5;` fail while `Money m{5};` works?",
          options: ["Braces are required for all class types", "`= 5` is copy-initialisation, an implicit conversion that `explicit` forbids; `{5}` is direct initialisation", "`5` is an `int`, not a `long long`", "`explicit` constructors can only be called with parentheses"],
          answer: 1,
          explanation: "`explicit` switches off implicit conversions from the argument type, and copy-initialisation is one. Direct initialisation with braces or parentheses names the constructor and is allowed.",
        },
        {
          prompt: "Inside a `const` member function of `Account`, what is `this`?",
          options: ["`Account*`", "`const Account*`", "`const Account&`", "`Account* const`"],
          answer: 1,
          explanation: "The trailing `const` makes the object const for the duration of the call, so `this` points to a `const Account` and members cannot be modified — except `mutable` ones.",
        },
        {
          prompt: "Why must a chaining mutator return `Student&` rather than `Student`?",
          options: ["Returning by value is not allowed for members", "Returning by value hands the next call a copy; the chain modifies temporaries and the original is unchanged", "References are faster and the compiler requires them for chaining", "`*this` cannot be copied"],
          answer: 1,
          explanation: "`s.add(1).add(2)` must call the second `add` on `s` itself. A by-value return creates a copy, so the second call modifies an object that dies at the semicolon.",
        },
        {
          prompt: "An instance counter is incremented in the constructor and decremented in the destructor; copying is left to the compiler. What goes wrong?",
          options: ["Nothing; the generated copy constructor also increments", "The generated copy constructor copies members without running the body, so a copied object is not counted and the count goes negative on destruction", "Compile error: a class with a destructor cannot be copied", "The counter is reset on every copy"],
          answer: 1,
          explanation: "Generated special members do memberwise work only. Either count in a hand-written copy constructor or delete copying; the exercises take the second route.",
        },
        {
          prompt: "Which operand of `operator<<` makes it impossible to write as a member of `Money`?",
          options: ["The right operand, because it is `const`", "The left operand: it is the stream, and a member's left operand is always the object of its class", "Neither; it can be a member if declared `static`", "The return value"],
          answer: 1,
          explanation: "`std::cout << m` calls an operator whose left operand is `std::ostream`, which is not your class. So the operator is a free function, typically a `friend` for access to the private representation.",
        },
        {
          prompt: "```cpp\nstruct Config { std::string host; int port = 80; bool tls = false; };\nConfig c{.port = 443, .host = \"x\"};\n```\nWhat happens?",
          options: ["`c` is `{\"x\", 443, false}`", "Compile error: designators must be in declaration order", "`host` is ignored", "`c` is `{\"\", 443, false}`"],
          answer: 1,
          explanation: "C++20 designated initialisers must appear in the order the members are declared; `.host` after `.port` is an error rather than a reordering.",
        },
        {
          prompt: "Which delegating constructor is valid?",
          options: ["`Money() : Money(0), cents_(0) {}`", "`Money() : cents_(0), Money(0) {}`", "`Money() : Money(0) {}`", "`Money() { Money(0); }`"],
          answer: 2,
          explanation: "The delegation must be the entire initialiser list. The last option compiles but creates and discards a temporary, leaving `cents_` uninitialised.",
        },
        {
          prompt: "A `const` member function `mean()` recomputes a cached value when a flag says it is stale. What must the cache members be?",
          options: ["`static`", "`mutable`", "`constexpr`", "`volatile`"],
          answer: 1,
          explanation: "`mutable` exempts a member from the const promise so a const function may write it. It is right here because the cache is not part of the object's logical value.",
        },
        {
          prompt: "Why is `inline static int count_ = 0;` preferred over `static int count_;` plus `int T::count_ = 0;` in a source file?",
          options: ["It is faster at run time", "The in-class line is then the one definition, so the header is self-contained and no source file needs the definition", "It makes the member `constexpr`", "The two-part form does not compile in C++20"],
          answer: 1,
          explanation: "Since C++17 an `inline` static data member is defined where it is declared; the linker keeps one copy across translation units. The two-part form still works but needs exactly one definition somewhere.",
        },
        {
          prompt: "`friend class Auditor;` appears in `Account`. Which statement is true?",
          options: ["`Account` can now access `Auditor`'s private members too", "Classes derived from `Auditor` also get access", "Every member function of `Auditor` can access `Account`'s private members; nothing else follows", "Friends of `Auditor` can access `Account`"],
          answer: 2,
          explanation: "Friendship is granted by the class, one way, and is neither transitive nor inherited: only `Auditor`'s own member functions gain access.",
        },
        {
          prompt: "A header has no `#pragma once` or include guard. When does the problem appear?",
          options: ["At link time, as a multiple definition", "At compile time, as a redefinition, when one translation unit includes it twice through another header", "Only at run time", "Never; compilers deduplicate includes"],
          answer: 1,
          explanation: "`#include` is textual, so the class definition is pasted twice into one file. A guard makes the second inclusion empty; the linker is not involved.",
        },
        {
          prompt: "```cpp\nstruct P {\n    std::string n;\n    explicit P(const char* s) : n(s) { std::cout << '+' << n; }\n    ~P() { std::cout << '-' << n; }\n};\nstruct W { P a{\"a\"}; P b{\"b\"}; };\nint main() { W w; }\n```\nWhat is printed?",
          options: ["`+a+b-a-b`", "`+a+b-b-a`", "`+b+a-a-b`", "`+a-a+b-b`"],
          answer: 1,
          explanation: "Members are constructed in declaration order (`a` then `b`) and destroyed in reverse (`b` then `a`) when `w` goes out of scope at the end of `main`.",
        },
      ],
    },
  ],
});

import { defineModule } from "../../dsl.js";

export default defineModule(import.meta.url, {
  slug: "inheritance-polymorphism",
  title: "Inheritance and polymorphism",
  blurb: "Deriving and the order of construction, virtual functions with override and final, abstract classes and interfaces held through unique_ptr, virtual destructors and slicing, the vtable, dynamic_cast and std::variant, and when composition beats inheritance.",
  icon: "tree",
  overview: `Inheritance is how one C++ class is built on another, and polymorphism is what you get when a function called through a base reference runs the derived class's version. Java learners know the shape — \`extends\`, \`@Override\`, interfaces — but C++ makes every part of it explicit and puts the consequences in your hands: the base's access specifier, a construction order the compiler fixes, a \`virtual\` keyword that turns a compile-time call into a run-time one, a destructor that must be virtual or the delete is undefined behaviour, and a copy into a base value that silently drops the derived half. Get these right and a hierarchy is the cleanest way to say "many kinds of thing, one interface"; get them wrong and the program compiles and lies.

The six lessons move from mechanics to design. Inheritance basics fixes what is inherited, what \`protected\` means, the base-then-members-then-body order and its reverse, \`using B::B\` and name hiding. Virtual functions separates static from dynamic type, adds \`override\` and \`final\`, and shows the two places dispatch does not reach: default arguments and constructors. Abstract classes and interfaces introduces \`= 0\`, the interface class, a \`Shape\` hierarchy and the container that holds it, \`std::vector<std::unique_ptr<Shape>>\`. Virtual destructors and slicing covers the two ways a hierarchy loses data and the rules that prevent both. RTTI and the vtable opens the implementation — vptr, vtable, one indirect call — then \`dynamic_cast\`, \`typeid\`, the cast-chain smell and \`std::variant\` as the closed-set alternative. Composition versus inheritance closes with is-a against has-a, the Liskov rule and its square-and-rectangle failure, private and multiple inheritance, and the reasons a member usually beats a base.

The exercises are whole programs that print what the language does: a construction and destruction tracer whose order is fully defined, an account whose hidden \`withdraw\` calls the base version, a side-by-side of virtual and non-virtual dispatch naming which function ran, a pricing hierarchy with \`override\` and \`final\`, a \`Shape\` catalogue and an encoder pipeline through \`unique_ptr\`, a slicing demonstration and a resource stack released in reverse, a \`dynamic_cast\` census and the same shapes redone as a \`std::variant\`, a service that owns its logger and an undo history composed of two vectors. The checkpoint's three programs — a bank of polymorphic accounts, an expression tree and a plugin registry with a load and unload trace — draw on all of it.`,
  lessons: [
    {
      slug: "inheritance-basics",
      file: "01-inheritance-basics.md",
      exercises: [
        {
          title: "Construction and destruction tracer",
          prompt: `Complete a three-level hierarchy whose constructors and destructors announce themselves, then let the scaffold build the objects and tear them down.

\`Vehicle\` holds a protected \`std::string name_\` and prints \`Vehicle(<name>)\` when constructed and \`~Vehicle(<name>)\` when destroyed. \`Car : public Vehicle\` adds an \`Engine\` member (which prints \`Engine(<name>)\` / \`~Engine(<name>)\`) and prints \`Car(<name>)\` / \`~Car(<name>)\`. \`SportsCar : public Car\` adds a \`Turbo\` member (\`Turbo(<name>)\` / \`~Turbo(<name>)\`) and prints \`SportsCar(<name>)\` / \`~SportsCar(<name>)\`. Every constructor takes the name and passes it to its base in the **initialiser list**; the members are initialised from the same name.

The starter's \`build\` function constructs the objects one per recursive call, so they are all alive at once and die in reverse order when the calls return. It prints \`-- all built --\` between the two phases. Your job is the classes; the order is the language's.

**Input:** \`n\`, then \`n\` lines of \`kind name\` where kind is \`vehicle\`, \`car\` or \`sportscar\`.
**Output:** the construction trace, the separator, the destruction trace.

\`\`\`text
2
car mini
sportscar zed
\`\`\`
prints
\`\`\`text
Vehicle(mini)
Engine(mini)
Car(mini)
Vehicle(zed)
Engine(zed)
Car(zed)
Turbo(zed)
SportsCar(zed)
-- all built --
~SportsCar(zed)
~Turbo(zed)
~Car(zed)
~Engine(zed)
~Vehicle(zed)
~Car(mini)
~Engine(mini)
~Vehicle(mini)
\`\`\``,
          starter: String.raw`#include <iostream>
#include <string>
#include <vector>

class Engine {
public:
    explicit Engine(const std::string& tag) : tag_(tag) { std::cout << "Engine(" << tag_ << ")\n"; }
    ~Engine() { std::cout << "~Engine(" << tag_ << ")\n"; }
private:
    std::string tag_;
};

class Turbo {
public:
    explicit Turbo(const std::string& tag) : tag_(tag) { std::cout << "Turbo(" << tag_ << ")\n"; }
    ~Turbo() { std::cout << "~Turbo(" << tag_ << ")\n"; }
private:
    std::string tag_;
};

class Vehicle {
public:
    explicit Vehicle(const std::string& name) : name_(name) { std::cout << "Vehicle(" << name_ << ")\n"; }
    ~Vehicle() { std::cout << "~Vehicle(" << name_ << ")\n"; }
protected:
    std::string name_;
};

class Car : public Vehicle {
public:
    explicit Car(const std::string& name) : Vehicle(name) {
        // TODO: add an Engine member engine_ initialised from name (in the initialiser list) and print Car(<name>)
    }
    // TODO: destructor printing ~Car(<name>) — name_ is still alive here
};

class SportsCar : public Car {
public:
    explicit SportsCar(const std::string& name) : Car(name) {
        // TODO: add a Turbo member turbo_ and print SportsCar(<name>)
    }
    // TODO: destructor printing ~SportsCar(<name>)
};

struct Spec {
    std::string kind;
    std::string name;
};

// Builds specs[i] on this frame, then the rest on deeper frames; returning unwinds in reverse.
void build(const std::vector<Spec>& specs, std::size_t i) {
    if (i == specs.size()) {
        std::cout << "-- all built --\n";
        return;
    }
    const Spec& s = specs[i];
    if (s.kind == "vehicle") {
        Vehicle v(s.name);
        build(specs, i + 1);
    } else if (s.kind == "car") {
        Car c(s.name);
        build(specs, i + 1);
    } else {
        SportsCar sc(s.name);
        build(specs, i + 1);
    }
}

int main() {
    int n = 0;
    std::cin >> n;
    std::vector<Spec> specs(n);
    for (auto& s : specs) std::cin >> s.kind >> s.name;
    build(specs, 0);
    return 0;
}
`,
          solution: String.raw`#include <iostream>
#include <string>
#include <vector>

class Engine {
public:
    explicit Engine(const std::string& tag) : tag_(tag) { std::cout << "Engine(" << tag_ << ")\n"; }
    ~Engine() { std::cout << "~Engine(" << tag_ << ")\n"; }
private:
    std::string tag_;
};

class Turbo {
public:
    explicit Turbo(const std::string& tag) : tag_(tag) { std::cout << "Turbo(" << tag_ << ")\n"; }
    ~Turbo() { std::cout << "~Turbo(" << tag_ << ")\n"; }
private:
    std::string tag_;
};

class Vehicle {
public:
    explicit Vehicle(const std::string& name) : name_(name) { std::cout << "Vehicle(" << name_ << ")\n"; }
    ~Vehicle() { std::cout << "~Vehicle(" << name_ << ")\n"; }
protected:
    std::string name_;
};

class Car : public Vehicle {
public:
    explicit Car(const std::string& name) : Vehicle(name), engine_(name) {
        std::cout << "Car(" << name_ << ")\n";
    }
    ~Car() { std::cout << "~Car(" << name_ << ")\n"; }
private:
    Engine engine_;
};

class SportsCar : public Car {
public:
    explicit SportsCar(const std::string& name) : Car(name), turbo_(name) {
        std::cout << "SportsCar(" << name_ << ")\n";
    }
    ~SportsCar() { std::cout << "~SportsCar(" << name_ << ")\n"; }
private:
    Turbo turbo_;
};

struct Spec {
    std::string kind;
    std::string name;
};

// Builds specs[i] on this frame, then the rest on deeper frames; returning unwinds in reverse.
void build(const std::vector<Spec>& specs, std::size_t i) {
    if (i == specs.size()) {
        std::cout << "-- all built --\n";
        return;
    }
    const Spec& s = specs[i];
    if (s.kind == "vehicle") {
        Vehicle v(s.name);
        build(specs, i + 1);
    } else if (s.kind == "car") {
        Car c(s.name);
        build(specs, i + 1);
    } else {
        SportsCar sc(s.name);
        build(specs, i + 1);
    }
}

int main() {
    int n = 0;
    std::cin >> n;
    std::vector<Spec> specs(n);
    for (auto& s : specs) std::cin >> s.kind >> s.name;
    build(specs, 0);
    return 0;
}
`,
          hints: [
            "The base goes first in the initialiser list, then the member: `Car(const std::string& name) : Vehicle(name), engine_(name)`.",
            "The member is constructed after the base and before the body, so Engine(<name>) prints between Vehicle(<name>) and Car(<name>) without you ordering anything.",
            "In ~Car the base is still alive, so `name_` can be printed; the member and the base are destroyed after the body, in that order.",
          ],
          cases: [
            { stdin: "2\ncar mini\nsportscar zed\n", expected: "Vehicle(mini)\nEngine(mini)\nCar(mini)\nVehicle(zed)\nEngine(zed)\nCar(zed)\nTurbo(zed)\nSportsCar(zed)\n-- all built --\n~SportsCar(zed)\n~Turbo(zed)\n~Car(zed)\n~Engine(zed)\n~Vehicle(zed)\n~Car(mini)\n~Engine(mini)\n~Vehicle(mini)\n" },
            { stdin: "1\nsportscar ace\n", expected: "Vehicle(ace)\nEngine(ace)\nCar(ace)\nTurbo(ace)\nSportsCar(ace)\n-- all built --\n~SportsCar(ace)\n~Turbo(ace)\n~Car(ace)\n~Engine(ace)\n~Vehicle(ace)\n" },
            { stdin: "3\nvehicle cart\ncar van\nvehicle bike\n", expected: "Vehicle(cart)\nVehicle(van)\nEngine(van)\nCar(van)\nVehicle(bike)\n-- all built --\n~Vehicle(bike)\n~Car(van)\n~Engine(van)\n~Vehicle(van)\n~Vehicle(cart)\n", hidden: true },
            { stdin: "0\n", expected: "-- all built --\n", hidden: true },
          ],
        },
        {
          title: "Plain account, fee account",
          prompt: `Write \`Account\` with a \`protected long long balance_\`, a constructor taking the opening balance, \`void deposit(long long)\`, \`bool withdraw(long long)\` (returns \`false\` and changes nothing when the amount exceeds the balance) and \`long long balance() const\`.

Write \`FeeAccount : public Account\` that **inherits the constructor** with \`using Account::Account;\`, keeps a class constant \`kFee = 2\`, and declares its own \`bool withdraw(long long amount)\` — which **hides** the base's — implemented as one call to the base version: \`Account::withdraw(amount + kFee)\`. A withdrawal that would overdraw after the fee is rejected and nothing changes.

The program opens one of each with the same opening balance and applies every command to both.

**Input:** the opening balance, then lines of \`deposit x\` or \`withdraw x\` until the input ends.
**Output:** after each command, \`plain=<balance> fee=<balance>\`; at the end, \`rejected plain=<count> fee=<count>\`.

\`\`\`text
100
deposit 50
withdraw 20
withdraw 130
withdraw 128
\`\`\`
prints
\`\`\`text
plain=150 fee=150
plain=130 fee=128
plain=0 fee=128
plain=0 fee=128
rejected plain=1 fee=2
\`\`\``,
          starter: String.raw`#include <iostream>
#include <string>

class Account {
public:
    explicit Account(long long opening) : balance_(opening) {}
    void deposit(long long amount) {
        // TODO
    }
    bool withdraw(long long amount) {
        // TODO: reject when amount > balance_
        return false;
    }
    long long balance() const { return balance_; }
protected:
    long long balance_;
};

class FeeAccount : public Account {
public:
    // TODO: using Account::Account; a kFee constant; a withdraw that hides the base's and calls Account::withdraw
};

int main() {
    long long opening = 0;
    std::cin >> opening;
    Account plain(opening);
    // TODO: FeeAccount charged(opening);
    int rejectedPlain = 0;
    int rejectedFee = 0;
    std::string command;
    long long amount = 0;
    while (std::cin >> command >> amount) {
        // TODO: apply the command to both accounts, count rejections, print the balances
    }
    std::cout << "rejected plain=" << rejectedPlain << " fee=" << rejectedFee << '\n';
    return 0;
}
`,
          solution: String.raw`#include <iostream>
#include <string>

class Account {
public:
    explicit Account(long long opening) : balance_(opening) {}
    void deposit(long long amount) { balance_ += amount; }
    bool withdraw(long long amount) {
        if (amount > balance_) return false;
        balance_ -= amount;
        return true;
    }
    long long balance() const { return balance_; }
protected:
    long long balance_;
};

class FeeAccount : public Account {
public:
    using Account::Account;                       // FeeAccount(long long) forwards to Account(long long)
    static constexpr long long kFee = 2;
    bool withdraw(long long amount) {             // hides Account::withdraw
        return Account::withdraw(amount + kFee);  // the base version, by qualified name
    }
};

int main() {
    long long opening = 0;
    std::cin >> opening;
    Account plain(opening);
    FeeAccount charged(opening);
    int rejectedPlain = 0;
    int rejectedFee = 0;
    std::string command;
    long long amount = 0;
    while (std::cin >> command >> amount) {
        if (command == "deposit") {
            plain.deposit(amount);
            charged.deposit(amount);
        } else if (command == "withdraw") {
            if (!plain.withdraw(amount)) ++rejectedPlain;
            if (!charged.withdraw(amount)) ++rejectedFee;
        }
        std::cout << "plain=" << plain.balance() << " fee=" << charged.balance() << '\n';
    }
    std::cout << "rejected plain=" << rejectedPlain << " fee=" << rejectedFee << '\n';
    return 0;
}
`,
          hints: [
            "`using Account::Account;` gives FeeAccount the same constructor as Account, so `FeeAccount charged(opening)` compiles without writing one.",
            "Inside FeeAccount::withdraw, a bare `withdraw(...)` would call itself; `Account::withdraw(amount + kFee)` names the hidden base version.",
            "Because the base's withdraw does the balance check, the fee is only charged when the whole amount plus fee is covered.",
          ],
          cases: [
            { stdin: "100\ndeposit 50\nwithdraw 20\nwithdraw 130\nwithdraw 128\n", expected: "plain=150 fee=150\nplain=130 fee=128\nplain=0 fee=128\nplain=0 fee=128\nrejected plain=1 fee=2\n" },
            { stdin: "10\nwithdraw 10\nwithdraw 8\n", expected: "plain=0 fee=10\nplain=0 fee=0\nrejected plain=1 fee=1\n" },
            { stdin: "0\nwithdraw 0\ndeposit 5\nwithdraw 3\n", expected: "plain=0 fee=0\nplain=5 fee=5\nplain=2 fee=0\nrejected plain=0 fee=1\n", hidden: true },
            { stdin: "5000000000\nwithdraw 4999999999\n", expected: "plain=1 fee=5000000000\nrejected plain=0 fee=1\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: `What does this print?
\`\`\`cpp
struct A { A() { std::cout << "A"; } };
struct M { M() { std::cout << "M"; } };
struct B : A {
    M m;
    B() { std::cout << "B"; }
};
int main() { B b; }
\`\`\``,
          options: ["`AMB`", "`ABM`", "`MAB`", "`BAM`"],
          answer: 0,
          explanation: "The base subobject is constructed first, then the derived class's members in declaration order, then the derived constructor body: `A`, then `M`, then `B`. The body always runs last, whatever the initialiser list says.",
        },
        {
          prompt: "`class D : B { … };` — with no access specifier before `B`, what kind of inheritance is this?",
          options: ["Public, as in Java's `extends`", "Private — the default for `class`, as for members", "Protected", "A compile error: the specifier is required"],
          answer: 1,
          explanation: "For a `class` the default is private, both for members and for bases, so every inherited member becomes private to `D` and a `D` cannot be passed as a `B&`. `struct` defaults to public. Write `public` explicitly when you mean is-a.",
        },
        {
          prompt: "`class Base { public: Base(int); };` and `class Derived : public Base { public: Derived() {} };`. What happens?",
          options: ["It compiles; the base is left uninitialised", "It compiles; `Base(0)` is called implicitly", "Compile error: the base has no default constructor and the initialiser list does not call `Base(int)`", "Compile error: a derived class cannot have a default constructor"],
          answer: 2,
          explanation: "When the initialiser list omits the base, the compiler inserts a call to the base's default constructor. `Base` has only `Base(int)`, so there is none to call and the derived constructor fails to compile. The fix is `Derived() : Base(0) {}`.",
        },
        {
          prompt: "What does `using Vehicle::Vehicle;` inside `class Taxi : public Vehicle` do?",
          options: ["Makes `Vehicle`'s private members accessible to `Taxi`", "Declares constructors in `Taxi` matching every `Vehicle` constructor, each forwarding to the base", "Calls the `Vehicle` constructor before every `Taxi` member function", "Brings `Vehicle`'s virtual functions into `Taxi`'s scope"],
          answer: 1,
          explanation: "Constructors are not inherited by default; the `using` declaration inherits them, so `Taxi t(\"cab\")` works if `Vehicle(std::string)` exists. Derived members get their default member initialisers. It has nothing to do with private access or virtual functions.",
        },
        {
          prompt: `What does this print?
\`\`\`cpp
struct B { void f(int) { std::cout << "int"; } };
struct D : B { void f(double) { std::cout << "double"; } };
int main() { D d; d.f(3); }
\`\`\``,
          options: ["`int` — an exact match beats a conversion", "`double` — `D::f` hides every `B::f`, and `3` converts to `double`", "Compile error: ambiguous call", "`intdouble`"],
          answer: 1,
          explanation: "Name lookup stops at the first class walking upward that declares `f`, which is `D`; overload resolution then only sees `D::f(double)`, and `3` converts. `B::f(int)` is hidden, not overloaded. `using B::f;` in `D` would make both visible and select `int`.",
        },
        {
          prompt: "Which statement about `protected` members is correct?",
          options: ["They are accessible anywhere in the same translation unit", "They are accessible in derived classes' member functions, but only through an object of the derived type", "They are accessible in derived classes through any `Base&`", "They are private to the base and inaccessible to derived classes"],
          answer: 1,
          explanation: "A derived member function may read a protected member of `*this` or of another object of its own type, but not through a plain `Base&` — the rule stops a derived class from poking at unrelated siblings' state. Free functions and `main` never see protected members.",
        },
        {
          prompt: "In what order are the parts of a `Derived` object destroyed?",
          options: ["Base subobject, then members, then the derived destructor body", "Derived destructor body, then the derived members in reverse declaration order, then the base", "Members first, then base, then the derived destructor body", "The order is unspecified"],
          answer: 1,
          explanation: "Destruction is the exact reverse of construction (base, members in declaration order, body). The base is still alive during the derived destructor body, which is why it may still use base members; by the time the base destructor runs, the derived part is gone.",
        },
      ],
    },
    {
      slug: "virtual-functions",
      file: "02-virtual-functions.md",
      exercises: [
        {
          title: "Which function ran",
          prompt: `Write \`Animal\` with a **virtual** \`std::string sound() const\` returning \`Animal::sound\` and a **non-virtual** \`std::string describe() const\` returning \`Animal::describe\`. Write \`Dog\` and \`Cat\` deriving publicly from it; each **overrides** \`sound\` (marked \`override\`) and also declares its own \`describe\` — which, being non-virtual, only hides the base's. Every function returns its own qualified name as a string, so the output tells you which one ran.

The starter's \`viaBase\` takes a \`const Animal&\` and calls both functions through it. For each kind, print one line through the base reference and one line calling directly on the object.

**Input:** \`n\`, then \`n\` kinds: \`dog\`, \`cat\` or \`animal\`.
**Output:** two lines per kind.

\`\`\`text
2
dog
animal
\`\`\`
prints
\`\`\`text
dog via Animal&: Dog::sound, Animal::describe
dog direct: Dog::sound, Dog::describe
animal via Animal&: Animal::sound, Animal::describe
animal direct: Animal::sound, Animal::describe
\`\`\``,
          starter: String.raw`#include <iostream>
#include <string>

class Animal {
public:
    virtual ~Animal() = default;
    // TODO: virtual sound() returning "Animal::sound"; non-virtual describe() returning "Animal::describe"
};

// TODO: class Dog : public Animal — sound() override -> "Dog::sound", describe() -> "Dog::describe"
// TODO: class Cat : public Animal — sound() override -> "Cat::sound", describe() -> "Cat::describe"

void viaBase(const std::string& kind, const Animal& a) {
    // TODO: print "<kind> via Animal&: <a.sound()>, <a.describe()>"
    (void)kind;
    (void)a;
}

int main() {
    int n = 0;
    std::cin >> n;
    for (int i = 0; i < n; ++i) {
        std::string kind;
        std::cin >> kind;
        // TODO: construct the right object, call viaBase(kind, obj), then print the direct line:
        //       "<kind> direct: <obj.sound()>, <obj.describe()>"
    }
    return 0;
}
`,
          solution: String.raw`#include <iostream>
#include <string>

class Animal {
public:
    virtual ~Animal() = default;
    virtual std::string sound() const { return "Animal::sound"; }
    std::string describe() const { return "Animal::describe"; }     // not virtual: bound to the static type
};

class Dog : public Animal {
public:
    std::string sound() const override { return "Dog::sound"; }
    std::string describe() const { return "Dog::describe"; }        // hides Animal::describe
};

class Cat : public Animal {
public:
    std::string sound() const override { return "Cat::sound"; }
    std::string describe() const { return "Cat::describe"; }
};

void viaBase(const std::string& kind, const Animal& a) {
    std::cout << kind << " via Animal&: " << a.sound() << ", " << a.describe() << '\n';
}

int main() {
    int n = 0;
    std::cin >> n;
    for (int i = 0; i < n; ++i) {
        std::string kind;
        std::cin >> kind;
        if (kind == "dog") {
            Dog d;
            viaBase(kind, d);
            std::cout << kind << " direct: " << d.sound() << ", " << d.describe() << '\n';
        } else if (kind == "cat") {
            Cat c;
            viaBase(kind, c);
            std::cout << kind << " direct: " << c.sound() << ", " << c.describe() << '\n';
        } else {
            Animal a;
            viaBase(kind, a);
            std::cout << kind << " direct: " << a.sound() << ", " << a.describe() << '\n';
        }
    }
    return 0;
}
`,
          hints: [
            "Through `const Animal&`, `sound()` is virtual so the dynamic type picks Dog::sound; `describe()` is not, so the static type picks Animal::describe.",
            "Called directly on a `Dog`, the static type is Dog, so both Dog::sound and Dog::describe run — no dispatch was needed.",
            "Each kind needs its own branch with a local object of that type; a `Dog d;` binds to `const Animal&` by the implicit upcast.",
          ],
          cases: [
            { stdin: "2\ndog\nanimal\n", expected: "dog via Animal&: Dog::sound, Animal::describe\ndog direct: Dog::sound, Dog::describe\nanimal via Animal&: Animal::sound, Animal::describe\nanimal direct: Animal::sound, Animal::describe\n" },
            { stdin: "1\ncat\n", expected: "cat via Animal&: Cat::sound, Animal::describe\ncat direct: Cat::sound, Cat::describe\n" },
            { stdin: "3\ncat\ndog\ncat\n", expected: "cat via Animal&: Cat::sound, Animal::describe\ncat direct: Cat::sound, Cat::describe\ndog via Animal&: Dog::sound, Animal::describe\ndog direct: Dog::sound, Dog::describe\ncat via Animal&: Cat::sound, Animal::describe\ncat direct: Cat::sound, Cat::describe\n", hidden: true },
            { stdin: "1\nanimal\n", expected: "animal via Animal&: Animal::sound, Animal::describe\nanimal direct: Animal::sound, Animal::describe\n", hidden: true },
          ],
        },
        {
          title: "Pricing policies with override and final",
          prompt: `Write a small hierarchy of pricing policies and apply each one to a list of prices.

- \`Pricing\` has a virtual destructor and \`virtual long long price(long long base) const\` returning \`base\` unchanged.
- \`Percent(int p)\` overrides it: \`base - base * p / 100\` (integer arithmetic).
- \`Flat(long long off)\` overrides it: \`base - off\`, but never below 0.
- \`Clamped(int p, long long floor)\` derives from \`Percent\`, is marked \`final\`, and overrides \`price\` as the larger of \`Percent::price(base)\` — call the base version by its qualified name — and \`floor\`.

Mark every override \`override\`. The starter's \`makePolicy\` returns a \`std::unique_ptr<Pricing>\` for a command line; complete it.

**Input:** \`m\`, then a line of \`m\` prices, then one policy per line until the input ends: \`none\`, \`percent p\`, \`flat off\` or \`clamped p floor\`.
**Output:** one line per policy: the policy line as given, a colon, then each price after the policy.

\`\`\`text
3
100 250 40
none
percent 10
flat 30
clamped 50 30
\`\`\`
prints
\`\`\`text
none: 100 250 40
percent 10: 90 225 36
flat 30: 70 220 10
clamped 50 30: 50 125 30
\`\`\``,
          starter: String.raw`#include <algorithm>
#include <iostream>
#include <memory>
#include <sstream>
#include <string>
#include <vector>

class Pricing {
public:
    virtual ~Pricing() = default;
    virtual long long price(long long base) const { return base; }
};

// TODO: class Percent : public Pricing
// TODO: class Flat : public Pricing
// TODO: class Clamped final : public Percent — uses Percent::price(base) then applies the floor

std::unique_ptr<Pricing> makePolicy(const std::string& line) {
    std::istringstream in(line);
    std::string kind;
    in >> kind;
    // TODO: return the matching policy; "none" (or anything unknown) is a plain Pricing
    return std::make_unique<Pricing>();
}

int main() {
    int m = 0;
    std::cin >> m;
    std::vector<long long> prices(m);
    for (auto& p : prices) std::cin >> p;
    std::string line;
    std::getline(std::cin, line);                 // the rest of the prices line
    while (std::getline(std::cin, line)) {
        if (line.empty()) continue;
        const auto policy = makePolicy(line);
        std::cout << line << ':';
        for (long long p : prices) std::cout << ' ' << policy->price(p);
        std::cout << '\n';
    }
    return 0;
}
`,
          solution: String.raw`#include <algorithm>
#include <iostream>
#include <memory>
#include <sstream>
#include <string>
#include <vector>

class Pricing {
public:
    virtual ~Pricing() = default;
    virtual long long price(long long base) const { return base; }
};

class Percent : public Pricing {
public:
    explicit Percent(int percent) : percent_(percent) {}
    long long price(long long base) const override { return base - base * percent_ / 100; }
private:
    int percent_;
};

class Flat : public Pricing {
public:
    explicit Flat(long long off) : off_(off) {}
    long long price(long long base) const override { return std::max(0LL, base - off_); }
private:
    long long off_;
};

class Clamped final : public Percent {
public:
    Clamped(int percent, long long floor) : Percent(percent), floor_(floor) {}
    long long price(long long base) const override {
        return std::max(Percent::price(base), floor_);    // the base version, non-virtually
    }
private:
    long long floor_;
};

std::unique_ptr<Pricing> makePolicy(const std::string& line) {
    std::istringstream in(line);
    std::string kind;
    in >> kind;
    if (kind == "percent") {
        int p = 0;
        in >> p;
        return std::make_unique<Percent>(p);
    }
    if (kind == "flat") {
        long long off = 0;
        in >> off;
        return std::make_unique<Flat>(off);
    }
    if (kind == "clamped") {
        int p = 0;
        long long floor = 0;
        in >> p >> floor;
        return std::make_unique<Clamped>(p, floor);
    }
    return std::make_unique<Pricing>();
}

int main() {
    int m = 0;
    std::cin >> m;
    std::vector<long long> prices(m);
    for (auto& p : prices) std::cin >> p;
    std::string line;
    std::getline(std::cin, line);                 // the rest of the prices line
    while (std::getline(std::cin, line)) {
        if (line.empty()) continue;
        const auto policy = makePolicy(line);
        std::cout << line << ':';
        for (long long p : prices) std::cout << ' ' << policy->price(p);
        std::cout << '\n';
    }
    return 0;
}
`,
          hints: [
            "`std::make_unique<Percent>(p)` is a `unique_ptr<Percent>` that converts to `unique_ptr<Pricing>` on return.",
            "Inside Clamped::price a bare `price(base)` would recurse; write `Percent::price(base)` to run the percent rule once.",
            "`std::max` needs both operands of one type: `std::max(0LL, base - off_)` with a `long long` literal.",
          ],
          cases: [
            { stdin: "3\n100 250 40\nnone\npercent 10\nflat 30\nclamped 50 30\n", expected: "none: 100 250 40\npercent 10: 90 225 36\nflat 30: 70 220 10\nclamped 50 30: 50 125 30\n" },
            { stdin: "2\n7 1000\npercent 33\nflat 8\n", expected: "percent 33: 5 670\nflat 8: 0 992\n" },
            { stdin: "1\n0\nnone\npercent 100\nflat 1\nclamped 100 5\n", expected: "none: 0\npercent 100: 0\nflat 1: 0\nclamped 100 5: 5\n", hidden: true },
            { stdin: "4\n3000000000 1 2 3\npercent 50\nclamped 90 2\n", expected: "percent 50: 1500000000 1 1 2\nclamped 90 2: 300000000 2 2 2\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: `What does this print?
\`\`\`cpp
struct B { void hello() const { std::cout << "B"; } };
struct D : B { void hello() const { std::cout << "D"; } };
int main() {
    D d;
    const B& r = d;
    r.hello();
}
\`\`\``,
          options: ["`D` — the object is a `D`", "`B` — `hello` is not virtual, so the static type `B` decides", "Compile error: `D::hello` needs `override`", "Undefined behaviour"],
          answer: 1,
          explanation: "Without `virtual`, the call is bound at compile time from the static type of `r`, which is `const B&`. `D::hello` merely hides `B::hello`. Add `virtual` in `B` (and `override` in `D`) to get `D`.",
        },
        {
          prompt: "`struct B { void f(); }; struct D : B { void f() override; };` — what happens?",
          options: ["It compiles and `D::f` overrides `B::f`", "Compile error: `override` requires a virtual function in the base to override", "It compiles with a warning", "Undefined behaviour at run time"],
          answer: 1,
          explanation: "`override` makes the compiler check that the function overrides a virtual function in some base. `B::f` is not virtual, so the claim is false and the build fails — exactly the mistake the keyword exists to catch.",
        },
        {
          prompt: `What does this print?
\`\`\`cpp
struct B { virtual void f(int x = 1) const { std::cout << "B" << x; } };
struct D : B { void f(int x = 2) const override { std::cout << "D" << x; } };
int main() {
    D d;
    const B& r = d;
    r.f();
}
\`\`\``,
          options: ["`B1`", "`D2`", "`D1`", "Compile error: an override cannot change a default argument"],
          answer: 2,
          explanation: "The function is chosen dynamically (`D::f`), but the default argument is filled in at the call site from the static type `B`, giving `x = 1`. Changing defaults in an override is legal and is the bug.",
        },
        {
          prompt: `What does this print?
\`\`\`cpp
struct B {
    B() { init(); }
    virtual ~B() = default;
    virtual void init() { std::cout << "B::init"; }
};
struct D : B { void init() override { std::cout << "D::init"; } };
int main() { D d; }
\`\`\``,
          options: ["`D::init`", "`B::init`", "Nothing — virtual calls are disabled in constructors", "Undefined behaviour"],
          answer: 1,
          explanation: "During `B`'s constructor the dynamic type of the object is `B` — the `D` part does not exist yet — so the virtual call resolves to `B::init`. This is well-defined, unlike calling a *pure* virtual function from a constructor.",
        },
        {
          prompt: "Which statement about `final` is correct?",
          options: ["`final` on a class makes all its member functions `const`", "`final` on a virtual function prevents further overriding; on a class it prevents deriving; both are enforced at compile time", "`final` on a function prevents it from being called through a base pointer", "`final` is only a hint and has no effect on compilation"],
          answer: 1,
          explanation: "`void f() final` refuses any override in a further-derived class, and `class X final` refuses any derived class — both as compile errors. The compiler may also devirtualise calls to a `final` function since no override can exist.",
        },
        {
          prompt: "Compared with a non-virtual call, what does a virtual call cost?",
          options: ["A hash-table lookup of the function name at run time", "One indirect call through the class's table of function pointers, and the optimiser usually cannot inline it", "A linear search up the class hierarchy for an override", "Nothing — the compiler resolves it statically"],
          answer: 1,
          explanation: "The compiler emits a load of the object's hidden vptr, a load of the slot for that function, and an indirect call. There is no name lookup at run time. The cost is small but real, and it is why `virtual` is opt-in.",
        },
      ],
    },
    {
      slug: "abstract-classes-and-interfaces",
      file: "03-abstract-classes-and-interfaces.md",
      exercises: [
        {
          title: "A catalogue of shapes",
          prompt: `Write an abstract \`Shape\` with a virtual destructor and three pure virtual functions: \`std::string name() const\`, \`double area() const\` and \`double perimeter() const\`. Derive \`Circle(r)\`, \`Rect(w, h)\` and \`Triangle(a, b, c)\` (Heron's formula: with \`s = (a + b + c) / 2\`, the area is \`sqrt(s (s - a) (s - b) (s - c))\`). Use \`std::numbers::pi\`.

Read shapes until the input ends into a \`std::vector<std::unique_ptr<Shape>>\`, then print each shape through the base interface and a summary. Print every number with \`std::fixed\` and two decimals.

**Input:** lines of \`circle r\`, \`rect w h\` or \`triangle a b c\` (whitespace-separated; the input may be empty).
**Output:** one line per shape, \`<name>: area=<a> perimeter=<p>\`, then \`count=<n> total area=<sum>\`.

\`\`\`text
circle 1
rect 2 3
triangle 3 4 5
\`\`\`
prints
\`\`\`text
circle: area=3.14 perimeter=6.28
rect: area=6.00 perimeter=10.00
triangle: area=6.00 perimeter=12.00
count=3 total area=15.14
\`\`\``,
          starter: String.raw`#include <cmath>
#include <iomanip>
#include <iostream>
#include <memory>
#include <numbers>
#include <string>
#include <vector>

class Shape {
public:
    virtual ~Shape() = default;
    // TODO: three pure virtual functions: name(), area(), perimeter()
};

// TODO: class Circle : public Shape
// TODO: class Rect : public Shape
// TODO: class Triangle : public Shape

int main() {
    std::vector<std::unique_ptr<Shape>> shapes;
    std::string kind;
    while (std::cin >> kind) {
        // TODO: read the numbers for this kind and push_back(std::make_unique<...>(...))
    }
    std::cout << std::fixed << std::setprecision(2);
    double total = 0;
    // TODO: print each shape through the Shape interface and accumulate the area
    std::cout << "count=" << shapes.size() << " total area=" << total << '\n';
    return 0;
}
`,
          solution: String.raw`#include <cmath>
#include <iomanip>
#include <iostream>
#include <memory>
#include <numbers>
#include <string>
#include <vector>

class Shape {
public:
    virtual ~Shape() = default;
    virtual std::string name() const = 0;
    virtual double area() const = 0;
    virtual double perimeter() const = 0;
};

class Circle : public Shape {
public:
    explicit Circle(double r) : r_(r) {}
    std::string name() const override { return "circle"; }
    double area() const override { return std::numbers::pi * r_ * r_; }
    double perimeter() const override { return 2 * std::numbers::pi * r_; }
private:
    double r_;
};

class Rect : public Shape {
public:
    Rect(double w, double h) : w_(w), h_(h) {}
    std::string name() const override { return "rect"; }
    double area() const override { return w_ * h_; }
    double perimeter() const override { return 2 * (w_ + h_); }
private:
    double w_;
    double h_;
};

class Triangle : public Shape {
public:
    Triangle(double a, double b, double c) : a_(a), b_(b), c_(c) {}
    std::string name() const override { return "triangle"; }
    double area() const override {
        const double s = (a_ + b_ + c_) / 2;
        return std::sqrt(s * (s - a_) * (s - b_) * (s - c_));
    }
    double perimeter() const override { return a_ + b_ + c_; }
private:
    double a_;
    double b_;
    double c_;
};

int main() {
    std::vector<std::unique_ptr<Shape>> shapes;
    std::string kind;
    while (std::cin >> kind) {
        if (kind == "circle") {
            double r = 0;
            std::cin >> r;
            shapes.push_back(std::make_unique<Circle>(r));
        } else if (kind == "rect") {
            double w = 0, h = 0;
            std::cin >> w >> h;
            shapes.push_back(std::make_unique<Rect>(w, h));
        } else if (kind == "triangle") {
            double a = 0, b = 0, c = 0;
            std::cin >> a >> b >> c;
            shapes.push_back(std::make_unique<Triangle>(a, b, c));
        }
    }
    std::cout << std::fixed << std::setprecision(2);
    double total = 0;
    for (const auto& s : shapes) {
        std::cout << s->name() << ": area=" << s->area() << " perimeter=" << s->perimeter() << '\n';
        total += s->area();
    }
    std::cout << "count=" << shapes.size() << " total area=" << total << '\n';
    return 0;
}
`,
          hints: [
            "A pure virtual function is declared `virtual double area() const = 0;` — no body in Shape.",
            "`shapes.push_back(std::make_unique<Circle>(r))` works because `unique_ptr<Circle>` converts to `unique_ptr<Shape>`.",
            "Iterate with `for (const auto& s : shapes)` and call through `s->`; a plain `auto s` would try to copy the unique_ptr.",
          ],
          cases: [
            { stdin: "circle 1\nrect 2 3\ntriangle 3 4 5\n", expected: "circle: area=3.14 perimeter=6.28\nrect: area=6.00 perimeter=10.00\ntriangle: area=6.00 perimeter=12.00\ncount=3 total area=15.14\n" },
            { stdin: "rect 1.5 2\ncircle 2.5\n", expected: "rect: area=3.00 perimeter=7.00\ncircle: area=19.63 perimeter=15.71\ncount=2 total area=22.63\n" },
            { stdin: "", expected: "count=0 total area=0.00\n", hidden: true },
            { stdin: "triangle 2 2 2\n", expected: "triangle: area=1.73 perimeter=6.00\ncount=1 total area=1.73\n", hidden: true },
            { stdin: "circle 0.5 circle 0.5\nrect 10 0.1\n", expected: "circle: area=0.79 perimeter=3.14\ncircle: area=0.79 perimeter=3.14\nrect: area=1.00 perimeter=20.20\ncount=3 total area=2.57\n", hidden: true },
          ],
        },
        {
          title: "An encoder pipeline",
          prompt: `Define an interface class \`Encoder\` — a virtual destructor and one pure virtual \`std::string encode(const std::string& text) const\` — and four implementations: \`upper\` (every letter upper-cased), \`lower\`, \`reverse\` (the characters reversed) and \`rot13\` (each letter shifted 13 places within its case; other characters unchanged). Use \`<cctype>\` with the \`unsigned char\` cast.

Build the pipeline named on the first line as a \`std::vector<std::unique_ptr<Encoder>>\` through a factory \`std::unique_ptr<Encoder> makeEncoder(const std::string& name)\` that returns \`nullptr\` for a name it does not know. Then push every remaining line through the pipeline in order.

**Input:** a line of encoder names, then text lines until the input ends.
**Output:** for each unknown name, \`unknown encoder: <name>\` (while building the pipeline); then for each text line, \`<text> -> <encoded>\`.

\`\`\`text
upper rot13
hello world
Abc xyz
\`\`\`
prints
\`\`\`text
hello world -> URYYB JBEYQ
Abc xyz -> NOP KLM
\`\`\``,
          starter: String.raw`#include <cctype>
#include <iostream>
#include <memory>
#include <sstream>
#include <string>
#include <vector>

class Encoder {
public:
    virtual ~Encoder() = default;
    // TODO: pure virtual encode(const std::string&) const
};

// TODO: Upper, Lower, Reverse, Rot13

std::unique_ptr<Encoder> makeEncoder(const std::string& name) {
    // TODO: map the name to an encoder; nullptr when unknown
    (void)name;
    return nullptr;
}

int main() {
    std::string line;
    std::getline(std::cin, line);
    std::istringstream names(line);
    std::vector<std::unique_ptr<Encoder>> pipeline;
    std::string name;
    while (names >> name) {
        // TODO: build the pipeline, reporting unknown names
    }
    while (std::getline(std::cin, line)) {
        // TODO: run the line through every encoder in order and print "<text> -> <encoded>"
    }
    return 0;
}
`,
          solution: String.raw`#include <cctype>
#include <iostream>
#include <memory>
#include <sstream>
#include <string>
#include <vector>

class Encoder {
public:
    virtual ~Encoder() = default;
    virtual std::string encode(const std::string& text) const = 0;
};

class Upper : public Encoder {
public:
    std::string encode(const std::string& text) const override {
        std::string out = text;
        for (char& c : out) c = static_cast<char>(std::toupper(static_cast<unsigned char>(c)));
        return out;
    }
};

class Lower : public Encoder {
public:
    std::string encode(const std::string& text) const override {
        std::string out = text;
        for (char& c : out) c = static_cast<char>(std::tolower(static_cast<unsigned char>(c)));
        return out;
    }
};

class Reverse : public Encoder {
public:
    std::string encode(const std::string& text) const override {
        return std::string(text.rbegin(), text.rend());
    }
};

class Rot13 : public Encoder {
public:
    std::string encode(const std::string& text) const override {
        std::string out = text;
        for (char& c : out) {
            if (c >= 'a' && c <= 'z') c = static_cast<char>('a' + (c - 'a' + 13) % 26);
            else if (c >= 'A' && c <= 'Z') c = static_cast<char>('A' + (c - 'A' + 13) % 26);
        }
        return out;
    }
};

std::unique_ptr<Encoder> makeEncoder(const std::string& name) {
    if (name == "upper") return std::make_unique<Upper>();
    if (name == "lower") return std::make_unique<Lower>();
    if (name == "reverse") return std::make_unique<Reverse>();
    if (name == "rot13") return std::make_unique<Rot13>();
    return nullptr;
}

int main() {
    std::string line;
    std::getline(std::cin, line);
    std::istringstream names(line);
    std::vector<std::unique_ptr<Encoder>> pipeline;
    std::string name;
    while (names >> name) {
        auto encoder = makeEncoder(name);
        if (encoder) pipeline.push_back(std::move(encoder));
        else std::cout << "unknown encoder: " << name << '\n';
    }
    while (std::getline(std::cin, line)) {
        std::string out = line;
        for (const auto& e : pipeline) out = e->encode(out);
        std::cout << line << " -> " << out << '\n';
    }
    return 0;
}
`,
          hints: [
            "The factory returns `std::unique_ptr<Encoder>`; `return std::make_unique<Upper>();` converts, and `return nullptr;` is the unknown case.",
            "A `unique_ptr` cannot be copied into the vector — `pipeline.push_back(std::move(encoder))` after checking it is not null.",
            "Rot13 on a lowercase letter: `'a' + (c - 'a' + 13) % 26`; test both ranges separately and leave everything else alone.",
          ],
          cases: [
            { stdin: "upper rot13\nhello world\nAbc xyz\n", expected: "hello world -> URYYB JBEYQ\nAbc xyz -> NOP KLM\n" },
            { stdin: "reverse lower\nStressed\n", expected: "Stressed -> desserts\n" },
            { stdin: "rot13 rot13\nRound trip 42!\n", expected: "Round trip 42! -> Round trip 42!\n", hidden: true },
            { stdin: "upper base64 reverse\nabc\n", expected: "unknown encoder: base64\nabc -> CBA\n", hidden: true },
            { stdin: "\nunchanged text\n", expected: "unchanged text -> unchanged text\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "`class Shape { public: virtual double area() const = 0; };` and then `Shape s;`. What happens?",
          options: ["It compiles; `s.area()` returns 0", "It compiles; `s.area()` throws at run time", "Compile error: cannot declare a variable of abstract type `Shape`", "Undefined behaviour"],
          answer: 2,
          explanation: "A class with a pure virtual function is abstract and no object of it can be created, by value or with `new`. References and pointers to `Shape` are fine — that is how the type is used.",
        },
        {
          prompt: "`Shape` has two pure virtual functions. `class Circle : public Shape` overrides only one of them. Which is true?",
          options: ["`Circle` is concrete; the missing function defaults to the base's", "`Circle` is still abstract; creating a `Circle` is a compile error naming the missing function", "`Circle` compiles and the missing function returns 0", "It is a compile error at the class definition"],
          answer: 1,
          explanation: "Abstractness is inherited until every pure virtual function has been overridden. The class definition itself is fine — abstract intermediate classes are common — but instantiating `Circle` fails, and the message lists the unoverridden function.",
        },
        {
          prompt: "Can a pure virtual function have a body?",
          options: ["No — `= 0` means there is no implementation anywhere", "Yes, defined outside the class; derived classes can call it as `Base::f()`, and the class remains abstract", "Yes, and then the class is no longer abstract", "Only for destructors"],
          answer: 1,
          explanation: "`= 0` says derived classes must override; it does not forbid a definition. `double Shape::area() const { … }` can be supplied and called by name. The common case is a pure virtual destructor, which must have a body because it is always called.",
        },
        {
          prompt: "Which describes an *interface class* in C++?",
          options: ["A class with only `static` functions", "An abstract class with pure virtual functions, a virtual destructor and no data members", "Any class declared with the `struct` keyword", "A class template with no member functions"],
          answer: 1,
          explanation: "C++ has no `interface` keyword; the convention is an abstract class that promises behaviour and nothing about representation. A class may implement several by multiple inheritance, safely, because interfaces carry no state.",
        },
        {
          prompt: "`std::vector<std::unique_ptr<Shape>> v; v.push_back(std::make_unique<Circle>(1.0));` — does this compile?",
          options: ["No: `unique_ptr<Circle>` and `unique_ptr<Shape>` are unrelated types", "Yes: `unique_ptr<Circle>` converts implicitly to `unique_ptr<Shape>` because `Circle*` converts to `Shape*`", "Only with an explicit `static_cast`", "Only if `Shape` is not abstract"],
          answer: 1,
          explanation: "`std::unique_ptr` has a converting move constructor for any pointer type that converts implicitly, so the upcast carries through the smart pointer. The temporary is moved into the vector; ownership transfers.",
        },
        {
          prompt: "Why is `std::vector<Shape>` the wrong container for a mixed collection of shapes?",
          options: ["Vectors cannot hold class types with virtual functions", "`Shape` is abstract so no element can exist — and even for a concrete base, each element would be a copy holding only the base part", "It would work but be slower than `std::vector<std::unique_ptr<Shape>>`", "It compiles only if `Shape` has a default constructor"],
          answer: 1,
          explanation: "The element type must be complete and constructible, which an abstract class is not. For a concrete base the vector compiles but slices every derived object pushed into it (lesson 4). Polymorphism needs indirection: `unique_ptr<Shape>` elements.",
        },
      ],
    },
    {
      slug: "virtual-destructors-and-slicing",
      file: "04-virtual-destructors-and-slicing.md",
      exercises: [
        {
          title: "Sliced",
          prompt: `Write \`Employee(name, salary)\` with a virtual destructor, \`virtual std::string role() const\` returning \`employee\` and \`virtual long long bonus() const\` returning \`salary / 10\`, plus a non-virtual \`name()\` accessor. Write \`Manager(name, salary, reports)\` overriding \`role\` (\`manager\`) and \`bonus\` (\`salary / 5 + 100 * reports\`).

Then write two functions that print \`<role>/<bonus>\` for what they receive: \`std::string byValue(Employee e)\` and \`std::string byRef(const Employee& e)\`. Call both with each object. Finally push every object into a \`std::vector<Employee>\` and print the roles it holds. The program demonstrates slicing on purpose; the output shows where the derived part survives and where it is lost.

**Input:** \`n\`, then \`n\` lines of \`employee name salary\` or \`manager name salary reports\`.
**Output:** \`n\` lines of \`<name>: by-value=<role>/<bonus> by-ref=<role>/<bonus>\`, then \`vector<Employee>: <name>=<role> ...\`.

\`\`\`text
2
manager bob 5000 3
employee ann 3000
\`\`\`
prints
\`\`\`text
bob: by-value=employee/500 by-ref=manager/1300
ann: by-value=employee/300 by-ref=employee/300
vector<Employee>: bob=employee ann=employee
\`\`\``,
          starter: String.raw`#include <iostream>
#include <string>
#include <vector>

class Employee {
public:
    Employee(std::string name, long long salary) : name_(std::move(name)), salary_(salary) {}
    virtual ~Employee() = default;
    // TODO: virtual role() -> "employee", virtual bonus() -> salary_ / 10, name() accessor
protected:
    std::string name_;
    long long salary_;
};

// TODO: class Manager : public Employee — role() "manager", bonus() salary_ / 5 + 100 * reports

std::string byValue(Employee e) {
    // TODO: e.role() + "/" + std::to_string(e.bonus())
    (void)e;
    return "";
}

std::string byRef(const Employee& e) {
    // TODO
    (void)e;
    return "";
}

int main() {
    int n = 0;
    std::cin >> n;
    std::vector<Employee> sliced;
    for (int i = 0; i < n; ++i) {
        std::string kind, name;
        long long salary = 0;
        std::cin >> kind >> name >> salary;
        // TODO: build the object, print the two calls, push it into sliced
    }
    std::cout << "vector<Employee>:";
    // TODO: print " <name>=<role>" for each element
    std::cout << '\n';
    return 0;
}
`,
          solution: String.raw`#include <iostream>
#include <string>
#include <vector>

class Employee {
public:
    Employee(std::string name, long long salary) : name_(std::move(name)), salary_(salary) {}
    virtual ~Employee() = default;
    virtual std::string role() const { return "employee"; }
    virtual long long bonus() const { return salary_ / 10; }
    const std::string& name() const { return name_; }
protected:
    std::string name_;
    long long salary_;
};

class Manager : public Employee {
public:
    Manager(std::string name, long long salary, int reports)
        : Employee(std::move(name), salary), reports_(reports) {}
    std::string role() const override { return "manager"; }
    long long bonus() const override { return salary_ / 5 + 100LL * reports_; }
private:
    int reports_;
};

std::string byValue(Employee e) {                 // copies the Employee part only: sliced
    return e.role() + "/" + std::to_string(e.bonus());
}

std::string byRef(const Employee& e) {            // refers to the whole object: dispatches
    return e.role() + "/" + std::to_string(e.bonus());
}

int main() {
    int n = 0;
    std::cin >> n;
    std::vector<Employee> sliced;
    for (int i = 0; i < n; ++i) {
        std::string kind, name;
        long long salary = 0;
        std::cin >> kind >> name >> salary;
        if (kind == "manager") {
            int reports = 0;
            std::cin >> reports;
            Manager m(name, salary, reports);
            std::cout << name << ": by-value=" << byValue(m) << " by-ref=" << byRef(m) << '\n';
            sliced.push_back(m);                  // copies the Employee subobject
        } else {
            Employee e(name, salary);
            std::cout << name << ": by-value=" << byValue(e) << " by-ref=" << byRef(e) << '\n';
            sliced.push_back(e);
        }
    }
    std::cout << "vector<Employee>:";
    for (const auto& e : sliced) std::cout << ' ' << e.name() << '=' << e.role();
    std::cout << '\n';
    return 0;
}
`,
          hints: [
            "`byValue(Employee e)` copy-constructs an Employee from the Manager's base part, so inside it `e.role()` is `employee` and `e.bonus()` uses the base formula.",
            "`byRef(const Employee&)` binds to the Manager itself; the dynamic type is Manager and both virtual calls dispatch.",
            "`sliced.push_back(m)` copies through `const Employee&` — every element is an Employee, whatever went in.",
          ],
          cases: [
            { stdin: "2\nmanager bob 5000 3\nemployee ann 3000\n", expected: "bob: by-value=employee/500 by-ref=manager/1300\nann: by-value=employee/300 by-ref=employee/300\nvector<Employee>: bob=employee ann=employee\n" },
            { stdin: "1\nmanager cy 999 0\n", expected: "cy: by-value=employee/99 by-ref=manager/199\nvector<Employee>: cy=employee\n" },
            { stdin: "3\nemployee di 1234\nmanager ed 10 7\nemployee fay 0\n", expected: "di: by-value=employee/123 by-ref=employee/123\ned: by-value=employee/1 by-ref=manager/702\nfay: by-value=employee/0 by-ref=employee/0\nvector<Employee>: di=employee ed=employee fay=employee\n", hidden: true },
            { stdin: "0\n", expected: "vector<Employee>:\n", hidden: true },
          ],
        },
        {
          title: "Release in reverse",
          prompt: `Write a \`Resource\` base with a name, a **virtual** destructor, and a static count of live resources (incremented in the constructor, decremented in the destructor). Derive \`File\`, \`Socket\` and \`Lock\`; each constructor prints an opening line and each destructor — marked \`override\`, so it will not compile unless the base destructor is virtual — prints a closing line:

| kind | on construction | on destruction |
| --- | --- | --- |
| \`file\` | \`open file <name>\` | \`close file <name>\` |
| \`socket\` | \`connect socket <name>\` | \`disconnect socket <name>\` |
| \`lock\` | \`acquire lock <name>\` | \`release lock <name>\` |

Hold them in a \`std::vector<std::unique_ptr<Resource>>\`. \`release\` destroys the most recently acquired one (\`pop_back\`) or prints \`nothing to release\`. When the input ends, print \`still held: <count>\`, release everything from the most recent back to the first, then print \`alive: <Resource::alive()>\`.

**Input:** lines of \`file <name>\`, \`socket <name>\`, \`lock <name>\` or \`release\`.
**Output:** the trace as described.

\`\`\`text
file a.txt
socket 8080
lock db
release
socket 9090
\`\`\`
prints
\`\`\`text
open file a.txt
connect socket 8080
acquire lock db
release lock db
connect socket 9090
still held: 3
disconnect socket 9090
disconnect socket 8080
close file a.txt
alive: 0
\`\`\``,
          starter: String.raw`#include <iostream>
#include <memory>
#include <string>
#include <vector>

class Resource {
public:
    explicit Resource(std::string name) : name_(std::move(name)) { ++alive_; }
    // TODO: a virtual destructor that decrements alive_
    const std::string& name() const { return name_; }
    static int alive() { return alive_; }
private:
    std::string name_;
    inline static int alive_ = 0;
};

// TODO: File, Socket, Lock — each prints in its constructor and in its destructor (marked override)

int main() {
    std::vector<std::unique_ptr<Resource>> held;
    std::string command;
    while (std::cin >> command) {
        // TODO: release -> pop_back or "nothing to release"; otherwise read the name and acquire
    }
    std::cout << "still held: " << held.size() << '\n';
    // TODO: release everything, most recent first
    std::cout << "alive: " << Resource::alive() << '\n';
    return 0;
}
`,
          solution: String.raw`#include <iostream>
#include <memory>
#include <string>
#include <vector>

class Resource {
public:
    explicit Resource(std::string name) : name_(std::move(name)) { ++alive_; }
    virtual ~Resource() { --alive_; }             // virtual: deleted through unique_ptr<Resource>
    const std::string& name() const { return name_; }
    static int alive() { return alive_; }
private:
    std::string name_;
    inline static int alive_ = 0;
};

class File : public Resource {
public:
    explicit File(const std::string& name) : Resource(name) { std::cout << "open file " << name << '\n'; }
    ~File() override { std::cout << "close file " << name() << '\n'; }
};

class Socket : public Resource {
public:
    explicit Socket(const std::string& name) : Resource(name) { std::cout << "connect socket " << name << '\n'; }
    ~Socket() override { std::cout << "disconnect socket " << name() << '\n'; }
};

class Lock : public Resource {
public:
    explicit Lock(const std::string& name) : Resource(name) { std::cout << "acquire lock " << name << '\n'; }
    ~Lock() override { std::cout << "release lock " << name() << '\n'; }
};

int main() {
    std::vector<std::unique_ptr<Resource>> held;
    std::string command;
    while (std::cin >> command) {
        if (command == "release") {
            if (held.empty()) std::cout << "nothing to release\n";
            else held.pop_back();                 // destroys the derived object through Resource*
            continue;
        }
        std::string name;
        std::cin >> name;
        if (command == "file") held.push_back(std::make_unique<File>(name));
        else if (command == "socket") held.push_back(std::make_unique<Socket>(name));
        else if (command == "lock") held.push_back(std::make_unique<Lock>(name));
    }
    std::cout << "still held: " << held.size() << '\n';
    while (!held.empty()) held.pop_back();        // reverse order, one at a time
    std::cout << "alive: " << Resource::alive() << '\n';
    return 0;
}
`,
          hints: [
            "`virtual ~Resource() { --alive_; }` — without `virtual`, `pop_back` on a `unique_ptr<Resource>` would delete through the base and skip the derived destructor.",
            "`~File() override` is allowed on a destructor and doubles as a check that the base destructor is virtual.",
            "A vector does not promise the order in which it destroys its elements, so release with `while (!held.empty()) held.pop_back();` rather than `clear()`.",
          ],
          cases: [
            { stdin: "file a.txt\nsocket 8080\nlock db\nrelease\nsocket 9090\n", expected: "open file a.txt\nconnect socket 8080\nacquire lock db\nrelease lock db\nconnect socket 9090\nstill held: 3\ndisconnect socket 9090\ndisconnect socket 8080\nclose file a.txt\nalive: 0\n" },
            { stdin: "release\nlock m\nrelease\nrelease\n", expected: "nothing to release\nacquire lock m\nrelease lock m\nnothing to release\nstill held: 0\nalive: 0\n" },
            { stdin: "lock x\nlock y\nfile z\n", expected: "acquire lock x\nacquire lock y\nopen file z\nstill held: 3\nclose file z\nrelease lock y\nrelease lock x\nalive: 0\n", hidden: true },
            { stdin: "", expected: "still held: 0\nalive: 0\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "`Base* p = new Derived; delete p;` where `Base` has a non-virtual destructor. What does the standard say?",
          options: ["Both destructors run; nothing is wrong", "Only `~Base` runs, which is fine as long as `Derived` has no members", "The behaviour is undefined — in practice `~Derived` never runs", "Compile error: cannot delete through a base pointer"],
          answer: 2,
          explanation: "Deleting through a pointer to base with a non-virtual destructor is undefined behaviour by the standard. The typical outcome is that only `~Base` runs, leaking whatever `Derived` owned, and sanitizers report a size mismatch. Make `~Base` virtual.",
        },
        {
          prompt: "`std::unique_ptr<Base> p = std::make_unique<Derived>();` — does `Base` need a virtual destructor here?",
          options: ["No — smart pointers always know the real type", "Yes — `unique_ptr<Base>` deletes through a `Base*`, exactly like a raw `delete`", "No — `make_unique` records the deleter", "Only if `Derived` has a destructor of its own"],
          answer: 1,
          explanation: "The default deleter of `unique_ptr<Base>` calls `delete` on a `Base*`, so the same rule applies. `std::shared_ptr` does record the deleter at creation and would survive this, but relying on that is fragile.",
        },
        {
          prompt: `What does this print?
\`\`\`cpp
struct B { virtual std::string name() const { return "B"; } virtual ~B() = default; };
struct D : B { std::string name() const override { return "D"; } };
void show(B b) { std::cout << b.name(); }
int main() { D d; show(d); }
\`\`\``,
          options: ["`D`", "`B`", "Compile error: cannot pass a `D` as a `B`", "Undefined behaviour"],
          answer: 1,
          explanation: "`show` takes `B` by value, so a new `B` is copy-constructed from `d`'s base part — the `D` part is sliced away. The dynamic type of `b` is `B`, and the virtual call finds `B::name`. Take `const B&` to dispatch.",
        },
        {
          prompt: "`std::vector<B> v; D d; v.push_back(d);` — what happens?",
          options: ["Compile error: element type mismatch", "It compiles and stores a sliced copy holding only the `B` part", "It stores a `D` because the vector remembers the dynamic type", "Undefined behaviour"],
          answer: 1,
          explanation: "`push_back(const B&)` accepts `d` by the implicit upcast and copies exactly a `B`. No error, no warning, no polymorphism: every element is a `B`. Use `std::vector<std::unique_ptr<B>>`.",
        },
        {
          prompt: "Core Guideline C.35 says a base class destructor should be…",
          options: ["Always public and virtual", "Either public and virtual, or protected and non-virtual", "Always `= default`", "Private, so nobody can delete the object"],
          answer: 1,
          explanation: "Public and virtual when objects may be deleted through the base; protected and non-virtual when they never are, which prevents the dangerous `delete` at compile time and avoids the vptr. The practical rule: any class with a virtual function gets a virtual destructor.",
        },
        {
          prompt: `What does this print?
\`\`\`cpp
struct B { int x = 1; virtual int get() const { return x; } virtual ~B() = default; };
struct D : B { int y = 2; int get() const override { return x + y; } };
int main() {
    D d1, d2;
    d2.x = 10;
    B& r = d1;
    r = d2;
    std::cout << r.get();
}
\`\`\``,
          options: ["`3`", "`12`", "`10`", "`1`"],
          answer: 1,
          explanation: "`r = d2` runs `B::operator=`, which assigns only the `B` members: `d1.x` becomes 10, `d1.y` stays 2. `r` still refers to `d1`, whose dynamic type is `D`, so `get()` returns 10 + 2. The reference did not slice; the assignment through it did.",
        },
      ],
    },
    {
      slug: "rtti-and-the-vtable",
      file: "05-rtti-and-the-vtable.md",
      exercises: [
        {
          title: "A census by dynamic_cast",
          prompt: `Write a polymorphic \`Node\` base (a virtual destructor is enough to make it polymorphic) and three concrete nodes: \`Text\` holding a line of words with \`int wordCount() const\`, \`Image\` holding a width and height with \`long long pixels() const\`, and \`Link\` holding a URL with \`bool secure() const\` (true when the URL starts with \`https://\`; \`std::string::starts_with\` is C++20).

Read the document into a \`std::vector<std::unique_ptr<Node>>\`. Then take a census with \`dynamic_cast\` on each \`node.get()\`: count each concrete type and total the words, pixels and secure links. This is one of the legitimate uses of the cast — a closed-set count over an interface that has no reason to know about counting.

**Input:** lines of \`text <words...>\`, \`image <w> <h>\` or \`link <url>\` until the input ends.
**Output:** three lines: \`text=<n> words=<total>\`, \`image=<n> pixels=<total>\`, \`link=<n> secure=<n>\`.

\`\`\`text
text the quick brown fox
image 640 480
link https://example.org
text jumps
link http://old.example.org
\`\`\`
prints
\`\`\`text
text=2 words=5
image=1 pixels=307200
link=2 secure=1
\`\`\``,
          starter: String.raw`#include <iostream>
#include <memory>
#include <sstream>
#include <string>
#include <vector>

class Node {
public:
    virtual ~Node() = default;
};

// TODO: Text (wordCount), Image (pixels), Link (secure)

int main() {
    std::vector<std::unique_ptr<Node>> nodes;
    std::string line;
    while (std::getline(std::cin, line)) {
        std::istringstream in(line);
        std::string kind;
        in >> kind;
        // TODO: build the node for this kind; for text, the rest of the line is the words
    }
    int texts = 0, images = 0, links = 0, secure = 0;
    long long words = 0, pixels = 0;
    for (const auto& node : nodes) {
        // TODO: dynamic_cast<const Text*>(node.get()) and so on; count and total
        (void)node;
    }
    std::cout << "text=" << texts << " words=" << words << '\n';
    std::cout << "image=" << images << " pixels=" << pixels << '\n';
    std::cout << "link=" << links << " secure=" << secure << '\n';
    return 0;
}
`,
          solution: String.raw`#include <iostream>
#include <memory>
#include <sstream>
#include <string>
#include <vector>

class Node {
public:
    virtual ~Node() = default;                    // one virtual function makes the type polymorphic
};

class Text : public Node {
public:
    explicit Text(std::string words) : words_(std::move(words)) {}
    int wordCount() const {
        std::istringstream in(words_);
        std::string word;
        int n = 0;
        while (in >> word) ++n;
        return n;
    }
private:
    std::string words_;
};

class Image : public Node {
public:
    Image(int w, int h) : w_(w), h_(h) {}
    long long pixels() const { return 1LL * w_ * h_; }
private:
    int w_;
    int h_;
};

class Link : public Node {
public:
    explicit Link(std::string url) : url_(std::move(url)) {}
    bool secure() const { return url_.starts_with("https://"); }
private:
    std::string url_;
};

int main() {
    std::vector<std::unique_ptr<Node>> nodes;
    std::string line;
    while (std::getline(std::cin, line)) {
        std::istringstream in(line);
        std::string kind;
        in >> kind;
        if (kind == "text") {
            std::string rest;
            std::getline(in >> std::ws, rest);
            nodes.push_back(std::make_unique<Text>(rest));
        } else if (kind == "image") {
            int w = 0, h = 0;
            in >> w >> h;
            nodes.push_back(std::make_unique<Image>(w, h));
        } else if (kind == "link") {
            std::string url;
            in >> url;
            nodes.push_back(std::make_unique<Link>(url));
        }
    }
    int texts = 0, images = 0, links = 0, secure = 0;
    long long words = 0, pixels = 0;
    for (const auto& node : nodes) {
        if (const auto* t = dynamic_cast<const Text*>(node.get())) {
            ++texts;
            words += t->wordCount();
        } else if (const auto* img = dynamic_cast<const Image*>(node.get())) {
            ++images;
            pixels += img->pixels();
        } else if (const auto* l = dynamic_cast<const Link*>(node.get())) {
            ++links;
            if (l->secure()) ++secure;
        }
    }
    std::cout << "text=" << texts << " words=" << words << '\n';
    std::cout << "image=" << images << " pixels=" << pixels << '\n';
    std::cout << "link=" << links << " secure=" << secure << '\n';
    return 0;
}
`,
          hints: [
            "`if (const auto* t = dynamic_cast<const Text*>(node.get()))` binds the pointer and tests it for null in one step.",
            "For a text node, `std::getline(in >> std::ws, rest)` takes the rest of the line after the kind, skipping the leading space.",
            "Multiply width and height as `long long` (`1LL * w_ * h_`) so a large image cannot overflow an int.",
          ],
          cases: [
            { stdin: "text the quick brown fox\nimage 640 480\nlink https://example.org\ntext jumps\nlink http://old.example.org\n", expected: "text=2 words=5\nimage=1 pixels=307200\nlink=2 secure=1\n" },
            { stdin: "image 1920 1080\nimage 1 1\n", expected: "text=0 words=0\nimage=2 pixels=2073601\nlink=0 secure=0\n" },
            { stdin: "text\nlink https://a.b\nlink https://c.d\n", expected: "text=1 words=0\nimage=0 pixels=0\nlink=2 secure=2\n", hidden: true },
            { stdin: "image 100000 100000\ntext one two three four five six\n", expected: "text=1 words=6\nimage=1 pixels=10000000000\nlink=0 secure=0\n", hidden: true },
            { stdin: "", expected: "text=0 words=0\nimage=0 pixels=0\nlink=0 secure=0\n", hidden: true },
          ],
        },
        {
          title: "The same shapes as a variant",
          prompt: `Redo the shape catalogue with **no base class**: three plain structs \`Circle { double r; }\`, \`Rect { double w, h; }\` and \`Square { double side; }\`, each with a \`double area() const\` and a \`const char* name() const\` member. Define \`using Shape = std::variant<Circle, Rect, Square>;\` and hold the input in a \`std::vector<Shape>\`.

Print each shape's name and area using \`std::visit\` with a generic lambda (\`[](const auto& s) { … }\`), count each alternative with \`std::holds_alternative\`, and print the total. Two decimals, \`std::fixed\`; use \`std::numbers::pi\`.

**Input:** \`circle r\`, \`rect w h\` or \`square s\`, whitespace-separated, until the input ends.
**Output:** one line per shape, \`<name>: area=<a>\`; then \`circle=<n> rect=<n> square=<n>\`; then \`total=<sum>\`.

\`\`\`text
circle 1
rect 2 3
square 4
\`\`\`
prints
\`\`\`text
circle: area=3.14
rect: area=6.00
square: area=16.00
circle=1 rect=1 square=1
total=25.14
\`\`\``,
          starter: String.raw`#include <iomanip>
#include <iostream>
#include <numbers>
#include <string>
#include <variant>
#include <vector>

// TODO: struct Circle, Rect, Square — each with area() and name(), no base class

// TODO: using Shape = std::variant<Circle, Rect, Square>;

int main() {
    // TODO: std::vector<Shape> shapes; read the input
    std::cout << std::fixed << std::setprecision(2);
    double total = 0;
    int circles = 0, rects = 0, squares = 0;
    // TODO: for each shape: std::visit for name and area; std::holds_alternative for the counts
    std::cout << "circle=" << circles << " rect=" << rects << " square=" << squares << '\n';
    std::cout << "total=" << total << '\n';
    return 0;
}
`,
          solution: String.raw`#include <iomanip>
#include <iostream>
#include <numbers>
#include <string>
#include <variant>
#include <vector>

struct Circle {
    double r;
    double area() const { return std::numbers::pi * r * r; }
    const char* name() const { return "circle"; }
};

struct Rect {
    double w, h;
    double area() const { return w * h; }
    const char* name() const { return "rect"; }
};

struct Square {
    double side;
    double area() const { return side * side; }
    const char* name() const { return "square"; }
};

using Shape = std::variant<Circle, Rect, Square>;   // a closed set, held by value

int main() {
    std::vector<Shape> shapes;
    std::string kind;
    while (std::cin >> kind) {
        if (kind == "circle") {
            double r = 0;
            std::cin >> r;
            shapes.push_back(Circle{r});
        } else if (kind == "rect") {
            double w = 0, h = 0;
            std::cin >> w >> h;
            shapes.push_back(Rect{w, h});
        } else if (kind == "square") {
            double s = 0;
            std::cin >> s;
            shapes.push_back(Square{s});
        }
    }
    std::cout << std::fixed << std::setprecision(2);
    double total = 0;
    int circles = 0, rects = 0, squares = 0;
    for (const Shape& s : shapes) {
        const double a = std::visit([](const auto& shape) { return shape.area(); }, s);
        const char* name = std::visit([](const auto& shape) { return shape.name(); }, s);
        std::cout << name << ": area=" << a << '\n';
        total += a;
        if (std::holds_alternative<Circle>(s)) ++circles;
        else if (std::holds_alternative<Rect>(s)) ++rects;
        else ++squares;
    }
    std::cout << "circle=" << circles << " rect=" << rects << " square=" << squares << '\n';
    std::cout << "total=" << total << '\n';
    return 0;
}
`,
          hints: [
            "`std::visit([](const auto& shape) { return shape.area(); }, s)` compiles because every alternative has an `area()` returning double.",
            "`shapes.push_back(Circle{r})` — aggregate initialisation; the variant converts from any of its alternatives.",
            "`std::holds_alternative<Circle>(s)` is the closed-set version of a type test; no cast and no base class needed.",
          ],
          cases: [
            { stdin: "circle 1\nrect 2 3\nsquare 4\n", expected: "circle: area=3.14\nrect: area=6.00\nsquare: area=16.00\ncircle=1 rect=1 square=1\ntotal=25.14\n" },
            { stdin: "square 1.5\nsquare 2\n", expected: "square: area=2.25\nsquare: area=4.00\ncircle=0 rect=0 square=2\ntotal=6.25\n" },
            { stdin: "", expected: "circle=0 rect=0 square=0\ntotal=0.00\n", hidden: true },
            { stdin: "rect 0.5 0.5 circle 2\n", expected: "rect: area=0.25\ncircle: area=12.57\ncircle=1 rect=1 square=0\ntotal=12.82\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "`Base* p` points at a `Base` that is not a `Derived`. What does `dynamic_cast<Derived*>(p)` return?",
          options: ["`p` unchanged", "`nullptr`", "It throws `std::bad_cast`", "Undefined behaviour"],
          answer: 1,
          explanation: "The pointer form reports failure with a null pointer, which is why the idiom is `if (auto* d = dynamic_cast<Derived*>(p))`. The reference form has no null to return and throws instead.",
        },
        {
          prompt: "`Base& r` refers to a plain `Base`. What does `dynamic_cast<Derived&>(r)` do?",
          options: ["Returns a reference to a default-constructed `Derived`", "Throws `std::bad_cast`", "Returns a null reference", "Fails to compile: references cannot be cast"],
          answer: 1,
          explanation: "A reference cannot be null, so failure is an exception. Use the reference form when a failed cast is a programming error; use the pointer form and test for null when either outcome is expected.",
        },
        {
          prompt: "`struct P { int v; }; struct Q : P {};` and `P* p = new Q; auto* q = dynamic_cast<Q*>(p);`. What happens?",
          options: ["`q` points at the `Q`", "`q` is `nullptr`", "Compile error: `P` is not polymorphic — it has no virtual functions", "Undefined behaviour"],
          answer: 2,
          explanation: "`dynamic_cast` reads the object's vtable to check the type, so the source type must have at least one virtual function. `P` has none; the compiler rejects the cast. Adding `virtual ~P() = default;` fixes it.",
        },
        {
          prompt: "What does a class pay for having virtual functions, on this platform?",
          options: ["One extra pointer per virtual function in every object", "A hidden 8-byte vptr in every object, plus one vtable per class", "Nothing until `dynamic_cast` is used", "A copy of every virtual function in every object"],
          answer: 1,
          explanation: "Each object of a polymorphic class carries one vptr (8 bytes on x86-64) pointing at the class's single shared vtable. The number of virtual functions changes the vtable's size, not the object's.",
        },
        {
          prompt: "`std::unique_ptr<Node> n = std::make_unique<Image>();` — what is `typeid(*n)`?",
          options: ["`typeid(Node)` — the static type of `*n`", "`typeid(Image)` — the dynamic type, because `Node` is polymorphic", "`typeid(std::unique_ptr<Node>)`", "It does not compile without `-frtti`"],
          answer: 1,
          explanation: "For an expression of polymorphic class type, `typeid` reports the dynamic type. `typeid(n)` without the dereference would be the static type `unique_ptr<Node>`. Compare `type_info` objects with `==`; never print `name()`, which is mangled.",
        },
        {
          prompt: "A function is a chain of `if (dynamic_cast<A*>(p)) … else if (dynamic_cast<B*>(p)) … else if (dynamic_cast<C*>(p)) …`. The best diagnosis is…",
          options: ["Correct use of RTTI; nothing to change", "A virtual function is missing from the base interface — each branch's body belongs in the class it tests for", "It should use `static_cast` for speed", "It should use `typeid` instead"],
          answer: 1,
          explanation: "Asking an object its type and then doing something per type is what dynamic dispatch does automatically and extensibly. A new derived class silently falls off the end of the chain; a pure virtual function would force it to be handled.",
        },
        {
          prompt: "When is `std::variant` + `std::visit` the better choice over a virtual-function hierarchy?",
          options: ["When new types are added frequently by code you do not control", "When the set of types is closed and known up front, and you want value semantics with no heap or vptr", "Whenever performance matters", "Never — `variant` is only for error handling"],
          answer: 1,
          explanation: "A variant lists its alternatives in the type, so adding a type means editing it and every visitor — fine for a fixed set, wrong for a plugin system. In exchange the objects are values, visitors are checked for completeness, and operations are open.",
        },
      ],
    },
    {
      slug: "composition-vs-inheritance",
      file: "06-composition-vs-inheritance.md",
      exercises: [
        {
          title: "A service that owns its logger",
          prompt: `Write \`Logger\` with \`void info(const std::string&)\`, \`void error(const std::string&)\`, a \`const std::vector<std::string>& lines() const\` accessor and \`int infoCount() const\` / \`int errorCount() const\`. Each call appends \`[<n>] INFO <message>\` or \`[<n>] ERROR <message>\`, where \`n\` is the line's 1-based number.

Write \`OrderService\` that **has a** \`Logger\` member (not a base class) and a \`std::map<std::string, int>\` of open orders, exposing the logger through \`const Logger& logger() const\`:

- \`order <item> <qty>\` adds \`qty\` to the item and logs \`order <item> x<qty>\` at INFO.
- \`cancel <item>\` removes the item and logs \`cancel <item>\` at INFO, or logs \`cancel <item>: not found\` at ERROR.
- \`ship\` logs \`ship <orders> orders, <units> units\` at INFO (the number of open items and the sum of their quantities) and clears them.

**Input:** commands until the input ends.
**Output:** every log line, then \`info=<n> error=<n>\`.

\`\`\`text
order pen 3
order ink 1
cancel cup
ship
cancel pen
\`\`\`
prints
\`\`\`text
[1] INFO order pen x3
[2] INFO order ink x1
[3] ERROR cancel cup: not found
[4] INFO ship 2 orders, 4 units
[5] ERROR cancel pen: not found
info=3 error=2
\`\`\``,
          starter: String.raw`#include <iostream>
#include <map>
#include <string>
#include <vector>

class Logger {
public:
    // TODO: info(), error(), lines(), infoCount(), errorCount()
private:
    std::vector<std::string> lines_;
    int info_ = 0;
    int errors_ = 0;
};

class OrderService {
public:
    // TODO: order(), cancel(), ship(), logger()
private:
    Logger logger_;                               // has-a: the service owns its logger
    std::map<std::string, int> open_;
};

int main() {
    OrderService service;
    std::string command;
    while (std::cin >> command) {
        // TODO: dispatch order / cancel / ship
    }
    // TODO: print service.logger().lines(), then the counts
    return 0;
}
`,
          solution: String.raw`#include <iostream>
#include <map>
#include <string>
#include <vector>

class Logger {
public:
    void info(const std::string& message) {
        add("INFO", message);
        ++info_;
    }
    void error(const std::string& message) {
        add("ERROR", message);
        ++errors_;
    }
    const std::vector<std::string>& lines() const { return lines_; }
    int infoCount() const { return info_; }
    int errorCount() const { return errors_; }
private:
    void add(const std::string& level, const std::string& message) {
        lines_.push_back("[" + std::to_string(lines_.size() + 1) + "] " + level + " " + message);
    }
    std::vector<std::string> lines_;
    int info_ = 0;
    int errors_ = 0;
};

class OrderService {
public:
    void order(const std::string& item, int qty) {
        open_[item] += qty;
        logger_.info("order " + item + " x" + std::to_string(qty));
    }
    void cancel(const std::string& item) {
        const auto it = open_.find(item);
        if (it == open_.end()) {
            logger_.error("cancel " + item + ": not found");
            return;
        }
        open_.erase(it);
        logger_.info("cancel " + item);
    }
    void ship() {
        long long units = 0;
        for (const auto& [item, qty] : open_) units += qty;
        logger_.info("ship " + std::to_string(open_.size()) + " orders, " + std::to_string(units) + " units");
        open_.clear();
    }
    const Logger& logger() const { return logger_; }   // delegation: expose the part read-only
private:
    Logger logger_;                               // has-a: the service owns its logger
    std::map<std::string, int> open_;
};

int main() {
    OrderService service;
    std::string command;
    while (std::cin >> command) {
        if (command == "order") {
            std::string item;
            int qty = 0;
            std::cin >> item >> qty;
            service.order(item, qty);
        } else if (command == "cancel") {
            std::string item;
            std::cin >> item;
            service.cancel(item);
        } else if (command == "ship") {
            service.ship();
        }
    }
    for (const auto& line : service.logger().lines()) std::cout << line << '\n';
    std::cout << "info=" << service.logger().infoCount() << " error=" << service.logger().errorCount() << '\n';
    return 0;
}
`,
          hints: [
            "The line number is `lines_.size() + 1` at the moment of appending; keep one private `add(level, message)` both public functions call.",
            "`open_[item] += qty` inserts a zero entry when the item is new and adds to it otherwise; `find` before erasing tells you whether a cancel is valid.",
            "Nothing in OrderService is a Logger — it forwards through `logger_` and exposes it only as `const Logger&`.",
          ],
          cases: [
            { stdin: "order pen 3\norder ink 1\ncancel cup\nship\ncancel pen\n", expected: "[1] INFO order pen x3\n[2] INFO order ink x1\n[3] ERROR cancel cup: not found\n[4] INFO ship 2 orders, 4 units\n[5] ERROR cancel pen: not found\ninfo=3 error=2\n" },
            { stdin: "ship\norder a 2\norder a 5\nship\n", expected: "[1] INFO ship 0 orders, 0 units\n[2] INFO order a x2\n[3] INFO order a x5\n[4] INFO ship 1 orders, 7 units\ninfo=4 error=0\n" },
            { stdin: "order x 1\ncancel x\ncancel x\n", expected: "[1] INFO order x x1\n[2] INFO cancel x\n[3] ERROR cancel x: not found\ninfo=2 error=1\n", hidden: true },
            { stdin: "", expected: "info=0 error=0\n", hidden: true },
          ],
        },
        {
          title: "Undo history from two vectors",
          prompt: `Write \`History\`, a class composed of two \`std::vector<std::string>\` members — \`done_\` and \`undone_\` — and nothing else. It is not a vector and must not derive from one; it exposes exactly:

- \`void apply(const std::string& action)\` — pushes onto \`done_\` and **clears** \`undone_\` (a new action discards the redo trail).
- \`bool canUndo() const\` / \`std::string undo()\` — moves the most recent action from \`done_\` to \`undone_\` and returns it.
- \`bool canRedo() const\` / \`std::string redo()\` — the reverse.
- \`std::string show() const\` — the done actions oldest first, separated by single spaces, or \`(empty)\`.

**Input:** commands until the input ends: \`do <word>\`, \`undo\`, \`redo\`, \`show\`.
**Output:** \`do\` prints nothing; \`undo\` prints \`undo <word>\` or \`nothing to undo\`; \`redo\` prints \`redo <word>\` or \`nothing to redo\`; \`show\` prints the list. At the end print \`undoable=<n> redoable=<n>\`.

\`\`\`text
do type
do bold
undo
show
redo
do italic
redo
show
\`\`\`
prints
\`\`\`text
undo bold
type
redo bold
nothing to redo
type bold italic
undoable=3 redoable=0
\`\`\``,
          starter: String.raw`#include <iostream>
#include <string>
#include <vector>

class History {
public:
    // TODO: apply, canUndo, undo, canRedo, redo, show, plus size accessors for the summary
private:
    std::vector<std::string> done_;
    std::vector<std::string> undone_;
};

int main() {
    History history;
    std::string command;
    while (std::cin >> command) {
        // TODO: do / undo / redo / show
    }
    // TODO: print "undoable=<done count> redoable=<undone count>"
    return 0;
}
`,
          solution: String.raw`#include <iostream>
#include <string>
#include <vector>

class History {
public:
    void apply(const std::string& action) {
        done_.push_back(action);
        undone_.clear();                          // a new action invalidates the redo trail
    }
    bool canUndo() const { return !done_.empty(); }
    std::string undo() {
        std::string action = std::move(done_.back());
        done_.pop_back();
        undone_.push_back(action);
        return action;
    }
    bool canRedo() const { return !undone_.empty(); }
    std::string redo() {
        std::string action = std::move(undone_.back());
        undone_.pop_back();
        done_.push_back(action);
        return action;
    }
    std::string show() const {
        if (done_.empty()) return "(empty)";
        std::string out;
        for (std::size_t i = 0; i < done_.size(); ++i) {
            if (i > 0) out += ' ';
            out += done_[i];
        }
        return out;
    }
    std::size_t undoable() const { return done_.size(); }
    std::size_t redoable() const { return undone_.size(); }
private:
    std::vector<std::string> done_;               // composition: two parts, one invariant
    std::vector<std::string> undone_;
};

int main() {
    History history;
    std::string command;
    while (std::cin >> command) {
        if (command == "do") {
            std::string word;
            std::cin >> word;
            history.apply(word);
        } else if (command == "undo") {
            if (history.canUndo()) std::cout << "undo " << history.undo() << '\n';
            else std::cout << "nothing to undo\n";
        } else if (command == "redo") {
            if (history.canRedo()) std::cout << "redo " << history.redo() << '\n';
            else std::cout << "nothing to redo\n";
        } else if (command == "show") {
            std::cout << history.show() << '\n';
        }
    }
    std::cout << "undoable=" << history.undoable() << " redoable=" << history.redoable() << '\n';
    return 0;
}
`,
          hints: [
            "`undo` moves `done_.back()` to `undone_`: copy or move the string out, `pop_back`, `push_back` on the other side, return it.",
            "The invariant that makes it a history rather than two lists: `apply` clears `undone_`.",
            "Deriving `History` from `std::vector<std::string>` would expose `insert`, `erase` and `clear` to every caller and break that invariant.",
          ],
          cases: [
            { stdin: "do type\ndo bold\nundo\nshow\nredo\ndo italic\nredo\nshow\n", expected: "undo bold\ntype\nredo bold\nnothing to redo\ntype bold italic\nundoable=3 redoable=0\n" },
            { stdin: "undo\nredo\nshow\n", expected: "nothing to undo\nnothing to redo\n(empty)\nundoable=0 redoable=0\n" },
            { stdin: "do a\ndo b\ndo c\nundo\nundo\nundo\nundo\nshow\nredo\nshow\n", expected: "undo c\nundo b\nundo a\nnothing to undo\n(empty)\nredo a\na\nundoable=1 redoable=2\n", hidden: true },
            { stdin: "do x\nundo\ndo y\nredo\nshow\n", expected: "undo x\nnothing to redo\ny\nundoable=1 redoable=0\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "`Square : public Rectangle` with `setWidth` and `setHeight` overridden to keep the sides equal breaks the Liskov substitution principle because…",
          options: ["A square has fewer members than a rectangle", "Code written against `Rectangle` — set width 5, set height 2, expect area 10 — gets a different answer from a `Square`, so a `Square` cannot substitute for a `Rectangle`", "`Square` should have used private inheritance", "Virtual setters are always a design error"],
          answer: 1,
          explanation: "Substitutability is about behaviour, not vocabulary. The base promises that width and height are independent; the derived class cannot keep that promise while keeping its own invariant. Immutable shapes, or no inheritance, resolve it.",
        },
        {
          prompt: "A `Car` needs an `Engine`. Which relationship is right?",
          options: ["`class Car : public Engine` — a car is an engine with extras", "`class Car { Engine engine_; }` — a car has an engine and forwards what it chooses to expose", "`class Car : private Engine` — a car is implemented in terms of an engine", "Either public inheritance or composition; they are equivalent here"],
          answer: 1,
          explanation: "A car cannot stand in for an engine, so it is has-a: a member. Composition also keeps `Engine`'s interface from leaking into `Car` and lets the engine be swapped. Private inheritance is legal but says nothing a member would not say better.",
        },
        {
          prompt: "What does `class Stack : private std::vector<int> { … };` mean?",
          options: ["A `Stack` can be passed wherever a `std::vector<int>&` is expected", "A `Stack` is implemented in terms of a vector; the vector's public interface is private inside `Stack` and invisible to users", "The vector's members are deleted", "It is a compile error: standard containers cannot be base classes"],
          answer: 1,
          explanation: "Private inheritance is composition in inheritance's syntax: no is-a relationship is visible outside the class, and only members `Stack` re-exposes (with `using`) or wraps are callable. A member vector would express the same thing more plainly.",
        },
        {
          prompt: `What happens here?
\`\`\`cpp
struct A { int x = 0; };
struct B : A {};
struct C : A {};
struct D : B, C {};
int main() { D d; d.x = 1; }
\`\`\``,
          options: ["`d.x` is 1; there is one `A`", "Compile error: `d.x` is ambiguous because `D` contains two `A` subobjects", "Undefined behaviour", "`d.x` sets both copies"],
          answer: 1,
          explanation: "Without virtual inheritance each path to `A` brings its own subobject, so `D` has `B::x` and `C::x` and the unqualified name cannot choose. `d.B::x` names one; `struct B : virtual A` and `struct C : virtual A` would share a single `A`.",
        },
        {
          prompt: "With `struct B : virtual A` and `struct C : virtual A` and `struct D : B, C`, which class's constructor initialises the shared `A`?",
          options: ["`B`'s, because it is listed first", "`C`'s, because it is constructed last", "`D`'s — the most derived class constructs virtual bases; the `A(…)` in `B`'s and `C`'s initialiser lists is ignored", "`A` must be default-constructible; nobody may pass arguments"],
          answer: 2,
          explanation: "A virtual base is constructed once, before any non-virtual base, by the most derived class's constructor. This is why virtual inheritance is rare and awkward: every class that might be most-derived has to know how to build `A`.",
        },
        {
          prompt: "When is public inheritance the right tool?",
          options: ["Whenever two classes share some code", "When callers must handle objects through a base interface without knowing the concrete type, and the derived type honours every promise of the base", "When you want to hide some of the base's functions", "When the base class has no virtual functions"],
          answer: 1,
          explanation: "Public inheritance buys dynamic dispatch through an interface and commits you to substitutability. Sharing implementation, hiding members or swapping parts at run time are jobs for composition.",
        },
      ],
    },
    {
      slug: "inheritance-checkpoint",
      file: "07-checkpoint.md",
      kind: "test",
      passMark: 70,
      exercises: [
        {
          title: "Accounts at month end",
          prompt: `Write an abstract \`Account(id, opening)\` with a virtual destructor, a protected \`balance_\`, non-virtual \`deposit\`, \`withdraw\` (returns \`false\` and changes nothing when the amount exceeds the balance), \`id()\` and \`balance()\`, and two pure virtual functions: \`std::string kind() const\` and \`void monthEnd()\`.

- \`Savings(id, opening, ratePercent)\`: \`kind()\` is \`savings\`; \`monthEnd()\` adds \`balance_ * rate / 100\` (integer arithmetic).
- \`Checking(id, opening, minimum, fee)\`: \`kind()\` is \`checking\`; \`monthEnd()\` subtracts \`fee\` when the balance is below \`minimum\`.

Hold the accounts in a \`std::vector<std::unique_ptr<Account>>\` in input order and look them up by id with a linear search.

**Input:** \`n\`, then \`n\` account lines — \`savings <id> <opening> <rate>\` or \`checking <id> <opening> <minimum> <fee>\` — then commands until the input ends: \`deposit <id> <x>\`, \`withdraw <id> <x>\`, \`monthend\`. Ids always exist.
**Output:** \`rejected <id>\` for each refused withdrawal, in order; at the end one line per account in input order: \`<id> <kind> <balance>\`.

\`\`\`text
2
savings s1 1000 5
checking c1 200 500 25
deposit s1 200
withdraw c1 300
monthend
withdraw s1 5000
monthend
\`\`\`
prints
\`\`\`text
rejected c1
rejected s1
s1 savings 1323
c1 checking 150
\`\`\``,
          starter: String.raw`#include <iostream>
#include <memory>
#include <string>
#include <vector>

class Account {
public:
    Account(std::string id, long long opening) : id_(std::move(id)), balance_(opening) {}
    virtual ~Account() = default;
    // TODO: pure virtual kind() and monthEnd(); deposit, withdraw, id(), balance()
protected:
    std::string id_;
    long long balance_;
};

// TODO: Savings and Checking

Account* find(std::vector<std::unique_ptr<Account>>& accounts, const std::string& id) {
    for (auto& a : accounts) {
        (void)a;
        // TODO: return a.get() when the id matches
    }
    (void)id;
    return nullptr;
}

int main() {
    int n = 0;
    std::cin >> n;
    std::vector<std::unique_ptr<Account>> accounts;
    for (int i = 0; i < n; ++i) {
        std::string kind, id;
        long long opening = 0;
        std::cin >> kind >> id >> opening;
        // TODO: read the rest of the line for this kind and push the account
    }
    std::string command;
    while (std::cin >> command) {
        // TODO: deposit / withdraw / monthend
    }
    // TODO: print every account
    return 0;
}
`,
          solution: String.raw`#include <iostream>
#include <memory>
#include <string>
#include <vector>

class Account {
public:
    Account(std::string id, long long opening) : id_(std::move(id)), balance_(opening) {}
    virtual ~Account() = default;
    virtual std::string kind() const = 0;
    virtual void monthEnd() = 0;
    void deposit(long long amount) { balance_ += amount; }
    bool withdraw(long long amount) {
        if (amount > balance_) return false;
        balance_ -= amount;
        return true;
    }
    const std::string& id() const { return id_; }
    long long balance() const { return balance_; }
protected:
    std::string id_;
    long long balance_;
};

class Savings : public Account {
public:
    Savings(std::string id, long long opening, int ratePercent)
        : Account(std::move(id), opening), rate_(ratePercent) {}
    std::string kind() const override { return "savings"; }
    void monthEnd() override { balance_ += balance_ * rate_ / 100; }
private:
    int rate_;
};

class Checking : public Account {
public:
    Checking(std::string id, long long opening, long long minimum, long long fee)
        : Account(std::move(id), opening), minimum_(minimum), fee_(fee) {}
    std::string kind() const override { return "checking"; }
    void monthEnd() override {
        if (balance_ < minimum_) balance_ -= fee_;
    }
private:
    long long minimum_;
    long long fee_;
};

Account* find(std::vector<std::unique_ptr<Account>>& accounts, const std::string& id) {
    for (auto& a : accounts) {
        if (a->id() == id) return a.get();
    }
    return nullptr;
}

int main() {
    int n = 0;
    std::cin >> n;
    std::vector<std::unique_ptr<Account>> accounts;
    for (int i = 0; i < n; ++i) {
        std::string kind, id;
        long long opening = 0;
        std::cin >> kind >> id >> opening;
        if (kind == "savings") {
            int rate = 0;
            std::cin >> rate;
            accounts.push_back(std::make_unique<Savings>(id, opening, rate));
        } else {
            long long minimum = 0, fee = 0;
            std::cin >> minimum >> fee;
            accounts.push_back(std::make_unique<Checking>(id, opening, minimum, fee));
        }
    }
    std::string command;
    while (std::cin >> command) {
        if (command == "monthend") {
            for (auto& a : accounts) a->monthEnd();
            continue;
        }
        std::string id;
        long long amount = 0;
        std::cin >> id >> amount;
        Account* account = find(accounts, id);
        if (!account) continue;
        if (command == "deposit") {
            account->deposit(amount);
        } else if (command == "withdraw") {
            if (!account->withdraw(amount)) std::cout << "rejected " << id << '\n';
        }
    }
    for (const auto& a : accounts) std::cout << a->id() << ' ' << a->kind() << ' ' << a->balance() << '\n';
    return 0;
}
`,
          hints: [
            "Only `kind()` and `monthEnd()` differ per account type; everything else lives once, in the base, and uses the protected balance.",
            "`monthend` has no id — check for it before reading the id and amount that the other commands carry.",
            "`for (auto& a : accounts) a->monthEnd();` dispatches to Savings or Checking through the base pointer.",
          ],
          cases: [
            { stdin: "2\nsavings s1 1000 5\nchecking c1 200 500 25\ndeposit s1 200\nwithdraw c1 300\nmonthend\nwithdraw s1 5000\nmonthend\n", expected: "rejected c1\nrejected s1\ns1 savings 1323\nc1 checking 150\n" },
            { stdin: "1\nchecking main 600 500 25\nwithdraw main 101\nmonthend\nmonthend\n", expected: "main checking 449\n" },
            { stdin: "3\nsavings a 0 10\nsavings b 99 1\nchecking c 0 1 5\nmonthend\nwithdraw c 0\nmonthend\n", expected: "rejected c\na savings 0\nb savings 99\nc checking -10\n", hidden: true },
            { stdin: "2\nsavings big 4000000000 25\nchecking tiny 1 10 1\ndeposit tiny 9\nmonthend\nwithdraw big 5000000001\n", expected: "rejected big\nbig savings 5000000000\ntiny checking 10\n", hidden: true },
          ],
        },
        {
          title: "An expression tree",
          prompt: `Build a tree of polymorphic nodes from a prefix expression and evaluate it.

\`Expr\` is abstract: a virtual destructor, \`virtual long long eval() const = 0\` and \`virtual std::string show() const = 0\`. \`Num\` holds a value. \`Binary\` is an abstract intermediate class holding two \`std::unique_ptr<Expr>\` children; it implements \`eval\` and \`show\` once in terms of two new pure virtual functions, \`char symbol() const\` and \`long long combine(long long a, long long b) const\`, which \`Add\`, \`Sub\` and \`Mul\` supply. \`show\` renders \`(<left> <symbol> <right>)\`.

Write a recursive \`std::unique_ptr<Expr> parse(std::istream& in)\` that reads one token: an operator (\`+\`, \`-\`, \`*\`) parses two sub-expressions; anything else is a number. Parse the left child, **then** the right — in two statements, because C++ does not fix the order in which two arguments of one call are evaluated.

**Input:** one prefix expression per line until the input ends. Numbers fit in \`long long\`; results do too.
**Output:** \`<show()> = <eval()>\` per line.

\`\`\`text
+ 3 * 4 5
- 10 4
7
\`\`\`
prints
\`\`\`text
(3 + (4 * 5)) = 23
(10 - 4) = 6
7 = 7
\`\`\``,
          starter: String.raw`#include <iostream>
#include <memory>
#include <sstream>
#include <string>

class Expr {
public:
    virtual ~Expr() = default;
    virtual long long eval() const = 0;
    virtual std::string show() const = 0;
};

// TODO: Num
// TODO: Binary (abstract) with symbol() and combine() pure virtual; Add, Sub, Mul

std::unique_ptr<Expr> parse(std::istream& in) {
    std::string token;
    in >> token;
    // TODO: operator -> parse left, then right, build the node; otherwise a Num from std::stoll(token)
    (void)token;
    return nullptr;
}

int main() {
    std::string line;
    while (std::getline(std::cin, line)) {
        if (line.empty()) continue;
        std::istringstream in(line);
        auto tree = parse(in);
        if (tree) std::cout << tree->show() << " = " << tree->eval() << '\n';
    }
    return 0;
}
`,
          solution: String.raw`#include <iostream>
#include <memory>
#include <sstream>
#include <string>

class Expr {
public:
    virtual ~Expr() = default;
    virtual long long eval() const = 0;
    virtual std::string show() const = 0;
};

class Num : public Expr {
public:
    explicit Num(long long value) : value_(value) {}
    long long eval() const override { return value_; }
    std::string show() const override { return std::to_string(value_); }
private:
    long long value_;
};

class Binary : public Expr {                       // abstract: symbol() and combine() are pure
public:
    Binary(std::unique_ptr<Expr> left, std::unique_ptr<Expr> right)
        : left_(std::move(left)), right_(std::move(right)) {}
    long long eval() const override { return combine(left_->eval(), right_->eval()); }
    std::string show() const override {
        return "(" + left_->show() + " " + symbol() + " " + right_->show() + ")";
    }
protected:
    virtual char symbol() const = 0;
    virtual long long combine(long long a, long long b) const = 0;
private:
    std::unique_ptr<Expr> left_;
    std::unique_ptr<Expr> right_;
};

class Add : public Binary {
public:
    using Binary::Binary;
protected:
    char symbol() const override { return '+'; }
    long long combine(long long a, long long b) const override { return a + b; }
};

class Sub : public Binary {
public:
    using Binary::Binary;
protected:
    char symbol() const override { return '-'; }
    long long combine(long long a, long long b) const override { return a - b; }
};

class Mul : public Binary {
public:
    using Binary::Binary;
protected:
    char symbol() const override { return '*'; }
    long long combine(long long a, long long b) const override { return a * b; }
};

std::unique_ptr<Expr> parse(std::istream& in) {
    std::string token;
    in >> token;
    if (token == "+" || token == "-" || token == "*") {
        auto left = parse(in);                    // left first, then right: two statements on purpose
        auto right = parse(in);
        if (token == "+") return std::make_unique<Add>(std::move(left), std::move(right));
        if (token == "-") return std::make_unique<Sub>(std::move(left), std::move(right));
        return std::make_unique<Mul>(std::move(left), std::move(right));
    }
    return std::make_unique<Num>(std::stoll(token));
}

int main() {
    std::string line;
    while (std::getline(std::cin, line)) {
        if (line.empty()) continue;
        std::istringstream in(line);
        auto tree = parse(in);
        if (tree) std::cout << tree->show() << " = " << tree->eval() << '\n';
    }
    return 0;
}
`,
          hints: [
            "`using Binary::Binary;` gives Add, Sub and Mul the two-child constructor without repeating it.",
            "A `-` token alone is the operator; `-3` fails the operator test and goes to `std::stoll`, so negative numbers work.",
            "`std::make_unique<Add>(std::move(left), std::move(right))` — the children are unique_ptrs and must be moved in.",
          ],
          cases: [
            { stdin: "+ 3 * 4 5\n- 10 4\n7\n", expected: "(3 + (4 * 5)) = 23\n(10 - 4) = 6\n7 = 7\n" },
            { stdin: "* - 8 2 + 1 1\n", expected: "((8 - 2) * (1 + 1)) = 12\n" },
            { stdin: "- -5 * 3 -2\n+ 0 0\n", expected: "(-5 - (3 * -2)) = 1\n(0 + 0) = 0\n", hidden: true },
            { stdin: "* 1000000000 * 1000000000 3\n", expected: "(1000000000 * (1000000000 * 3)) = 3000000000000000000\n", hidden: true },
            { stdin: "+ + + 1 2 3 4\n", expected: "(((1 + 2) + 3) + 4) = 10\n", hidden: true },
          ],
        },
        {
          title: "Plugins loaded and unloaded",
          prompt: `Write \`Plugin(name)\`: its constructor prints \`register <name>\`, its **virtual** destructor prints \`unregister <name>\`, and \`virtual std::string status() const = 0\` makes it abstract. Derive \`Renderer\` and \`Audio\`; each constructor prints \`<kind> <name> ready\` after the base has printed, each destructor (marked \`override\`) prints \`<kind> <name> stopped\` before the base does, and \`status()\` returns \`renderer <name> drawing\` or \`audio <name> playing\`.

Hold the plugins in a \`std::vector<std::unique_ptr<Plugin>>\`. When the input ends, unload every remaining plugin from the most recent back to the first, then print \`done\`.

**Input:** commands until the input ends: \`load renderer <name>\`, \`load audio <name>\`, \`status\` (one line per loaded plugin, oldest first), \`unload\` (the most recent; prints \`nothing loaded\` when none).
**Output:** the trace.

\`\`\`text
load renderer gl
load audio alsa
status
unload
status
\`\`\`
prints
\`\`\`text
register gl
renderer gl ready
register alsa
audio alsa ready
renderer gl drawing
audio alsa playing
audio alsa stopped
unregister alsa
renderer gl drawing
renderer gl stopped
unregister gl
done
\`\`\``,
          starter: String.raw`#include <iostream>
#include <memory>
#include <string>
#include <vector>

class Plugin {
public:
    explicit Plugin(std::string name) : name_(std::move(name)) {
        // TODO: print "register <name>"
    }
    // TODO: virtual destructor printing "unregister <name>"; pure virtual status()
protected:
    std::string name_;
};

// TODO: Renderer and Audio

int main() {
    std::vector<std::unique_ptr<Plugin>> loaded;
    std::string command;
    while (std::cin >> command) {
        // TODO: load / status / unload
    }
    // TODO: unload everything, most recent first
    std::cout << "done\n";
    return 0;
}
`,
          solution: String.raw`#include <iostream>
#include <memory>
#include <string>
#include <vector>

class Plugin {
public:
    explicit Plugin(std::string name) : name_(std::move(name)) {
        std::cout << "register " << name_ << '\n';
    }
    virtual ~Plugin() { std::cout << "unregister " << name_ << '\n'; }
    virtual std::string status() const = 0;
protected:
    std::string name_;
};

class Renderer : public Plugin {
public:
    explicit Renderer(const std::string& name) : Plugin(name) {
        std::cout << "renderer " << name_ << " ready\n";
    }
    ~Renderer() override { std::cout << "renderer " << name_ << " stopped\n"; }
    std::string status() const override { return "renderer " + name_ + " drawing"; }
};

class Audio : public Plugin {
public:
    explicit Audio(const std::string& name) : Plugin(name) {
        std::cout << "audio " << name_ << " ready\n";
    }
    ~Audio() override { std::cout << "audio " << name_ << " stopped\n"; }
    std::string status() const override { return "audio " + name_ + " playing"; }
};

int main() {
    std::vector<std::unique_ptr<Plugin>> loaded;
    std::string command;
    while (std::cin >> command) {
        if (command == "load") {
            std::string kind, name;
            std::cin >> kind >> name;
            if (kind == "renderer") loaded.push_back(std::make_unique<Renderer>(name));
            else loaded.push_back(std::make_unique<Audio>(name));
        } else if (command == "status") {
            for (const auto& p : loaded) std::cout << p->status() << '\n';
        } else if (command == "unload") {
            if (loaded.empty()) std::cout << "nothing loaded\n";
            else loaded.pop_back();
        }
    }
    while (!loaded.empty()) loaded.pop_back();    // reverse order, through Plugin* — virtual destructor
    std::cout << "done\n";
    return 0;
}
`,
          hints: [
            "The base constructor runs before the derived body, so `register` precedes `ready` without any ordering code; destruction reverses it.",
            "`~Renderer() override` requires `~Plugin` to be virtual — and it must be, since the vector deletes through `Plugin*`.",
            "Unload with `pop_back` in a loop; a vector's `clear` does not promise an order.",
          ],
          cases: [
            { stdin: "load renderer gl\nload audio alsa\nstatus\nunload\nstatus\n", expected: "register gl\nrenderer gl ready\nregister alsa\naudio alsa ready\nrenderer gl drawing\naudio alsa playing\naudio alsa stopped\nunregister alsa\nrenderer gl drawing\nrenderer gl stopped\nunregister gl\ndone\n" },
            { stdin: "unload\nload audio pulse\nunload\nunload\n", expected: "nothing loaded\nregister pulse\naudio pulse ready\naudio pulse stopped\nunregister pulse\nnothing loaded\ndone\n" },
            { stdin: "load audio a\nload renderer b\nload audio c\n", expected: "register a\naudio a ready\nregister b\nrenderer b ready\nregister c\naudio c ready\naudio c stopped\nunregister c\nrenderer b stopped\nunregister b\naudio a stopped\nunregister a\ndone\n", hidden: true },
            { stdin: "status\n", expected: "done\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: `What does this print?
\`\`\`cpp
struct Base { Base() { std::cout << "B"; } ~Base() { std::cout << "b"; } };
struct Part { Part() { std::cout << "P"; } ~Part() { std::cout << "p"; } };
struct Derived : Base {
    Part part;
    Derived() { std::cout << "D"; }
    ~Derived() { std::cout << "d"; }
};
int main() { Derived x; }
\`\`\``,
          options: ["`BPDdpb`", "`PBDbpd`", "`BPDbpd`", "`DPBdpb`"],
          answer: 0,
          explanation: "Construction: base, then members, then body — `B P D`. Destruction is the exact reverse: derived body, members, base — `d p b`.",
        },
        {
          prompt: "`struct B { void f(int); void f(double); }; struct D : B { void f(const std::string&); };` — how do you make all three `f` overloads callable on a `D`?",
          options: ["Nothing is needed; overloads merge across the hierarchy", "Add `using B::f;` inside `D`", "Mark `D::f` as `override`", "Make `B::f` virtual"],
          answer: 1,
          explanation: "A name declared in the derived class hides every base overload of that name. `using B::f;` brings the base overloads into `D`'s scope so all three take part in overload resolution. `override` and `virtual` are about dispatch, not lookup.",
        },
        {
          prompt: "`struct B { virtual void f() const; }; struct D : B { void f() override; };` — what happens?",
          options: ["`D::f` overrides `B::f`", "Compile error: `D::f` is not `const`, so it does not override anything, and `override` reports it", "It compiles; `D::f` hides `B::f`", "It compiles with a warning"],
          answer: 1,
          explanation: "The signatures differ by `const`, so `D::f` would be a new function that hides the base's. Without `override` that compiles silently and the base version keeps running through a `B&`; with `override`, the mismatch is an error.",
        },
        {
          prompt: "`Derived d; Base& r = d;` — what are the static and dynamic types of `r`?",
          options: ["Both `Derived`", "Both `Base`", "Static `Base`, dynamic `Derived`", "Static `Derived`, dynamic `Base`"],
          answer: 2,
          explanation: "The static type is what the reference is declared as; the dynamic type is what it refers to. Non-virtual calls through `r` use `Base`'s functions; virtual calls use `Derived`'s overrides.",
        },
        {
          prompt: "A class declares `virtual double area() const = 0;`. Which is true?",
          options: ["Objects of the class can be created, but `area()` returns 0", "The class is abstract; only references and pointers to it can exist, and derived classes must override `area` to be instantiable", "`= 0` sets the default return value", "The function cannot have a body anywhere"],
          answer: 1,
          explanation: "A pure virtual function makes the class abstract. It may still be given a body outside the class, callable as `Base::area()`, but the class stays abstract and a derived class must override the function before it can be instantiated.",
        },
        {
          prompt: `What does this print?
\`\`\`cpp
struct B {
    B() { std::cout << tag(); }
    virtual ~B() = default;
    virtual char tag() const { return 'B'; }
};
struct D : B { char tag() const override { return 'D'; } };
int main() { D d; }
\`\`\``,
          options: ["`D`", "`B`", "Nothing", "Undefined behaviour"],
          answer: 1,
          explanation: "Inside `B`'s constructor the object's dynamic type is `B` — the vptr points at `B`'s vtable until `D`'s constructor repoints it — so `tag()` resolves to `B::tag`.",
        },
        {
          prompt: "`std::unique_ptr<Base> p = std::make_unique<Derived>();` goes out of scope. `Base` has a non-virtual destructor. Which is true?",
          options: ["Both destructors run", "Undefined behaviour; in practice only `~Base` runs and `Derived`'s members leak", "A compile error", "`unique_ptr` refuses to delete and leaks deliberately"],
          answer: 1,
          explanation: "`unique_ptr<Base>` deletes through a `Base*`, the same operation as a raw `delete`, and the standard makes that undefined without a virtual destructor. Give any class with virtual functions a virtual destructor.",
        },
        {
          prompt: `What does this print?
\`\`\`cpp
struct B { virtual int v() const { return 1; } virtual ~B() = default; };
struct D : B { int v() const override { return 2; } };
int byValue(B b) { return b.v(); }
int byRef(const B& b) { return b.v(); }
int main() { D d; std::cout << byValue(d) << byRef(d); }
\`\`\``,
          options: ["`22`", "`12`", "`11`", "`21`"],
          answer: 1,
          explanation: "`byValue` copies only the `B` part — slicing — so its `b` has dynamic type `B` and `v()` returns 1. `byRef` refers to the `D` itself and dispatches to `D::v`, returning 2.",
        },
        {
          prompt: "`dynamic_cast<Derived&>(baseRef)` when `baseRef` does not refer to a `Derived`…",
          options: ["Returns a null reference", "Throws `std::bad_cast`", "Returns a reference to the base part", "Is undefined behaviour"],
          answer: 1,
          explanation: "References cannot be null, so the reference form signals failure with an exception. The pointer form, `dynamic_cast<Derived*>(basePtr)`, returns `nullptr` instead.",
        },
        {
          prompt: "How does a virtual call reach the right function at run time?",
          options: ["The runtime searches the hierarchy by function name", "Through the object's hidden vptr to its class's vtable, where the function's slot holds the address to call — one indirect call", "The compiler generates a `switch` over all derived classes", "By comparing `typeid` values until one matches"],
          answer: 1,
          explanation: "Each polymorphic class has one vtable; each object carries a vptr to it. The call loads the vptr, loads the slot, and jumps. No names, no searching — and the constructor sets the vptr stage by stage, which is why constructors do not dispatch to derived overrides.",
        },
        {
          prompt: "Why is `Square : public Rectangle` (with `setWidth`/`setHeight`) considered a broken design?",
          options: ["A square needs only one dimension, so it wastes memory", "A `Square` cannot honour `Rectangle`'s promise that width and height change independently, so code written for `Rectangle` computes wrong results with a `Square`", "C++ forbids overriding setters", "Squares should always be implemented as a `std::variant`"],
          answer: 1,
          explanation: "Substitutability is about behaviour. `stretch(Rectangle&)` sets 5 by 2 and expects 10; a `Square` yields 4. Either remove the mutating interface or drop the inheritance.",
        },
        {
          prompt: "`struct A { int x; }; struct B : A {}; struct C : A {}; struct D : B, C {};` — what fixes the ambiguity of `d.x`?",
          options: ["Making `x` `protected`", "Declaring `B` and `C` as `: virtual A` so `D` contains one shared `A`", "Marking `D` as `final`", "Nothing; multiple inheritance always duplicates bases"],
          answer: 1,
          explanation: "Virtual inheritance makes every path to `A` share a single subobject, constructed by the most derived class. Without it `D` holds two `A`s and the unqualified `x` cannot choose between them.",
        },
        {
          prompt: "Which situation calls for `std::variant` + `std::visit` rather than a class hierarchy?",
          options: ["A plugin API where third parties add new types", "A fixed set of five node kinds with many operations over them, held by value in a vector", "Any code that must avoid exceptions", "A hierarchy that needs a virtual destructor"],
          answer: 1,
          explanation: "A closed set with open operations is the variant's shape: alternatives are listed in the type, visitors are checked for completeness, and the values live inline. An open set of types is the hierarchy's shape.",
        },
        {
          prompt: "`std::vector<std::unique_ptr<Shape>> v; v.push_back(std::make_unique<Circle>(2.0));` — why does this compile?",
          options: ["Because `std::vector` accepts any pointer type", "Because `unique_ptr<Circle>` converts implicitly to `unique_ptr<Shape>`, mirroring the `Circle*` to `Shape*` upcast, and the temporary is moved in", "Because `make_unique` returns `unique_ptr<Shape>` when the argument is a shape", "It does not compile without a cast"],
          answer: 1,
          explanation: "`unique_ptr` has a converting move constructor for pointer types that convert implicitly. Ownership of the new `Circle` moves into the vector, which will later delete it through `Shape*` — hence `Shape`'s virtual destructor.",
        },
      ],
    },
  ],
});

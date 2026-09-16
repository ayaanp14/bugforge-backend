import { defineModule } from "../../dsl.js";

export default defineModule(import.meta.url, {
  slug: "prototypes-and-classes",
  title: "Prototypes and classes",
  blurb: "The prototype chain and delegation; constructor functions and the four steps of new; class syntax with fields, private members, accessors and statics; extends and super; property descriptors and the toString/valueOf/toJSON protocols.",
  icon: "tree",
  overview: `JavaScript's object model is one idea — objects delegate to other objects along a prototype chain — dressed in two syntaxes: the constructor functions everything was built with until 2015, and the \`class\` keyword that made the same machinery readable and added the parts it lacked (real private members, fields, static blocks). Knowing the chain is what turns \`class\` from magic into a notation you can predict: why methods are shared, what \`instanceof\` really tests, why a detached method loses \`this\`, and what the four steps of \`new\` are when an interviewer asks you to implement it.

The module opens with the chain itself — \`Object.create\`, lookup and shadowing, the built-in chains, prototype pollution — then the constructor protocol and its factory-function rival. The class lesson covers the whole surface on Node 16, including \`#private\` as a brand and field-initialisation order. Inheritance follows: \`extends\` sets up two chains, \`super()\` must come first, base constructors must not call overridables, and extending \`Error\`/\`Map\`/\`Array\` each has its rules. The last lesson goes under property access — descriptors, freeze/seal, and the protocols (\`toString\`, \`valueOf\`, \`Symbol.toPrimitive\`, \`toJSON\`, \`Symbol.toStringTag\`) that let your class plug into template literals, arithmetic, sorting and JSON.

The exercises build the machinery — a chain resolver, \`new\` by hand, a bank account with private state, a shape hierarchy, a descriptor report, a \`Money\` class that sorts and serialises — and end with an inventory hierarchy, an event emitter and a linked list class.`,
  lessons: [
    {
      slug: "the-prototype-chain",
      file: "01-the-prototype-chain.md",
      exercises: [
        {
          title: "A prototype-chain resolver",
          prompt: `Build objects from commands and resolve lookups the way the engine does. \`def <name> <parent|-> [key value]...\` creates an object with \`Object.create\` (parent \`-\` means a prototype of \`null\`) and assigns the pairs as own properties. \`get <name> <key>\` prints \`<name>.<key> = <value> (own)\` when the property is the object's own, \`(from <owner>)\` naming the prototype that has it, or \`<name>.<key> = undefined\` when nothing on the chain does. \`set <name> <key> <value>\` assigns on that object. \`chain <name>\` prints the chain's names joined by \` -> \`.

Example:
\`\`\`
def animal - eats yes legs 4
def rabbit animal name peter
def baby rabbit
get baby name
get baby eats
set baby eats no
get baby eats
get rabbit eats
get baby wings
chain baby
\`\`\`
→
\`\`\`
baby.name = peter (from rabbit)
baby.eats = yes (from animal)
baby.eats = no (own)
rabbit.eats = yes (from animal)
baby.wings = undefined
baby -> rabbit -> animal
\`\`\`
The \`set\` shadows on \`baby\`; \`rabbit\` and \`animal\` are untouched.`,
          starterFile: "code/chain-walk.starter.js",
          solutionFile: "code/chain-walk.solution.js",
          hints: ["Walk with Object.getPrototypeOf until Object.hasOwn(owner, key) or null.", "Keep a Map from object to name so the owner can be printed."],
          cases: [
            { stdin: "def animal - eats yes legs 4\ndef rabbit animal name peter\ndef baby rabbit\nget baby name\nget baby eats\nset baby eats no\nget baby eats\nget rabbit eats\nget baby wings\nchain baby\n", expected: "baby.name = peter (from rabbit)\nbaby.eats = yes (from animal)\nbaby.eats = no (own)\nrabbit.eats = yes (from animal)\nbaby.wings = undefined\nbaby -> rabbit -> animal\n" },
            { stdin: "def a - x 1\ndef b a\nset b x 2\nget b x\nget a x\nchain a\n", expected: "b.x = 2 (own)\na.x = 1 (own)\na\n", hidden: true },
          ],
        },
        {
          title: "Own versus inherited",
          prompt: `The first line is a JSON prototype, the second a JSON child; the starter creates the child with \`Object.create(proto)\` and copies its own properties on. Print \`keys=<Object.keys(child)>\`, then \`forIn=<every key a for…in loop visits>\`, then for each key in the union (proto keys first, then child keys, no repeats) \`<key>: in=<key in child> own=<Object.hasOwn> value=<child[key]>\`. Finally delete every own property of the child that also exists on the prototype and print \`unshadowed: <key>=<value now read>, ...\` (or \`unshadowed: -\` when nothing was shadowing).

Example: \`{"eats":true,"legs":4}\` then \`{"name":"peter","legs":3}\` →
\`\`\`
keys=name,legs
forIn=name,legs,eats
eats: in=true own=false value=true
legs: in=true own=true value=3
name: in=true own=true value=peter
unshadowed: legs=4
\`\`\``,
          starterFile: "code/own-vs-inherited.starter.js",
          solutionFile: "code/own-vs-inherited.solution.js",
          hints: ["for…in visits inherited enumerable properties after the own ones.", "new Set([...Object.keys(proto), ...Object.keys(child)]) gives the union in the required order."],
          cases: [
            { stdin: "{\"eats\":true,\"legs\":4}\n{\"name\":\"peter\",\"legs\":3}\n", expected: "keys=name,legs\nforIn=name,legs,eats\neats: in=true own=false value=true\nlegs: in=true own=true value=3\nname: in=true own=true value=peter\nunshadowed: legs=4\n" },
            { stdin: "{\"a\":1}\n{\"b\":2}\n", expected: "keys=b\nforIn=b,a\na: in=true own=false value=1\nb: in=true own=true value=2\nunshadowed: -\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "`const child = Object.create(parent); child.x = 1;` — what changed?",
          options: ["`parent.x` is now 1", "Only `child` gained an own property `x`; writes never travel up the chain", "Both objects", "It throws — `child` is empty"],
          answer: 1,
          explanation: "Reads walk the chain; writes create or update an own property on the receiver.",
        },
        {
          prompt: "`\"toString\" in {}` is true because…",
          options: ["Every object has an own `toString`", "The lookup reaches `Object.prototype`, which has `toString`", "`in` always returns true", "`{}` is a string"],
          answer: 1,
          explanation: "`Object.hasOwn({}, \"toString\")` is false; `Object.create(null)` has no `toString` at all.",
        },
        {
          prompt: "`x instanceof F` checks…",
          options: ["`x.constructor === F`", "Whether `F.prototype` appears in `x`'s prototype chain", "`typeof x === F.name`", "Whether `x` was created by `new F`"],
          answer: 1,
          explanation: "Nothing about how `x` was made; `Object.create(F.prototype) instanceof F` is true.",
        },
        {
          prompt: "Why is `Object.create(null)` used for dictionaries keyed by user input?",
          options: ["It is faster", "It has no prototype: no inherited `constructor`/`toString` collisions and no `__proto__` pollution route", "It allows non-string keys", "It is frozen"],
          answer: 1,
          explanation: "`Map` is the other answer; a plain `{}` inherits from `Object.prototype`.",
        },
        {
          prompt: "Adding `Array.prototype.last = …` in application code is discouraged because…",
          options: ["It is a syntax error", "Every array changes globally: collisions with libraries and future standards, and `for…in` starts yielding it", "Arrays are frozen", "It only affects new arrays"],
          answer: 1,
          explanation: "Polyfilling a standard method is the accepted exception.",
        },
      ],
    },
    {
      slug: "constructors-and-new",
      file: "02-constructors-and-new.md",
      exercises: [
        {
          title: "new, by hand",
          prompt: `Implement \`construct(F, ...args)\` without using \`new\`: create an object linked to \`F.prototype\`, call \`F\` with it as \`this\`, and return the object the constructor returned when that is an object (or function), otherwise the created one. The starter has three constructors — \`Point\` (normal), \`Box\` (returns a plain object, which must replace the instance) and \`Prim\` (returns a primitive, which must be ignored) — and prints a comparison against the real \`new\` for each input line \`<Ctor> <numbers>\`.

Example: \`Point 3 4\`, \`Box 5\`, \`Prim 7\` →
\`\`\`
Point(3,4): {"x":3,"y":4} proto=Point instanceof=true matchesNew=true
Box(5): {"side":5,"kind":"box"} proto=Object instanceof=false matchesNew=true
Prim(7): {"n":7} proto=Prim instanceof=true matchesNew=true
\`\`\``,
          starterFile: "code/new-by-hand.starter.js",
          solutionFile: "code/new-by-hand.solution.js",
          hints: ["Object.create(F.prototype) then F.apply(obj, args).", "An object result: result !== null && (typeof result === \"object\" || typeof result === \"function\")."],
          cases: [
            { stdin: "Point 3 4\nBox 5\nPrim 7\n", expected: "Point(3,4): {\"x\":3,\"y\":4} proto=Point instanceof=true matchesNew=true\nBox(5): {\"side\":5,\"kind\":\"box\"} proto=Object instanceof=false matchesNew=true\nPrim(7): {\"n\":7} proto=Prim instanceof=true matchesNew=true\n" },
            { stdin: "Point 0 0\nPrim 1\n", expected: "Point(0,0): {\"x\":0,\"y\":0} proto=Point instanceof=true matchesNew=true\nPrim(1): {\"n\":1} proto=Prim instanceof=true matchesNew=true\n", hidden: true },
          ],
        },
        {
          title: "Factory versus constructor, measured",
          prompt: `The starter builds \`n\` points twice — with \`new Point(x, y)\` (method on the prototype) and with \`makePoint(x, y)\` (method in a closure). Print for each index \`#i: ctor=<dist 2dp> factory=<dist 2dp> equal=<===>\`; then \`instanceof: ctor=<every one instanceof Point> factory=<any instanceof Point>\`; then \`keys: ctor=<Object.keys of the first> factory=<same>\`; then \`methodShared: ctor=<all dist functions identical> factory=<same>\` (print \`n/a\` when fewer than two points); then \`constructor: ctor=<constructor.name> factory=<constructor.name>\` (\`-\` when empty).

Example: \`2 3 4 6 8\` →
\`\`\`
#0: ctor=5.00 factory=5.00 equal=true
#1: ctor=10.00 factory=10.00 equal=true
instanceof: ctor=true factory=false
keys: ctor=x,y factory=x,y,dist
methodShared: ctor=true factory=false
constructor: ctor=Point factory=Object
\`\`\``,
          starterFile: "code/factory-vs-constructor.starter.js",
          solutionFile: "code/factory-vs-constructor.solution.js",
          hints: ["Prototype methods are the same function object on every instance; closure methods are created per call.", "Object.keys lists own enumerable properties — the factory object owns its dist."],
          cases: [
            { stdin: "2 3 4 6 8", expected: "#0: ctor=5.00 factory=5.00 equal=true\n#1: ctor=10.00 factory=10.00 equal=true\ninstanceof: ctor=true factory=false\nkeys: ctor=x,y factory=x,y,dist\nmethodShared: ctor=true factory=false\nconstructor: ctor=Point factory=Object\n" },
            { stdin: "1 5 12", expected: "#0: ctor=13.00 factory=13.00 equal=true\ninstanceof: ctor=true factory=false\nkeys: ctor=x,y factory=x,y,dist\nmethodShared: ctor=n/a factory=n/a\nconstructor: ctor=Point factory=Object\n", hidden: true },
            { stdin: "0", expected: "instanceof: ctor=true factory=false\nkeys: ctor= factory=\nmethodShared: ctor=n/a factory=n/a\nconstructor: ctor=- factory=-\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "The four steps of `new F(a)`:",
          options: ["Copy `F`, call it, return the copy", "Create an object linked to `F.prototype`; call `F` with it as `this`; return `F`'s result if it is an object; otherwise return the created object", "Call `F`, wrap the result in an object", "Create an object, copy `F.prototype`'s properties into it, call `F`"],
          answer: 1,
          explanation: "Step three is why a constructor returning an object discards the instance.",
        },
        {
          prompt: "`function F() { return 5; } new F()` gives…",
          options: ["`5`", "The new instance — a primitive return value is ignored", "`undefined`", "A `TypeError`"],
          answer: 1,
          explanation: "Only an object (or function) return replaces the instance.",
        },
        {
          prompt: "`F.prototype` is…",
          options: ["The prototype of the function `F`", "The object that instances made with `new F` link to as their prototype", "A copy of `Object.prototype`", "Only present on classes"],
          answer: 1,
          explanation: "The prototype of `F` itself is `Function.prototype`; two different links.",
        },
        {
          prompt: "Calling a `class` constructor without `new`…",
          options: ["Works like a function", "Throws a `TypeError`", "Returns `undefined`", "Creates the instance anyway"],
          answer: 1,
          explanation: "A sloppy-mode function constructor would instead set properties on the global object.",
        },
        {
          prompt: "A factory function's advantage over a constructor:",
          options: ["Methods are shared on a prototype", "`instanceof` works", "Closure privacy and no `this` to lose; no `new` to forget", "It is always faster"],
          answer: 2,
          explanation: "The trade: per-object method copies and no `instanceof`.",
        },
      ],
    },
    {
      slug: "class-syntax",
      file: "03-class-syntax.md",
      exercises: [
        {
          title: "A bank account with private state",
          prompt: `Complete \`Account\`: a \`#balance\` private field set from the opening amount, a \`static count\` incremented per instance, a public \`history\` array, \`deposit(amount)\`/\`withdraw(amount)\` that push \`["deposit", amount]\`/\`["withdraw", amount]\` and throw \`RangeError("amount must be positive")\` for non-positive amounts and \`RangeError("insufficient funds in <name>")\` when overdrawn, a \`get balance()\` accessor, and \`toString()\` returning \`<name>: <balance> (<n> transactions)\`. Then run the commands \`open <name> <amount>\`, \`deposit\`, \`withdraw\`, \`show <name>\` (prints \`String(account)\`) and \`count\` (prints \`accounts=<Account.count>\`); print \`error: <message>\` for a thrown error.

Example:
\`\`\`
open ada 100
open bob 20
deposit ada 50
withdraw bob 30
withdraw ada 70
deposit bob -5
show ada
show bob
count
\`\`\`
→
\`\`\`
error: insufficient funds in bob
error: amount must be positive
ada: 80 (2 transactions)
bob: 20 (0 transactions)
accounts=2
\`\`\``,
          starterFile: "code/bank-account.starter.js",
          solutionFile: "code/bank-account.solution.js",
          hints: ["A field initialiser like history = [] runs per instance; #balance is only reachable inside the class body.", "Wrap each command in try/catch and print e.message."],
          cases: [
            { stdin: "open ada 100\nopen bob 20\ndeposit ada 50\nwithdraw bob 30\nwithdraw ada 70\ndeposit bob -5\nshow ada\nshow bob\ncount\n", expected: "error: insufficient funds in bob\nerror: amount must be positive\nada: 80 (2 transactions)\nbob: 20 (0 transactions)\naccounts=2\n" },
            { stdin: "open zed 0\nwithdraw zed 1\ndeposit zed 5\nshow zed\ncount\n", expected: "error: insufficient funds in zed\nzed: 5 (1 transactions)\naccounts=1\n", hidden: true },
          ],
        },
        {
          title: "Accessors that convert and validate",
          prompt: `Write \`Temperature\` with a private \`#celsius\`, \`get\`/\`set celsius\`, \`get\`/\`set fahrenheit\` (the setter converts and reuses the celsius setter), and \`get kelvin\`. Setting anything below −273.15 °C throws \`RangeError("below absolute zero")\` and leaves the value unchanged. Commands: \`c <v>\`, \`f <v>\`, \`show\` → \`C=<1dp> F=<1dp> K=<2dp>\`, \`inspect\` → \`keys=<JSON of Object.keys(t)> json=<JSON.stringify(t)> protoHasCelsius=<Object.hasOwn(Temperature.prototype, "celsius")>\`. Print \`error: <message>\` on a rejected write.

Example: \`c 100\`, \`show\`, \`f 32\`, \`show\`, \`c -300\`, \`show\`, \`inspect\` →
\`\`\`
C=100.0 F=212.0 K=373.15
C=0.0 F=32.0 K=273.15
error: below absolute zero
C=0.0 F=32.0 K=273.15
keys=[] json={} protoHasCelsius=true
\`\`\`
The last line is the lesson: private fields are invisible to \`Object.keys\` and JSON, and accessors live on the prototype.`,
          starterFile: "code/temperature-accessors.starter.js",
          solutionFile: "code/temperature-accessors.solution.js",
          hints: ["set fahrenheit(v) { this.celsius = (v - 32) * 5 / 9; } — the celsius setter validates once for both.", "Accessors defined in a class body are own properties of the prototype."],
          cases: [
            { stdin: "c 100\nshow\nf 32\nshow\nc -300\nshow\ninspect\n", expected: "C=100.0 F=212.0 K=373.15\nC=0.0 F=32.0 K=273.15\nerror: below absolute zero\nC=0.0 F=32.0 K=273.15\nkeys=[] json={} protoHasCelsius=true\n" },
            { stdin: "f 212\nshow\nc 25\nshow\n", expected: "C=100.0 F=212.0 K=373.15\nC=25.0 F=77.0 K=298.15\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "Where does a class method live, and where does a field with an initialiser live?",
          options: ["Both on the instance", "Method on `C.prototype`, field on each instance (initialiser re-evaluated per instance)", "Both on the prototype", "Method on the class object, field on the prototype"],
          answer: 1,
          explanation: "That is why `history = []` is per-instance while a prototype array would be shared.",
        },
        {
          prompt: "`acct.#balance` written outside the class body is…",
          options: ["`undefined`", "A `SyntaxError` — private names are checked at parse time", "A `TypeError` at runtime", "Allowed for subclasses"],
          answer: 1,
          explanation: "Privates are invisible to reflection, JSON and subclasses too.",
        },
        {
          prompt: "`Object.keys(new C())` for `class C { x = 1; m() {} }` is…",
          options: ["`[\"x\", \"m\"]`", "`[\"x\"]` — class methods are non-enumerable and on the prototype", "`[\"m\"]`", "`[]`"],
          answer: 1,
          explanation: "Spread and `JSON.stringify` follow the same rule.",
        },
        {
          prompt: "`new C()` written before the `class C {}` line…",
          options: ["Works — classes hoist like functions", "Throws a `ReferenceError` — the class binding is in its temporal dead zone", "Returns `undefined`", "Creates an empty object"],
          answer: 1,
          explanation: "Function declarations hoist with their body; classes behave like `let`.",
        },
        {
          prompt: "Inside `static create() { return new this(); }`, called as `Sub.create()`, `this` is…",
          options: ["The instance", "`Sub` — in a static method `this` is the class it was called on", "`undefined`", "The base class"],
          answer: 1,
          explanation: "That is what makes static factories work for subclasses.",
        },
      ],
    },
    {
      slug: "inheritance-and-super",
      file: "04-inheritance-and-super.md",
      exercises: [
        {
          title: "A shape hierarchy",
          prompt: `Given \`Shape\` (with \`describe()\` printing \`<name>: area=<2dp> perimeter=<2dp>\`), write \`Circle(r)\`, \`Rect(w, h)\` and \`Square(s) extends Rect\`. \`Circle.describe\` appends \` r=<r>\`, \`Rect.describe\` appends \` <w>x<h>\` — both by calling \`super.describe()\`. A square is a rect named \`square\` built with \`super(s, s, "square")\`. Read one shape per line (\`circle r\`, \`rect w h\`, \`square s\`), print each \`describe()\`, then \`total area=<2dp> shapes=<n> rects=<count instanceof Rect> squares=<count instanceof Square>\`, then \`chain=<constructor names along a Square instance's prototype chain>\`.

Example: \`circle 1\`, \`rect 2 3\`, \`square 4\` →
\`\`\`
circle: area=3.14 perimeter=6.28 r=1
rect: area=6.00 perimeter=10.00 2x3
square: area=16.00 perimeter=16.00 4x4
total area=25.14 shapes=3 rects=2 squares=1
chain=Square -> Rect -> Shape -> Object
\`\`\``,
          starterFile: "code/shapes.starter.js",
          solutionFile: "code/shapes.solution.js",
          hints: ["Give Rect a third constructor parameter name = \"rect\" so Square can pass \"square\" through super.", "Walk Object.getPrototypeOf from the instance and read p.constructor.name until null."],
          cases: [
            { stdin: "circle 1\nrect 2 3\nsquare 4\n", expected: "circle: area=3.14 perimeter=6.28 r=1\nrect: area=6.00 perimeter=10.00 2x3\nsquare: area=16.00 perimeter=16.00 4x4\ntotal area=25.14 shapes=3 rects=2 squares=1\nchain=Square -> Rect -> Shape -> Object\n" },
            { stdin: "square 1\nsquare 2\n", expected: "square: area=1.00 perimeter=4.00 1x1\nsquare: area=4.00 perimeter=8.00 2x2\ntotal area=5.00 shapes=2 rects=2 squares=2\nchain=Square -> Rect -> Shape -> Object\n", hidden: true },
            { stdin: "circle 0.5\n", expected: "circle: area=0.79 perimeter=3.14 r=0.5\ntotal area=0.79 shapes=1 rects=0 squares=0\nchain=Square -> Rect -> Shape -> Object\n", hidden: true },
          ],
        },
        {
          title: "Extending Map, Array and Error",
          prompt: `Write three built-in subclasses. \`DefaultMap extends Map\` takes a \`makeDefault\` function and its \`get\` creates the default for a missing key. \`Stack extends Array\` adds \`peek()\`. \`HttpError extends Error\` takes \`(status, message)\`, sets \`name\` to \`"HttpError"\` and stores \`status\`. Input: line 1 words, line 2 numbers, line 3 a status code and a message. Print \`counts: <word=count sorted by word> instanceofMap=<>\` using the DefaultMap, then \`stack: peek=<> length=<> isArray=<Array.isArray> mapKeepsClass=<stack.map(...) instanceof Stack> doubledPeek=<peek of the doubled stack>\`, then throw the error and print \`<name> <status>: <message> instanceofError=<> stackStartsWithName=<e.stack.startsWith("HttpError")>\`.

Example: \`to be or not to be\` / \`3 1 4 1 5\` / \`404 page not found\` →
\`\`\`
counts: be=2 not=1 or=1 to=2 instanceofMap=true
stack: peek=5 length=5 isArray=true mapKeepsClass=true doubledPeek=10
HttpError 404: page not found instanceofError=true stackStartsWithName=true
\`\`\``,
          starterFile: "code/extend-builtins.starter.js",
          solutionFile: "code/extend-builtins.solution.js",
          hints: ["In DefaultMap.get, call super.get(key) after ensuring the key exists.", "Setting this.name in the Error subclass is what makes the stack trace start with HttpError."],
          cases: [
            { stdin: "to be or not to be\n3 1 4 1 5\n404 page not found\n", expected: "counts: be=2 not=1 or=1 to=2 instanceofMap=true\nstack: peek=5 length=5 isArray=true mapKeepsClass=true doubledPeek=10\nHttpError 404: page not found instanceofError=true stackStartsWithName=true\n" },
            { stdin: "a\n7\n500 boom\n", expected: "counts: a=1 instanceofMap=true\nstack: peek=7 length=1 isArray=true mapKeepsClass=true doubledPeek=14\nHttpError 500: boom instanceofError=true stackStartsWithName=true\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "In a derived class constructor, using `this` before `super()`…",
          options: ["Is fine", "Throws a `ReferenceError` — the base constructor is what creates `this`", "Refers to the parent instance", "Creates a second object"],
          answer: 1,
          explanation: "A derived class without a constructor gets `constructor(...a) { super(...a); }` implicitly.",
        },
        {
          prompt: "A base constructor calls `this.init()`, which the subclass overrides to read a subclass field. The field is…",
          options: ["Initialised", "`undefined` — subclass fields initialise only after `super()` returns", "Frozen", "Inherited from the base"],
          answer: 1,
          explanation: "Design rule: base constructors do not call overridable methods.",
        },
        {
          prompt: "`super.describe()` looks up `describe` on…",
          options: ["`this`'s prototype", "The prototype of the class where the method was written (the home object's parent)", "The base of the whole hierarchy", "The instance itself"],
          answer: 1,
          explanation: "Each `super` call climbs exactly one level from where it was written, so multi-level overrides compose.",
        },
        {
          prompt: "In `class HttpError extends Error`, why set `this.name`?",
          options: ["Otherwise `instanceof` fails", "Otherwise stack traces and `String(err)` say `Error` rather than `HttpError`", "It is required by `super`", "To make it enumerable"],
          answer: 1,
          explanation: "`super(message)` sets the message and captures the stack; the name is yours to set.",
        },
        {
          prompt: "`extends` creates which links?",
          options: ["Only `Sub.prototype → Base.prototype`", "`Sub.prototype → Base.prototype` for instance lookup **and** `Sub → Base` for static lookup", "Only `Sub → Base`", "A copy of the parent's methods"],
          answer: 1,
          explanation: "`Sub.create()` finds an inherited static through the second link.",
        },
      ],
    },
    {
      slug: "descriptors-and-protocols",
      file: "05-descriptors-and-protocols.md",
      exercises: [
        {
          title: "A descriptor report",
          prompt: `Parse a JSON record. Define \`id\` with \`Object.defineProperty\` and only \`{ value: "rec-1" }\` (so it is read-only, hidden and permanent), and \`size\` as an **enumerable getter** returning the number of keys \`Object.keys(this)\` reports. Print \`keys=\`, \`names=\` (\`Object.getOwnPropertyNames\`), \`json=\`; then attempt \`record.id = "other"\` and \`delete record.id\` in \`try\`/\`catch\` and print \`writeId=<changed|TypeError> deleteId=<deleted|TypeError> id=<record.id>\`; then \`descriptor(id)=<JSON of the descriptor>\`; then freeze the record, try adding a property, and print \`frozen=<> add=<added|TypeError> sizeStillComputed=<record.size>\`.

Example: \`{"name":"ada","born":1815}\` →
\`\`\`
keys=name,born,size
names=name,born,id,size
json={"name":"ada","born":1815,"size":3}
writeId=TypeError deleteId=TypeError id=rec-1
descriptor(id)={"value":"rec-1","writable":false,"enumerable":false,"configurable":false}
frozen=true add=TypeError sizeStillComputed=3
\`\`\``,
          starterFile: "code/descriptors.starter.js",
          solutionFile: "code/descriptors.solution.js",
          hints: ["defineProperty defaults every flag to false; pass enumerable: true for the getter.", "The getter counts keys at call time, so size includes itself."],
          cases: [
            { stdin: "{\"name\":\"ada\",\"born\":1815}\n", expected: "keys=name,born,size\nnames=name,born,id,size\njson={\"name\":\"ada\",\"born\":1815,\"size\":3}\nwriteId=TypeError deleteId=TypeError id=rec-1\ndescriptor(id)={\"value\":\"rec-1\",\"writable\":false,\"enumerable\":false,\"configurable\":false}\nfrozen=true add=TypeError sizeStillComputed=3\n" },
            { stdin: "{\"x\":1}\n", expected: "keys=x,size\nnames=x,id,size\njson={\"x\":1,\"size\":2}\nwriteId=TypeError deleteId=TypeError id=rec-1\ndescriptor(id)={\"value\":\"rec-1\",\"writable\":false,\"enumerable\":false,\"configurable\":false}\nfrozen=true add=TypeError sizeStillComputed=2\n", hidden: true },
          ],
        },
        {
          title: "Money that sorts, adds and serialises",
          prompt: `Give \`Money(cents, currency)\` a \`valueOf()\` returning the cents, a \`toString()\` returning \`<amount 2dp> <currency>\`, a \`toJSON()\` returning \`{ amount, currency }\` with amount in units, and \`get [Symbol.toStringTag]()\` returning \`"Money"\`. Read cents values, build the objects, and print: \`template=<a inside a template literal> string=<String(b)>\`; \`plus=<a + 1> minus=<a - b> greater=<a > b>\`; \`sorted=<copies sorted by (x, y) => x - y, as strings joined by " | ">\`; \`json=<JSON.stringify(all)>\`; \`tag=<Object.prototype.toString.call(a)> total=<reduce((s, m) => s + m, 0)>\`.

Example: \`1250 999 100\` →
\`\`\`
template=12.50 USD string=9.99 USD
plus=1251 minus=251 greater=true
sorted=1.00 USD | 9.99 USD | 12.50 USD
json=[{"amount":12.5,"currency":"USD"},{"amount":9.99,"currency":"USD"},{"amount":1,"currency":"USD"}]
tag=[object Money] total=2349
\`\`\`
Template literals take the string hint (\`toString\`); \`+\`, \`-\` and \`>\` take \`valueOf\`.`,
          starterFile: "code/money-protocols.starter.js",
          solutionFile: "code/money-protocols.solution.js",
          hints: ["A number-returning valueOf makes the comparator (x, y) => x - y work on the objects directly.", "JSON.stringify serialises whatever toJSON returns."],
          cases: [
            { stdin: "1250 999 100", expected: "template=12.50 USD string=9.99 USD\nplus=1251 minus=251 greater=true\nsorted=1.00 USD | 9.99 USD | 12.50 USD\njson=[{\"amount\":12.5,\"currency\":\"USD\"},{\"amount\":9.99,\"currency\":\"USD\"},{\"amount\":1,\"currency\":\"USD\"}]\ntag=[object Money] total=2349\n" },
            { stdin: "5 5", expected: "template=0.05 USD string=0.05 USD\nplus=6 minus=0 greater=false\nsorted=0.05 USD | 0.05 USD\njson=[{\"amount\":0.05,\"currency\":\"USD\"},{\"amount\":0.05,\"currency\":\"USD\"}]\ntag=[object Money] total=10\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "`Object.defineProperty(o, \"k\", { value: 1 })` creates a property that is…",
          options: ["Normal — writable, enumerable, configurable", "Read-only, non-enumerable and non-configurable — every unspecified flag defaults to `false`", "Writable but hidden", "A getter"],
          answer: 1,
          explanation: "Properties created by assignment or literals default all three to `true`.",
        },
        {
          prompt: "`${obj}` with no `Symbol.toPrimitive` calls…",
          options: ["`valueOf` then `toString`", "`toString` first (string hint), then `valueOf`", "`toJSON`", "Neither — it prints `[object Object]` always"],
          answer: 1,
          explanation: "`obj + 1` uses the default hint: `valueOf` first.",
        },
        {
          prompt: "`JSON.stringify(x)` when `x` has a `toJSON()` method…",
          options: ["Ignores it", "Serialises whatever `toJSON()` returns instead of `x`", "Calls it only for Dates", "Throws"],
          answer: 1,
          explanation: "That is how `Date` becomes an ISO string and how a class exposes private state on purpose.",
        },
        {
          prompt: "`{ ...objWithGetter }` produces…",
          options: ["A copy with the same getter", "A plain data property holding the getter's current value — spread invokes accessors", "An error", "An empty object"],
          answer: 1,
          explanation: "`Object.defineProperties(target, Object.getOwnPropertyDescriptors(src))` copies accessors intact.",
        },
        {
          prompt: "`Object.seal(o)` versus `Object.freeze(o)`:",
          options: ["Identical", "Sealed: no add/delete but values writable; frozen: no add/delete/write", "Frozen allows adding", "Sealed is deep"],
          answer: 1,
          explanation: "`preventExtensions` only stops additions; all three are shallow.",
        },
      ],
    },
    {
      slug: "prototypes-checkpoint",
      file: "06-checkpoint.md",
      kind: "test",
      passMark: 70,
      exercises: [
        {
          title: "An inventory hierarchy",
          prompt: `Write \`Item(name, price, qty)\` with \`get value()\`, \`isExpired(day)\` (always false), \`describe(day)\` → \`<name> x<qty> @ <price 2dp> = <value 2dp>\` plus \` [expired]\` when expired, and \`toJSON()\` → \`{ name, price, qty }\`; \`PerishableItem extends Item\` adds \`expiresDay\`, \`isExpired(day)\` is \`day > expiresDay\`, and its \`toJSON\` spreads \`super.toJSON()\` plus \`expiresDay\`; \`Inventory\` keeps items in a private \`Map\` by name with \`add\`, \`remove(name)\` (returns the Map's boolean), \`report(day)\` (items sorted by name, then \`total=<sum of non-expired values 2dp> items=<n> expired=<n>\`) and \`toJSON()\` returning the items array. Commands: \`item n p q\`, \`perishable n p q d\`, \`remove n\` (prints \`removed <n>=<bool>\`), \`report d\`, \`json\` (prints \`JSON.stringify(inv)\`).

Example:
\`\`\`
item pen 1.50 10
perishable milk 2.25 4 3
perishable bread 3.00 2 5
report 4
remove pen
remove ghost
json
\`\`\`
→
\`\`\`
bread x2 @ 3.00 = 6.00
milk x4 @ 2.25 = 9.00 [expired]
pen x10 @ 1.50 = 15.00
total=21.00 items=3 expired=1
removed pen=true
removed ghost=false
[{"name":"milk","price":2.25,"qty":4,"expiresDay":3},{"name":"bread","price":3,"qty":2,"expiresDay":5}]
\`\`\``,
          starterFile: "code/inventory.starter.js",
          solutionFile: "code/inventory.solution.js",
          hints: ["Polymorphism does the work: Inventory calls it.isExpired(day) and each class answers for itself.", "JSON.stringify(inv) calls Inventory's toJSON, then each item's toJSON."],
          cases: [
            { stdin: "item pen 1.50 10\nperishable milk 2.25 4 3\nperishable bread 3.00 2 5\nreport 4\nremove pen\nremove ghost\njson\n", expected: "bread x2 @ 3.00 = 6.00\nmilk x4 @ 2.25 = 9.00 [expired]\npen x10 @ 1.50 = 15.00\ntotal=21.00 items=3 expired=1\nremoved pen=true\nremoved ghost=false\n[{\"name\":\"milk\",\"price\":2.25,\"qty\":4,\"expiresDay\":3},{\"name\":\"bread\",\"price\":3,\"qty\":2,\"expiresDay\":5}]\n" },
            { stdin: "perishable yogurt 1.00 3 1\nreport 1\nreport 2\n", expected: "yogurt x3 @ 1.00 = 3.00\ntotal=3.00 items=1 expired=0\nyogurt x3 @ 1.00 = 3.00 [expired]\ntotal=0.00 items=1 expired=1\n", hidden: true },
          ],
        },
        {
          title: "An event emitter",
          prompt: `Implement \`Emitter\` with a private \`Map\` from event name to listener records \`{ id, fn, once }\`: \`on(event, id, fn)\` (returns an unsubscribe function), \`once(event, id, fn)\`, \`off(event, id)\` (returns whether something was removed), \`emit(event, payload)\` (calls every listener registered at the time of the call, in registration order, drops \`once\` listeners after their first call, and returns how many were called) and \`count(event)\`. Script: \`on <event> <id>\` / \`once <event> <id>\` register a listener that prints \`<id>:<event>:<payload>\`; \`off <event> <id>\` prints \`off <event> <id> -> <bool>\`; \`emit <event> <payload>\` prints \`emit <event> -> <n>\` after the listeners ran; \`count <event>\` prints \`count <event> = <n>\`.

Example:
\`\`\`
on save a
on save b
once save c
emit save first
emit save second
off save a
count save
\`\`\`
→
\`\`\`
a:save:first
b:save:first
c:save:first
emit save -> 3
a:save:second
b:save:second
emit save -> 2
off save a -> true
count save = 1
\`\`\``,
          starterFile: "code/emitter.starter.js",
          solutionFile: "code/emitter.solution.js",
          hints: ["Iterate over a copy of the listener array in emit — removing a once listener while iterating the live array skips the next one.", "A private helper #list(event) that creates the array on first use keeps every method short."],
          cases: [
            { stdin: "on save a\non save b\nonce save c\nemit save first\nemit save second\noff save a\noff save zzz\ncount save\nemit save third\ncount load\n", expected: "a:save:first\nb:save:first\nc:save:first\nemit save -> 3\na:save:second\nb:save:second\nemit save -> 2\noff save a -> true\noff save zzz -> false\ncount save = 1\nb:save:third\nemit save -> 1\ncount load = 0\n" },
            { stdin: "once ping x\nemit ping 1\nemit ping 2\ncount ping\n", expected: "x:ping:1\nemit ping -> 1\nemit ping -> 0\ncount ping = 0\n", hidden: true },
          ],
        },
        {
          title: "A linked list class",
          prompt: `Implement \`LinkedList\` over \`Node { value, next }\` with private \`#head\`/\`#size\`: \`get size\`, \`static from(iterable)\`, \`push\`, \`unshift\`, \`insertAt(i, v)\` and \`removeAt(i)\` (both throw \`RangeError("index out of range")\` for bad indices; \`removeAt\` returns the removed value), \`indexOf(v)\` (−1 when absent), \`reverse()\` in place, a generator \`[Symbol.iterator]\` yielding values, and \`toString()\` → \`[v1 -> v2 -> …] size=<n>\` (\`[] size=0\` when empty). Commands: \`push v\`, \`unshift v\`, \`insert i v\`, \`remove i\` (prints \`removed=<v>\`), \`find v\` (prints \`index=<i>\`), \`reverse\`, \`show\` (prints \`String(list)\`), \`sum\` (prints \`sum=<total via the iterator>\`); print \`error: <message>\` for a thrown error.

Example: \`push 1\`, \`push 2\`, \`push 3\`, \`unshift 0\`, \`show\`, \`insert 2 9\`, \`show\`, \`remove 0\`, \`find 9\`, \`reverse\`, \`show\`, \`sum\`, \`remove 10\` →
\`\`\`
[0 -> 1 -> 2 -> 3] size=4
[0 -> 1 -> 9 -> 2 -> 3] size=5
removed=0
index=1
[3 -> 2 -> 9 -> 1] size=4
sum=15
error: index out of range
\`\`\``,
          starterFile: "code/linked-list.starter.js",
          solutionFile: "code/linked-list.solution.js",
          hints: ["push and unshift are insertAt(size, v) and insertAt(0, v); a private #nodeAt(i) walks the chain once.", "*[Symbol.iterator]() { for (let n = this.#head; n; n = n.next) yield n.value; } makes [...list] and for…of work."],
          cases: [
            { stdin: "push 1\npush 2\npush 3\nunshift 0\nshow\ninsert 2 9\nshow\nremove 0\nfind 9\nfind 42\nreverse\nshow\nsum\nremove 10\n", expected: "[0 -> 1 -> 2 -> 3] size=4\n[0 -> 1 -> 9 -> 2 -> 3] size=5\nremoved=0\nindex=1\nindex=-1\n[3 -> 2 -> 9 -> 1] size=4\nsum=15\nerror: index out of range\n" },
            { stdin: "show\nsum\nremove 0\ninsert 1 5\ninsert 0 5\nshow\n", expected: "[] size=0\nsum=0\nerror: index out of range\nerror: index out of range\n[5] size=1\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "`Object.getPrototypeOf(Object.getPrototypeOf([]))` is…",
          options: ["`Array.prototype`", "`Object.prototype`", "`null`", "`Function.prototype`"],
          answer: 1,
          explanation: "Array → `Array.prototype` → `Object.prototype` → `null`.",
        },
        {
          prompt: "`const o = Object.create(null); o.toString()`…",
          options: ["Returns `\"[object Object]\"`", "Throws — the chain is empty, so there is no `toString`", "Returns `\"\"`", "Returns `undefined`"],
          answer: 1,
          explanation: "`o.toString` is `undefined`; calling it is a `TypeError`.",
        },
        {
          prompt: "`function F() { return { a: 1 }; } new F() instanceof F` is…",
          options: ["`true`", "`false` — the returned object replaced the instance and has a plain prototype", "An error", "`undefined`"],
          answer: 1,
          explanation: "Step three of `new`.",
        },
        {
          prompt: "`p.constructor === Point` is `true` because…",
          options: ["Every object stores its constructor", "`p` inherits `constructor` from `Point.prototype`, which was created with it", "`new` sets it on the instance", "It is an own property of `p`"],
          answer: 1,
          explanation: "Replacing `Point.prototype` wholesale loses it unless restored; it is convention, not a type check.",
        },
        {
          prompt: "Arrow-function class fields (`handle = () => {…}`) are used to…",
          options: ["Make methods static", "Bind `this` per instance so the method survives being passed as a callback — at one closure per instance", "Make methods private", "Speed up calls"],
          answer: 1,
          explanation: "A prototype method is shared but loses `this` when detached.",
        },
        {
          prompt: "`#x in obj` (Node 16.4+) tests…",
          options: ["Whether `obj` has any private field", "Whether `obj` carries this class's `#x` brand — the safe \"is this one of ours\" check", "Whether `x` is enumerable", "Nothing — it is a syntax error"],
          answer: 1,
          explanation: "Reading `obj.#x` on a foreign object would throw instead.",
        },
        {
          prompt: "A subclass with no constructor of its own…",
          options: ["Cannot be instantiated", "Gets `constructor(...args) { super(...args); }` implicitly", "Skips the base constructor", "Must define fields"],
          answer: 1,
          explanation: "Arguments pass straight through to the parent.",
        },
        {
          prompt: "`class S extends Array {}; S.from([1]).map(x => x) instanceof S` is…",
          options: ["`false`", "`true` — array methods build results through `Symbol.species`, the subclass by default", "An error", "Only in strict mode"],
          answer: 1,
          explanation: "`Array.isArray` is also `true` for the subclass instance.",
        },
        {
          prompt: "Which flag decides whether a property appears in `Object.keys`, spread and `JSON.stringify`?",
          options: ["`writable`", "`enumerable`", "`configurable`", "`value`"],
          answer: 1,
          explanation: "Class methods are non-enumerable, which is why instances serialise to their fields only.",
        },
        {
          prompt: "`date1 - date2` gives milliseconds but `${date1}` gives readable text because…",
          options: ["Dates are strings", "`-` takes the number hint (`valueOf`) and template literals the string hint (`toString`)", "Subtraction calls `toJSON`", "It is special-cased in the engine"],
          answer: 1,
          explanation: "`Date` is the one built-in whose default hint acts like string, so `date + 1` concatenates.",
        },
        {
          prompt: "When does `JSON.stringify` omit a property entirely?",
          options: ["When the value is `null`", "When the value is `undefined`, a function, or `toJSON` returns `undefined` — and always for non-enumerable and private members", "Never", "When the key starts with `_`"],
          answer: 1,
          explanation: "`null` and `NaN` (as `null`) are kept.",
        },
        {
          prompt: "Composition is preferred over inheritance when…",
          options: ["Never — inheritance is always cleaner", "The relationship is not a genuine is-a, the hierarchy would grow deep, or you only want to reuse a utility method", "The class has fields", "The language forbids `extends`"],
          answer: 1,
          explanation: "Extend for shallow, genuine is-a relationships; otherwise hold an instance and delegate.",
        },
      ],
    },
  ],
});

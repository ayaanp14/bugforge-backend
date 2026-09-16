import { defineModule } from "../../dsl.js";

export default defineModule(import.meta.url, {
  slug: "performance-and-memory",
  title: "Performance and memory",
  blurb: "How V8 runs code — tiers, hidden classes, inline caches, elements kinds; benchmarks that lie and profiles that do not; reachability, the generational collector and the leak catalogue; the habits that survive measurement; server latency at the percentile, round trips, caches, pools and event-loop lag.",
  icon: "memory",
  overview: `Performance work in JavaScript is mostly about not fooling yourself: the engine optimises on assumptions you can keep or break without noticing, a naive benchmark measures the wrong thing, the garbage collector frees only what you stopped referencing, and a server is slow for reasons a CPU profile never shows. This module gives you the model behind each of those — enough to predict, measure and fix rather than guess.

The first lesson follows a function through V8's tiers and explains hidden classes, inline caches and elements kinds — what keeps hot code fast and what deoptimises it. The second is about measuring: monotonic clocks, the six ways a benchmark lies, reading distributions with percentiles, profiling with flame charts, and checking complexity before constants. The third covers memory: reachability, the young and old generations, scavenges and promotion, the eight leak patterns and the heap-snapshot workflow that finds them. The fourth is the short list of techniques that survive measurement — and the folklore that does not. The fifth moves to the server: latency budgets at p95/p99, the round-trip arithmetic of sequential awaits, caching layers and single-flight, pools and backpressure, event-loop lag, load testing to the knee.

Timings differ on every machine, so the exercises model the rules instead: a shape tracker and an elements-kinds tracer, a benchmark statistics tool and a complexity fitter, a reachability collector and a leak detective, a comparison counter and a typed-array lab, a percentile/SLO report and an LRU cache simulator — then a hidden-class and inline-cache simulator, a generational collector with promotion and a remembered set, and a request-trace analyser with per-route percentiles, SLO burn and N+1 suspects.`,
  lessons: [
    {
      slug: "how-v8-runs-your-code",
      file: "01-how-v8-runs-your-code.md",
      exercises: [
        {
          title: "A hidden-class tracker",
          prompt: `Model V8's transition tree. Each input line is either \`<name>: <prop> <prop> …\` — an object built by adding those properties in that order — or \`site <name> <obj> <obj> …\` — a property-access site and the objects it has seen. Every object starts at shape \`S0\`; adding property \`p\` to shape \`S\` follows the transition \`S --p-->\` to an existing shape if that transition was taken before, or creates the next \`S<n>\`. A token \`-<prop>\` deletes the property: the object drops to its own dictionary shape, printed \`DICT(<name>)\`. Print each object as \`<name>: <shape> (<props comma-joined>)\` (\`<dictionary>\` for a dictionary object), then \`distinct shapes=<n> transitions=<n>\`, then each site as \`site <name>: <monomorphic|polymorphic|megamorphic> (<n> shape[s])\` — one shape, two to four, more than four.

Example →
\`\`\`
p1: S2 (x,y)
p2: S2 (x,y)
p3: S4 (y,x)
…
distinct shapes=5 transitions=5
site readX: monomorphic (1 shape)
site readXY: polymorphic (2 shapes)
site mixed: megamorphic (5 shapes)
\`\`\`
\`p3\` added the same two properties in the other order and got a different shape — order is part of the hidden class.`,
          starterFile: "code/shape-tracker.starter.js",
          solutionFile: "code/shape-tracker.solution.js",
          hints: ["Key the transition map by `shape + \"|\" + prop`; a shape's property list is its parent's list plus the new property.", "A dictionary object gets a unique shape id so it can never be shared."],
          cases: [
            { stdin: "p1: x y\np2: x y\np3: y x\np4: x y z\np5: x\np6: x y -x\nsite readX p1 p2\nsite readXY p1 p3\nsite mixed p1 p3 p4 p5 p6\nsite dict p6\n", expected: "p1: S2 (x,y)\np2: S2 (x,y)\np3: S4 (y,x)\np4: S5 (x,y,z)\np5: S1 (x)\np6: DICT(p6) (<dictionary>)\ndistinct shapes=5 transitions=5\nsite readX: monomorphic (1 shape)\nsite readXY: polymorphic (2 shapes)\nsite mixed: megamorphic (5 shapes)\nsite dict: monomorphic (1 shape)\n" },
            { stdin: "a: id name\nb: id name\nsite s a b\n", expected: "a: S2 (id,name)\nb: S2 (id,name)\ndistinct shapes=1 transitions=2\nsite s: monomorphic (1 shape)\n", hidden: true },
          ],
        },
        {
          title: "Elements-kinds tracer",
          prompt: `Each line is the sequence of values pushed into a fresh array: integers, decimals, \`_\` for a hole (a write past the end), anything else a non-number. Track the array's elements kind starting from \`PACKED_SMI\`: the type part moves \`SMI → DOUBLE → ELEMENTS\` and never back; a hole flips \`PACKED\` to \`HOLEY\` permanently. Print \`[<tokens>] => <kind> -> <kind> …\`, listing a kind only when it changes.

Example: \`2 _ 3.5 x\` → \`[2 _ 3.5 x] => PACKED_SMI -> HOLEY_SMI -> HOLEY_DOUBLE -> HOLEY_ELEMENTS\`; \`1 2 3\` → \`[1 2 3] => PACKED_SMI\`.`,
          starterFile: "code/elements-kinds.starter.js",
          solutionFile: "code/elements-kinds.solution.js",
          hints: ["Split the kind on `_` into packing and type; rank the types 0/1/2 and only ever move up.", "`/^-?\\d+$/` is a small integer, `/^-?\\d+\\.\\d+$/` a double; everything else is an element."],
          cases: [
            { stdin: "1 2 3\n1 2.5 3\n1 _ 3\n1 a\n2 _ 3.5 x\n1.5 1\n", expected: "[1 2 3] => PACKED_SMI\n[1 2.5 3] => PACKED_SMI -> PACKED_DOUBLE\n[1 _ 3] => PACKED_SMI -> HOLEY_SMI\n[1 a] => PACKED_SMI -> PACKED_ELEMENTS\n[2 _ 3.5 x] => PACKED_SMI -> HOLEY_SMI -> HOLEY_DOUBLE -> HOLEY_ELEMENTS\n[1.5 1] => PACKED_SMI -> PACKED_DOUBLE\n" },
            { stdin: "_\nhello\n", expected: "[_] => PACKED_SMI -> HOLEY_SMI\n[hello] => PACKED_SMI -> PACKED_ELEMENTS\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "Where does every function start executing in V8?",
          options: ["In TurboFan, the optimising compiler", "In Ignition, the bytecode interpreter — feedback gathered there decides what gets optimised later", "As native code from the parser", "In a Web Worker"],
          answer: 1,
          explanation: "Interpret first, optimise hot code on feedback, deoptimise on surprise.",
        },
        {
          prompt: "`const a = { x: 1, y: 2 }` and `const b = { y: 2, x: 1 }`…",
          options: ["Share a hidden class", "Have different hidden classes — property order is part of the shape", "Are both dictionary-mode objects", "Cannot both be optimised"],
          answer: 1,
          explanation: "Same properties in the same order share a shape; `delete` drops to dictionary mode.",
        },
        {
          prompt: "A property-access site that has seen six different shapes is…",
          options: ["Monomorphic", "Polymorphic", "Megamorphic — it gives up caching and uses a slow generic lookup", "Deoptimised permanently"],
          answer: 2,
          explanation: "One shape is monomorphic, two to four polymorphic, more is megamorphic.",
        },
        {
          prompt: "`const arr = [1, 2, 3]; arr[10] = 4;` makes the array…",
          options: ["PACKED_SMI still", "HOLEY_SMI — and it never goes back to PACKED", "PACKED_DOUBLE", "A typed array"],
          answer: 1,
          explanation: "Elements kinds transition one way: SMI → DOUBLE → ELEMENTS, PACKED → HOLEY.",
        },
        {
          prompt: "Deoptimisation happens when…",
          options: ["A function is called too often", "An assumption baked into optimised code fails — a new shape or type appears — and execution falls back to the interpreter", "The garbage collector runs", "A `try`/`catch` is entered"],
          answer: 1,
          explanation: "Repeated deopts for the same function eventually make V8 stop optimising it.",
        },
      ],
    },
    {
      slug: "measuring-first",
      file: "02-measuring-first.md",
      exercises: [
        {
          title: "Benchmark statistics",
          prompt: `Line 1 is \`warmup=<k>\`; each following line is \`<name>: <sample> <sample> …\` (milliseconds). Drop the first \`k\` samples of each series (the JIT warm-up), then print \`<name>: n=<> min=<> median=<> mean=<> p95=<> stddev=<> outliers=<>\` with two decimals: p95 by nearest rank, the sample standard deviation, and outliers counted as samples more than \`3 × 1.4826 × MAD\` from the median. If there are two series, compare the second to the first: \`<b> vs <a>: median <±x.xx>% -> <verdict>\` where the verdict is \`not distinguishable (IQRs overlap)\` when the interquartile ranges (p25–p75) overlap, else \`faster\` or \`slower\`.

Example: \`warmup=2\`, \`baseline: 40 25 12.1 12.4 12.0 12.2 12.9 12.3 12.1 30.0 12.2\`, \`candidate: 38 24 11.0 11.2 10.9 11.1 11.3 11.0 11.2 11.1 11.0\` →
\`\`\`
baseline: n=9 min=12.00 median=12.20 mean=14.24 p95=30.00 stddev=5.91 outliers=2
candidate: n=9 min=10.90 median=11.10 mean=11.09 p95=11.30 stddev=0.13 outliers=0
candidate vs baseline: median -9.02% -> faster
\`\`\`
The baseline's mean is dragged to 14.24 by one GC pause; its median tells the truth.`,
          starterFile: "code/benchmark-stats.starter.js",
          solutionFile: "code/benchmark-stats.solution.js",
          hints: ["MAD = median of |x − median|; the 1.4826 factor makes it comparable to a standard deviation.", "IQRs overlap unless one series' p75 is below the other's p25."],
          cases: [
            { stdin: "warmup=2\nbaseline: 40 25 12.1 12.4 12.0 12.2 12.9 12.3 12.1 30.0 12.2\ncandidate: 38 24 11.0 11.2 10.9 11.1 11.3 11.0 11.2 11.1 11.0\n", expected: "baseline: n=9 min=12.00 median=12.20 mean=14.24 p95=30.00 stddev=5.91 outliers=2\ncandidate: n=9 min=10.90 median=11.10 mean=11.09 p95=11.30 stddev=0.13 outliers=0\ncandidate vs baseline: median -9.02% -> faster\n" },
            { stdin: "warmup=1\na: 9 5.0 5.1 4.9 5.2 5.0\nb: 9 5.1 5.0 5.2 4.9 5.1\n", expected: "a: n=5 min=4.90 median=5.00 mean=5.04 p95=5.20 stddev=0.11 outliers=0\nb: n=5 min=4.90 median=5.10 mean=5.06 p95=5.20 stddev=0.11 outliers=0\nb vs a: median +2.00% -> not distinguishable (IQRs overlap)\n", hidden: true },
          ],
        },
        {
          title: "Fit the complexity",
          prompt: `Each line is \`<n> <operations>\` — an operation count measured at input size n. For each model in the starter's table (\`O(1)\`, \`O(log n)\`, \`O(n)\`, \`O(n log n)\`, \`O(n^2)\`) compute \`operations / f(n)\` per point and the coefficient of variation of those ratios (population standard deviation ÷ mean): a perfect fit gives a constant ratio, so the smallest CV wins. Print every model as \`<name padded to 10> cv=<x.xxx>\` sorted ascending, then \`best fit: <name>\`, then \`n x<ratio> -> ops x<ratio>\` from the first to the last point (one decimal).

Example: \`10 100\`, \`20 400\`, \`40 1600\`, \`80 6400\` →
\`\`\`
O(n^2)     cv=0.000
O(n log n) cv=0.527
O(n)       cv=0.715
O(log n)   cv=1.088
O(1)       cv=1.191
best fit: O(n^2)
n x8.0 -> ops x64.0
\`\`\``,
          starterFile: "code/complexity-fit.starter.js",
          solutionFile: "code/complexity-fit.solution.js",
          hints: ["cv = sqrt(mean((x − m)²)) / m over the ratios ops / f(n).", "Sort the [name, cv] pairs by cv; the first is the best fit."],
          cases: [
            { stdin: "100 700\n200 1600\n400 3600\n800 8000\n1600 17600\n", expected: "O(n log n) cv=0.007\nO(n)       cv=0.157\nO(n^2)     cv=0.750\nO(log n)   cv=0.876\nO(1)       cv=0.982\nbest fit: O(n log n)\nn x16.0 -> ops x25.1\n" },
            { stdin: "10 100\n20 400\n40 1600\n80 6400\n", expected: "O(n^2)     cv=0.000\nO(n log n) cv=0.527\nO(n)       cv=0.715\nO(log n)   cv=1.088\nO(1)       cv=1.191\nbest fit: O(n^2)\nn x8.0 -> ops x64.0\n", hidden: true },
            { stdin: "10 7\n100 7\n1000 7\n", expected: "O(1)       cv=0.000\nO(log n)   cv=0.464\nO(n)       cv=1.208\nO(n log n) cv=1.308\nO(n^2)     cv=1.393\nbest fit: O(1)\nn x100.0 -> ops x1.0\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "Which clock should time a duration?",
          options: ["`Date.now()`", "`performance.now()` (or `process.hrtime`) — monotonic and sub-millisecond; `Date.now()` is wall-clock and coarse", "`new Date().getTime()`", "`setTimeout` callbacks"],
          answer: 1,
          explanation: "Wall clocks jump with NTP and DST; monotonic clocks only move forward.",
        },
        {
          prompt: "A loop that calls `add(i, 1)` a million times and discards the result measures…",
          options: ["The cost of `add`", "Possibly an empty loop — dead-code elimination can remove the unused call; consume the results", "Garbage collection", "Nothing at all, it throws"],
          answer: 1,
          explanation: "Also warm up first, use runtime inputs, and repeat for a distribution.",
        },
        {
          prompt: "Why report the median rather than the mean of benchmark samples?",
          options: ["The mean is harder to compute", "A few slow runs (GC pauses, page faults) drag the mean up and hide the typical case", "The median is always smaller", "Benchmark tools cannot compute means"],
          answer: 1,
          explanation: "Pair it with p95/p99 and a spread; overlapping distributions mean no difference.",
        },
        {
          prompt: "In a flame chart, a wide bar means…",
          options: ["A deep call stack", "A function where a lot of time is spent — width is time, depth is the call stack", "A memory leak", "An error"],
          answer: 1,
          explanation: "Read top-down for structure and bottom-up for self time.",
        },
        {
          prompt: "Doubling the input quadruples the operation count. Before micro-optimising you should…",
          options: ["Cache `arr.length`", "Fix the algorithm — that is O(n²), and no shape stability will rescue it", "Switch `forEach` to `for`", "Add a Web Worker"],
          answer: 1,
          explanation: "Complexity before constants; Big-O swamps every JIT effect.",
        },
      ],
    },
    {
      slug: "memory-and-garbage-collection",
      file: "03-memory-and-garbage-collection.md",
      exercises: [
        {
          title: "Reachability collector",
          prompt: `Model the heap as a graph. Commands: \`alloc <id> <bytes>\`; \`ref <from|root> <to>\` adds an edge (from the root set when \`root\`); \`unref <from|root> <to>\` removes it; \`gc\` marks from the roots and sweeps everything unreachable, printing \`gc: freed <ids or nothing> (<bytes> bytes) live=<ids or -> heap=<bytes> bytes\`; \`retainers <id>\` prints the shortest path from a root — \`retainers <id>: root -> a -> b -> <id>\` — or \`unreachable (garbage)\` / \`not allocated\`. Ids are printed in allocation order.

Example: allocate a→b→c→d with d→b, root→a, then \`retainers d\`, \`unref a b\`, \`gc\` →
\`\`\`
retainers d: root -> a -> b -> c -> d
gc: freed b,c,d (85 bytes) live=a heap=100 bytes
\`\`\`
The cycle b→c→d→b kept nothing alive once \`a\` let go — reachability, not reference counting.`,
          starterFile: "code/reachability.starter.js",
          solutionFile: "code/reachability.solution.js",
          hints: ["Mark with a stack seeded from the roots; sweep by iterating the heap Map and deleting what was not marked.", "The retainer path is a breadth-first search from the roots recording each node's predecessor."],
          cases: [
            { stdin: "alloc a 100\nalloc b 50\nalloc c 25\nalloc d 10\nref root a\nref a b\nref b c\nref c d\nref d b\nretainers d\nunref a b\ngc\nretainers d\nref root d\nalloc e 5\ngc\n", expected: "retainers d: root -> a -> b -> c -> d\ngc: freed b,c,d (85 bytes) live=a heap=100 bytes\nretainers d: not allocated\ngc: freed e (5 bytes) live=a heap=100 bytes\n" },
            { stdin: "alloc x 1\ngc\nretainers x\n", expected: "gc: freed x (1 bytes) live=- heap=0 bytes\nretainers x: not allocated\n", hidden: true },
          ],
        },
        {
          title: "Leak detective",
          prompt: `Each line is a heap-snapshot summary: \`snapshot <n>: Class=count Class=count …\`. A class whose count grows **strictly** at every snapshot (three or more snapshots) is a suspect; a class whose count never changes is stable; anything else is normal churn. Print suspects sorted by total growth as \`suspect <Class>: <c1> -> <c2> -> … (+<per snapshot, one decimal>/snapshot, +<total> total)\`, then \`stable: <classes or ->\`, \`fluctuating (normal churn): <classes or ->\`, and a verdict: \`verdict: likely leak in <top suspect> — find who retains them in a heap snapshot comparison\` or \`verdict: no monotonic growth across snapshots\`.

Example: four snapshots with Listener 100→200→300→400, Buffer bouncing, Session flat, Timer 5→8 →
\`\`\`
suspect Listener: 100 -> 200 -> 300 -> 400 (+100.0/snapshot, +300 total)
suspect Timer: 5 -> 6 -> 7 -> 8 (+1.0/snapshot, +3 total)
stable: Session
fluctuating (normal churn): Buffer
verdict: likely leak in Listener — find who retains them in a heap snapshot comparison
\`\`\``,
          starterFile: "code/leak-detective.starter.js",
          solutionFile: "code/leak-detective.solution.js",
          hints: ["Collect the class names across all snapshots (a missing class counts 0), then take each class's count series.", "`counts.every((v, i) => i === 0 || v > counts[i - 1])` is the strict-growth test."],
          cases: [
            { stdin: "snapshot 1: Listener=100 Buffer=40 Session=10 Timer=5\nsnapshot 2: Listener=200 Buffer=35 Session=10 Timer=6\nsnapshot 3: Listener=300 Buffer=42 Session=10 Timer=7\nsnapshot 4: Listener=400 Buffer=38 Session=10 Timer=8\n", expected: "suspect Listener: 100 -> 200 -> 300 -> 400 (+100.0/snapshot, +300 total)\nsuspect Timer: 5 -> 6 -> 7 -> 8 (+1.0/snapshot, +3 total)\nstable: Session\nfluctuating (normal churn): Buffer\nverdict: likely leak in Listener — find who retains them in a heap snapshot comparison\n" },
            { stdin: "snapshot 1: A=1 B=2\nsnapshot 2: A=1 B=1\n", expected: "stable: A\nfluctuating (normal churn): B\nverdict: no monotonic growth across snapshots\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "An object is eligible for collection when…",
          options: ["Its reference count reaches zero", "It is unreachable from every root — the global object, the call stack, engine internals — by any path", "It has not been used for a while", "`delete` is called on it"],
          answer: 1,
          explanation: "Cycles are no problem; a single kept reference anywhere on a reachable path is.",
        },
        {
          prompt: "Objects that survive two scavenges…",
          options: ["Are freed", "Are promoted to old space, which is collected by incremental mark–sweep–compact", "Stay in new space forever", "Become weak references"],
          answer: 1,
          explanation: "The generational hypothesis: most objects die young, so scavenging the young generation is cheap.",
        },
        {
          prompt: "Which is the most common JavaScript memory leak?",
          options: ["Forgetting to call `free()`", "A module-level cache (`Map`/object) keyed by request data that only grows", "Using `const`", "Deep recursion"],
          answer: 1,
          explanation: "Bound it (LRU/TTL) or key it weakly; listeners and timers without teardown come next.",
        },
        {
          prompt: "To find what is leaking you…",
          options: ["Read `heapTotal` once", "Take two heap snapshots around the suspected activity, compare them, and follow the retainer path of an object whose count grew", "Raise `--max-old-space-size`", "Call `global.gc()` in production"],
          answer: 1,
          explanation: "Sort by retained size, not shallow size; `--trace-gc` shows promotion pressure.",
        },
        {
          prompt: "Why is a high allocation rate a cost when young-generation GC is cheap?",
          options: ["It is not a cost", "Scavenges are frequent and each promotes a few objects that later cost major GCs proportional to the live heap", "Allocation is synchronous I/O", "It fragments the stack"],
          answer: 1,
          explanation: "Fewer allocations in hot paths means less GC time — not object pools, which V8's allocator outruns.",
        },
      ],
    },
    {
      slug: "writing-fast-javascript",
      file: "04-writing-fast-javascript.md",
      exercises: [
        {
          title: "Count the comparisons",
          prompt: `Line 1 lists ids, line 2 the queries. Count the work each approach does — no timing. Membership: scan the ids for each query the way \`includes\` does (one comparison per element until a match) versus one hash probe per query with a \`Set\`; print \`includes: comparisons=<> found=<> | Set: probes=<> found=<> | ratio=<x.x>x\`. Queue: drain a copy of the ids with \`shift()\` counting the element moves each shift makes (remaining length − 1) versus stepping an index pointer; print \`queue of <n>: shift moves=<> (O(n^2)) | index pointer steps=<> (O(n))\`. Finish with \`worst case for <n> ids: scan=<n> comparisons per miss, Set=1 probe\`.

Example: ids \`a b c d e f g h i j\`, queries \`j a zzz e j\` →
\`\`\`
includes: comparisons=36 found=4 | Set: probes=5 found=4 | ratio=7.2x
queue of 10: shift moves=45 (O(n^2)) | index pointer steps=10 (O(n))
worst case for 10 ids: scan=10 comparisons per miss, Set=1 probe
\`\`\``,
          starterFile: "code/lookup-cost-counter.starter.js",
          solutionFile: "code/lookup-cost-counter.solution.js",
          hints: ["Increment the counter inside the scan loop before comparing, and break on a hit.", "Total shift moves for n items is n(n−1)/2 — count it by simulation anyway."],
          cases: [
            { stdin: "a b c d e f g h i j\nj a zzz e j\n", expected: "includes: comparisons=36 found=4 | Set: probes=5 found=4 | ratio=7.2x\nqueue of 10: shift moves=45 (O(n^2)) | index pointer steps=10 (O(n))\nworst case for 10 ids: scan=10 comparisons per miss, Set=1 probe\n" },
            { stdin: "x y\nx\n", expected: "includes: comparisons=1 found=1 | Set: probes=1 found=1 | ratio=1.0x\nqueue of 2: shift moves=1 (O(n^2)) | index pointer steps=2 (O(n))\nworst case for 2 ids: scan=2 comparisons per miss, Set=1 probe\n", hidden: true },
          ],
        },
        {
          title: "Typed-array lab",
          prompt: `Line 1 is a list of numbers. Build \`Int8Array\`, \`Uint8ClampedArray\`, \`Float32Array\` and \`Float64Array\` views from it and print what each representation did to the values: \`Int8Array=<JSON> (wraps modulo 256)\`, \`Uint8ClampedArray=<JSON> (clamps to 0..255, rounds)\`, \`Float32Array=<JSON> exact=<every element equals the input>\`, \`bytes: i8=<> f32=<> f64=<> elements=<>\`, \`sum plain=<> typed=<> equal=<>\`. Then show sharing: write \`-1\` through \`subarray(0, 2)\` and \`-2\` through \`slice(0, 2)\` and print \`after subarray write: f64[0]=<> sharedBuffer=<> | after slice write: f64[1]=<> copyBuffer=<>\`. Then a \`DataView\` on a 4-byte buffer with \`setUint16(0, 258)\`: \`DataView: bytes=<b0,b1> readBE=<> readLE=<>\`. Finally write to index 7 of a \`Float64Array(3)\` and print \`out-of-range write on a typed array: ignored (no holes, no growth); length after: 3\`.

Example: \`1 127 128 300 -1 0.1\` →
\`\`\`
Int8Array=[1,127,-128,44,-1,0] (wraps modulo 256)
Uint8ClampedArray=[1,127,128,255,0,0] (clamps to 0..255, rounds)
Float32Array=[1,127,128,300,-1,0.10000000149011612] exact=false
bytes: i8=6 f32=24 f64=48 elements=6
sum plain=555.1 typed=555.1 equal=true
after subarray write: f64[0]=-1 sharedBuffer=true | after slice write: f64[1]=127 copyBuffer=false
DataView: bytes=1,2 readBE=258 readLE=513
out-of-range write on a typed array: ignored (no holes, no growth); length after: 3
\`\`\``,
          starterFile: "code/typed-arrays.starter.js",
          solutionFile: "code/typed-arrays.solution.js",
          hints: ["`Int8Array.from(values)` converts each element; spread it back (`[...i8]`) before `JSON.stringify`.", "`view.buffer === f64.buffer` is the sharing test; DataView defaults to big-endian and takes `true` for little-endian."],
          cases: [
            { stdin: "1 127 128 300 -1 0.1", expected: "Int8Array=[1,127,-128,44,-1,0] (wraps modulo 256)\nUint8ClampedArray=[1,127,128,255,0,0] (clamps to 0..255, rounds)\nFloat32Array=[1,127,128,300,-1,0.10000000149011612] exact=false\nbytes: i8=6 f32=24 f64=48 elements=6\nsum plain=555.1 typed=555.1 equal=true\nafter subarray write: f64[0]=-1 sharedBuffer=true | after slice write: f64[1]=127 copyBuffer=false\nDataView: bytes=1,2 readBE=258 readLE=513\nout-of-range write on a typed array: ignored (no holes, no growth); length after: 3\n" },
            { stdin: "255 256 -300 2.5", expected: "Int8Array=[-1,0,-44,2] (wraps modulo 256)\nUint8ClampedArray=[255,255,0,2] (clamps to 0..255, rounds)\nFloat32Array=[255,256,-300,2.5] exact=true\nbytes: i8=4 f32=16 f64=32 elements=4\nsum plain=213.5 typed=213.5 equal=true\nafter subarray write: f64[0]=-1 sharedBuffer=true | after slice write: f64[1]=256 copyBuffer=false\nDataView: bytes=1,2 readBE=258 readLE=513\nout-of-range write on a typed array: ignored (no holes, no growth); length after: 3\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "`for (const x of a) if (b.includes(x)) …` over two arrays of 10 000 is…",
          options: ["O(n) and fine", "O(n·m) — 100 million comparisons; build a `Set` from `b` once and it becomes O(n + m)", "A memory leak", "Faster than a `Set`"],
          answer: 1,
          explanation: "Complexity and data structures first; every other technique is a rounding error next to this.",
        },
        {
          prompt: "`[...acc, x]` as the accumulator step in `reduce`…",
          options: ["Is idiomatic and free", "Copies the whole accumulator every step — O(n²) for n items; push into a local array instead", "Is O(log n)", "Deoptimises the callback"],
          answer: 1,
          explanation: "Same for `{ ...acc }` and for `arr.shift()` used as a queue.",
        },
        {
          prompt: "`for` versus `forEach`/`map` for speed…",
          options: ["Always use `for`", "Pick by readability — the engine inlines small callbacks; switch only when a profile names that loop", "Always use `map`", "Use `while`"],
          answer: 1,
          explanation: "Most loop, closure and string-building folklore is obsolete; measure before believing it.",
        },
        {
          prompt: "Crossing a boundary (DOM, network, worker) per item should be…",
          options: ["Left alone", "Batched — one fragment, one request for ten ids, one message with an array — because the crossing costs more than the work", "Made synchronous", "Moved into a `reduce`"],
          answer: 1,
          explanation: "The event loop is a boundary too: split long CPU work across tasks or move it to a worker.",
        },
        {
          prompt: "Object pooling for small objects in JavaScript…",
          options: ["Is a reliable speed-up", "Is usually slower than V8's bump allocator and leaks — reuse a scratch buffer only where a profile shows allocation cost", "Is required for typed arrays", "Prevents deoptimisation"],
          answer: 1,
          explanation: "Every optimisation here answers a measurement and carries a comment saying so.",
        },
      ],
    },
    {
      slug: "server-and-network-performance",
      file: "05-server-and-network-performance.md",
      exercises: [
        {
          title: "Percentiles and SLO burn",
          prompt: `Line 1 is \`slo=<ms> target=<percent>\`; the following lines are \`<name>: <ms> <ms> …\` request durations. For each series print \`<name>: n=<> p50=<> p95=<> p99=<> mean=<one decimal> withinSLO=<xx.xx>% budgetBurn=<n>% <OK|BREACH>\` — percentiles by nearest rank, budget burn = requests over the SLO ÷ the allowed failures (\`n × (1 − target/100)\`) as a percentage. When both \`before\` and \`after\` exist, add \`p95 change: <±x.x>% -> <regression|improvement|no significant change>\` (more than ±10%) followed by \`; mean change <x.x>% (means hide the tail)\`.

Example: \`slo=300 target=99\`, a \`before\` series with one 950 ms request among twenty, an \`after\` series without it →
\`\`\`
before: n=20 p50=127 p95=140 p99=950 mean=168.4 withinSLO=95.00% budgetBurn=500% BREACH
after: n=20 p50=125 p95=136 p99=138 mean=125.5 withinSLO=100.00% budgetBurn=0% OK
p95 change: -2.9% -> no significant change; mean change -25.5% (means hide the tail)
\`\`\`
One tail request burned five times the error budget; the mean moved 25% while p95 barely moved.`,
          starterFile: "code/percentiles-and-slo.starter.js",
          solutionFile: "code/percentiles-and-slo.solution.js",
          hints: ["The starter's `percentile(xs, p)` is nearest-rank: sort, take index ceil(p/100 × n) − 1.", "Allowed failures for n=20 at 99% is 0.2 — one failure is a 500% burn."],
          cases: [
            { stdin: "slo=300 target=99\nbefore: 120 130 125 140 118 122 135 128 950 126 124 129 131 127 123 121 133 119 138 130\nafter: 118 128 122 138 116 120 132 126 130 124 122 127 129 125 121 119 131 117 136 128\n", expected: "before: n=20 p50=127 p95=140 p99=950 mean=168.4 withinSLO=95.00% budgetBurn=500% BREACH\nafter: n=20 p50=125 p95=136 p99=138 mean=125.5 withinSLO=100.00% budgetBurn=0% OK\np95 change: -2.9% -> no significant change; mean change -25.5% (means hide the tail)\n" },
            { stdin: "slo=100 target=99.9\nonly: 10 20 30 500\n", expected: "only: n=4 p50=20 p95=500 p99=500 mean=140.0 withinSLO=75.00% budgetBurn=25000% BREACH\n", hidden: true },
          ],
        },
        {
          title: "Cache-hit simulator",
          prompt: `Line 1 lists cache capacities; line 2 is a request trace of keys, \`|\` separating batches — keys inside a batch arrive **concurrently**, so a miss's load only lands after the batch. For each capacity run an LRU cache (a \`Map\` re-inserted on hit, oldest evicted) over the trace: a hit costs 2 ms, a miss 60 ms; a miss whose key is already loading in the same batch is **coalesced** (single-flight: it waits but starts no load). Print \`capacity=<c>: hits=<> misses=<> (<n> coalesced) hitRatio=<xx.x>% backendLoads=<> avgLatency=<x.x>ms\` per capacity, then \`no cache: avgLatency=60ms backendLoads=<total>\`.

Example: capacities \`1 2 3\`, trace \`a a a | b | a | c | a | b | d | a | e | a | b\` →
\`\`\`
capacity=1: hits=0 misses=13 (2 coalesced) hitRatio=0.0% backendLoads=11 avgLatency=60.0ms
capacity=2: hits=3 misses=10 (2 coalesced) hitRatio=23.1% backendLoads=8 avgLatency=46.6ms
capacity=3: hits=5 misses=8 (2 coalesced) hitRatio=38.5% backendLoads=6 avgLatency=37.7ms
no cache: avgLatency=60ms backendLoads=13
\`\`\`
Three concurrent requests for \`a\` produced one backend load; the capacity decides everything after that.`,
          starterFile: "code/cache-hit-simulator.starter.js",
          solutionFile: "code/cache-hit-simulator.solution.js",
          hints: ["Keep an `inFlight` Set per batch; insert its keys into the LRU only after the batch, evicting `lru.keys().next().value` while over capacity.", "On a hit, delete and re-set the key so it becomes the most recent."],
          cases: [
            { stdin: "1 2 3\na a a | b | a | c | a | b | d | a | e | a | b\n", expected: "capacity=1: hits=0 misses=13 (2 coalesced) hitRatio=0.0% backendLoads=11 avgLatency=60.0ms\ncapacity=2: hits=3 misses=10 (2 coalesced) hitRatio=23.1% backendLoads=8 avgLatency=46.6ms\ncapacity=3: hits=5 misses=8 (2 coalesced) hitRatio=38.5% backendLoads=6 avgLatency=37.7ms\nno cache: avgLatency=60ms backendLoads=13\n" },
            { stdin: "1 2\nx y | x | y | x | y\n", expected: "capacity=1: hits=0 misses=6 (0 coalesced) hitRatio=0.0% backendLoads=6 avgLatency=60.0ms\ncapacity=2: hits=4 misses=2 (0 coalesced) hitRatio=66.7% backendLoads=2 avgLatency=21.3ms\nno cache: avgLatency=60ms backendLoads=6\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "Why report p99 rather than the average response time?",
          options: ["p99 is easier to compute", "Tails are where users suffer and where fan-out compounds — a page making ten parallel calls sees the max of ten draws; averages hide both", "Averages are always wrong", "p99 is what load balancers use"],
          answer: 1,
          explanation: "Set latency budgets at percentiles per route.",
        },
        {
          prompt: "Three independent database reads awaited one after another when each round trip is 500 ms…",
          options: ["Take 500 ms", "Take 1.5 s — `Promise.all` them for one round trip; sequential awaits *are* the response time", "Are cached automatically", "Are batched by the driver"],
          answer: 1,
          explanation: "N+1 — a query per item in a loop — is the same mistake at scale; batch with `IN` or a join.",
        },
        {
          prompt: "Single-flight in a cache means…",
          options: ["Only one key is cached", "One loader runs per key at a time; concurrent misses for the same key share it, so a miss under load does not stampede the database", "The cache has one entry", "The cache is per request"],
          answer: 1,
          explanation: "Cache the promise. Pair it with stale-while-revalidate and cache composed payloads.",
        },
        {
          prompt: "Event-loop lag climbing to 200 ms at p99 indicates…",
          options: ["The database is slow", "Synchronous CPU work is blocking the loop — requests queue behind it; move it to workers, stream large bodies, cap body sizes", "Redis is down", "Too many connections in the pool"],
          answer: 1,
          explanation: "Lag is the single best health metric of a Node process.",
        },
        {
          prompt: "A connection pool sized larger than the database's limit…",
          options: ["Improves throughput", "Produces connection errors under load — size it to the limit divided by the instance count, keep queries short, add timeouts", "Is required for transactions", "Is harmless"],
          answer: 1,
          explanation: "Pools and bounded queues are backpressure; unbounded buffering ends in out-of-memory.",
        },
      ],
    },
    {
      slug: "performance-checkpoint",
      file: "06-checkpoint.md",
      kind: "test",
      passMark: 70,
      exercises: [
        {
          title: "Hidden classes and inline caches, simulated",
          prompt: `Commands: \`class <Name>: <prop> <prop> …\` defines a constructor that assigns those properties in order; \`new <Name> <obj>\` instantiates; \`set <obj> <prop>\` adds a property later (a transition off the constructor's shape); \`delete <obj> <prop>\` drops the object to dictionary mode; \`site <name> <obj> …\` is a property-access site and the objects it has seen. Maintain a transition tree from \`S0\` where the same property added to the same shape reaches the same child. Print \`transition tree:\` then the tree indented two spaces per level as \`S<n> {props}\` (\`{}\` for the root); \`objects: <obj>=<shape|dictionary> …\`; each site as \`site <name>: <state> [<shapes seen>]\` where the state is \`monomorphic\`, \`polymorphic\` (2–4), \`megamorphic\` (more), or \`megamorphic (dictionary-mode object)\` when any object seen is in dictionary mode; and \`shapes created=<n> uniformClasses=<classes whose live non-dictionary instances all share one shape, or ->\`.

Example: \`Point\` and \`Vec\` both declaring \`x y\`, \`p2\` given \`z\` later, \`p3\` with \`x\` deleted →
\`\`\`
transition tree:
  S0 {}
    S1 {x}
      S2 {x,y}
        S3 {x,y,z}
objects: p1=S2 p2=S3 v1=S2 p3=dictionary
site readX: polymorphic [S2,S3]
site same: monomorphic [S2]
site broken: megamorphic (dictionary-mode object) [S2,dictionary]
site one: monomorphic [S2]
shapes created=3 uniformClasses=Vec
\`\`\`
Two classes with the same property order share one shape; one late \`set\` forked \`Point\`'s instances apart.`,
          starterFile: "code/hidden-class-simulator.starter.js",
          solutionFile: "code/hidden-class-simulator.solution.js",
          hints: ["A shape node is `{ id, props, children: Map }`; `transition(shape, prop)` creates the child once.", "Print the tree recursively in insertion order of `children`; a dictionary object no longer points at a shape."],
          cases: [
            { stdin: "class Point: x y\nclass Vec: x y\nnew Point p1\nnew Point p2\nnew Vec v1\nset p2 z\nnew Point p3\ndelete p3 x\nsite readX p1 p2 v1\nsite same p1 v1\nsite broken p1 p3\nsite one p1\n", expected: "transition tree:\n  S0 {}\n    S1 {x}\n      S2 {x,y}\n        S3 {x,y,z}\nobjects: p1=S2 p2=S3 v1=S2 p3=dictionary\nsite readX: polymorphic [S2,S3]\nsite same: monomorphic [S2]\nsite broken: megamorphic (dictionary-mode object) [S2,dictionary]\nsite one: monomorphic [S2]\nshapes created=3 uniformClasses=Vec\n" },
            { stdin: "class A: a\nnew A o\nsite s o\n", expected: "transition tree:\n  S0 {}\n    S1 {a}\nobjects: o=S1\nsite s: monomorphic [S1]\nshapes created=1 uniformClasses=A\n", hidden: true },
          ],
        },
        {
          title: "A generational garbage collector",
          prompt: `Simulate V8's two generations. Commands: \`alloc <id> <bytes>\` (young, age 0); \`ref <from|root> <to>\`; \`unref <from|root> <to>\`; \`scavenge\` — a young-generation collection: mark from the roots **and from every old-space object** (the remembered set — a scavenge never looks inside old space, so a dead old object still keeps its young children alive), free unreachable young objects, age the survivors and promote those reaching age 2; print \`scavenge #<n>: freed=<ids or -> promoted=<ids or -> young=<bytes>B old=<bytes>B\`. \`major\` — mark from the real roots over both spaces and sweep: \`major #<n>: freed=<ids or -> young=<>B old=<>B\`. \`stats\` → \`stats: objects=<> young=<>B old=<>B scavenges=<> majors=<>\`.

Example: \`a\` (rooted) and \`b\` survive two scavenges and are promoted; \`c\` is then allocated under \`b\`, \`a\` drops \`b\`, and a scavenge runs →
\`\`\`
scavenge #4: freed=- promoted=c young=0B old=170B
…
major #1: freed=b,c young=0B old=100B
\`\`\`
\`c\` was unreachable from the roots yet survived and was promoted, because dead old \`b\` counts as a root during a scavenge. Only the major collection frees them both.`,
          starterFile: "code/gc-simulator.starter.js",
          solutionFile: "code/gc-simulator.solution.js",
          hints: ["One `live(extraRoots)` marker serves both: `scavenge` passes the ids of every old-space object, `major` passes nothing.", "During a scavenge only `gen === \"young\"` objects can be freed, aged or promoted."],
          cases: [
            { stdin: "alloc a 100\nalloc b 50\nalloc tmp1 10\nref root a\nref a b\nscavenge\nalloc tmp2 10\nscavenge\nalloc c 20\nref b c\nscavenge\nunref a b\nscavenge\nstats\nmajor\nstats\n", expected: "scavenge #1: freed=tmp1 promoted=- young=150B old=0B\nscavenge #2: freed=tmp2 promoted=a,b young=0B old=150B\nscavenge #3: freed=- promoted=- young=20B old=150B\nscavenge #4: freed=- promoted=c young=0B old=170B\nstats: objects=3 young=0B old=170B scavenges=4 majors=0\nmajor #1: freed=b,c young=0B old=100B\nstats: objects=1 young=0B old=100B scavenges=4 majors=1\n" },
            { stdin: "alloc a 10\nref root a\nscavenge\nscavenge\nalloc kid 4\nref a kid\nunref root a\nscavenge\nmajor\nstats\n", expected: "scavenge #1: freed=- promoted=- young=10B old=0B\nscavenge #2: freed=- promoted=a young=0B old=10B\nscavenge #3: freed=- promoted=- young=4B old=10B\nmajor #1: freed=a,kid young=0B old=0B\nstats: objects=0 young=0B old=0B scavenges=3 majors=1\n", hidden: true },
            { stdin: "alloc x 5\nref root x\nmajor\nstats\n", expected: "major #1: freed=- young=5B old=0B\nstats: objects=1 young=5B old=0B scavenges=0 majors=1\n", hidden: true },
          ],
        },
        {
          title: "Request-trace analyser",
          prompt: `Line 1 is \`slo=<ms> target=<percent> queries=<limit>\`; each following line is one request: \`<route> <ms> <status> <queries>\`. Group by route and print, sorted by p95 descending, \`<route>: n=<> p50=<> p95=<> p99=<> errors=<status ≥ 500> n+1suspects=<requests over the query limit> maxQueries=<>\` (nearest-rank percentiles). Then \`slowest by p95: <route>\`; \`SLO <ms>ms @ <target>%: <xx.x>% good -> <met|missed>; error budget used=<n>%\` where a request is good when within the SLO and not a 5xx, and budget used = bad requests ÷ allowed bad (\`n × (1 − target/100)\`); and the single worst offender: \`N+1 candidate: <route> ran <q> queries in one request (limit <limit>) - batch them\` or \`N+1: none over the limit\`.

Example: ten requests over \`/home\`, \`/orders\` (one 900 ms request with 45 queries, one 500) and \`/search\` at \`slo=300 target=95 queries=10\` →
\`\`\`
/orders: n=4 p50=260 p95=900 p99=900 errors=1 n+1suspects=1 maxQueries=45
/home: n=3 p50=120 p95=140 p99=140 errors=0 n+1suspects=0 maxQueries=3
/search: n=3 p50=80 p95=95 p99=95 errors=0 n+1suspects=0 maxQueries=1
slowest by p95: /orders
SLO 300ms @ 95%: 80.0% good -> missed; error budget used=400%
N+1 candidate: /orders ran 45 queries in one request (limit 10) - batch them
\`\`\``,
          starterFile: "code/request-trace-analyzer.starter.js",
          solutionFile: "code/request-trace-analyzer.solution.js",
          hints: ["Group with a `Map` of route → requests, compute the row per route, then sort rows by p95 descending.", "Good = `ms <= slo && status < 500`; cap the budget figure so a target of 100% does not divide by zero."],
          cases: [
            { stdin: "slo=300 target=95 queries=10\n/home 120 200 3\n/home 140 200 3\n/home 110 200 3\n/orders 250 200 4\n/orders 900 200 45\n/orders 260 200 4\n/orders 280 500 4\n/search 80 200 1\n/search 95 200 1\n/search 70 200 1\n", expected: "/orders: n=4 p50=260 p95=900 p99=900 errors=1 n+1suspects=1 maxQueries=45\n/home: n=3 p50=120 p95=140 p99=140 errors=0 n+1suspects=0 maxQueries=3\n/search: n=3 p50=80 p95=95 p99=95 errors=0 n+1suspects=0 maxQueries=1\nslowest by p95: /orders\nSLO 300ms @ 95%: 80.0% good -> missed; error budget used=400%\nN+1 candidate: /orders ran 45 queries in one request (limit 10) - batch them\n" },
            { stdin: "slo=200 target=90 queries=5\n/a 10 200 1\n/a 20 200 1\n", expected: "/a: n=2 p50=10 p95=20 p99=20 errors=0 n+1suspects=0 maxQueries=1\nslowest by p95: /a\nSLO 200ms @ 90%: 100.0% good -> met; error budget used=0%\nN+1: none over the limit\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "Code that runs once at startup…",
          options: ["Should be micro-optimised first", "Runs in the interpreter and is never optimised — micro-optimising it is pointless; hot code is where performance lives", "Is compiled by TurboFan", "Cannot allocate"],
          answer: 1,
          explanation: "Ignition first; TurboFan only for hot functions with stable feedback.",
        },
        {
          prompt: "Assigning `this.z` in a method that only some callers reach…",
          options: ["Is fine", "Forks the instances into two shapes — initialise every property in the constructor, in the same order, every time", "Deletes `z`", "Makes the array holey"],
          answer: 1,
          explanation: "Conditional adds and `delete` are the two shape killers.",
        },
        {
          prompt: "`[1, 2, 3.5]` has elements kind…",
          options: ["PACKED_SMI", "PACKED_DOUBLE — one fraction moves the whole array to doubles, permanently", "HOLEY_ELEMENTS", "Typed"],
          answer: 1,
          explanation: "Typed arrays fix the representation when the data is numeric.",
        },
        {
          prompt: "A benchmark with literal inputs like `add(2, 3)` inside the loop…",
          options: ["Is the most accurate", "Lets the compiler constant-fold the answer — feed data built at runtime instead", "Measures GC", "Cannot warm up"],
          answer: 1,
          explanation: "Warm-up, dead code, folding, GC, granularity and machine noise: six ways a benchmark lies.",
        },
        {
          prompt: "Two alternatives whose latency distributions overlap almost entirely are…",
          options: ["Distinguishable if the means differ", "Not distinguishable — a 3% difference under 10% run-to-run variance is noise", "Both wrong", "Both optimised"],
          answer: 1,
          explanation: "Compare medians and spread, interleave runs, and reproduce twice.",
        },
        {
          prompt: "A sampling profiler…",
          options: ["Wraps every function in timers", "Records the stack every ~1 ms at full speed — cheap and honest; instrumentation is exact but distorts", "Only works in browsers", "Requires `--expose-gc`"],
          answer: 1,
          explanation: "`node --cpu-prof` writes a profile DevTools can open as a flame chart.",
        },
        {
          prompt: "A `setInterval` whose callback closes over a component that has since been destroyed…",
          options: ["Is collected with the component", "Keeps the component and everything it references alive until `clearInterval` — a classic leak", "Throws", "Runs once more and stops"],
          answer: 1,
          explanation: "Every listener, timer and subscription needs a matching teardown or an `AbortSignal`.",
        },
        {
          prompt: "In a heap snapshot you sort by…",
          options: ["Shallow size", "Retained size — what would actually be freed if the object went away", "Name", "Allocation time"],
          answer: 1,
          explanation: "Compare two snapshots and follow the retainer path from a root.",
        },
        {
          prompt: "During a scavenge, a young object referenced only by an unreachable old-space object…",
          options: ["Is freed", "Survives — the scavenger treats old space as roots (the remembered set) and does not know the old object is dead; a major GC frees both", "Is promoted immediately", "Causes a deoptimisation"],
          answer: 1,
          explanation: "The generational trade: cheap frequent scavenges, occasional full marks.",
        },
        {
          prompt: "`--max-old-space-size=8192` when a server grows until it dies…",
          options: ["Fixes the leak", "Buys time — the leak is a kept reference and the heap will reach the new limit too", "Disables the collector", "Enables incremental marking"],
          answer: 1,
          explanation: "Find the retainer; bound the cache; remove the listener.",
        },
        {
          prompt: "The N+1 problem is…",
          options: ["Off-by-one indexing", "One query per item in a loop — n round trips where one `IN`/join/batch query would do", "A pool that is one connection short", "A cache with one extra key"],
          answer: 1,
          explanation: "Count the sequential awaits; response time is round trips × latency.",
        },
        {
          prompt: "Load testing to find the knee means…",
          options: ["Measuring requests per second at one concurrency", "Ramping concurrency while watching p95/p99, errors, event-loop lag and pool queues until latency starts climbing — then fixing that bottleneck and repeating", "Testing once before launch", "Testing only the fastest route"],
          answer: 1,
          explanation: "The knee moves after each fix; production telemetry per route is the other half of measuring.",
        },
      ],
    },
  ],
});

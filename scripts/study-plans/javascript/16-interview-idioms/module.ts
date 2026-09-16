import { defineModule } from "../../dsl.js";

export default defineModule(import.meta.url, {
  slug: "interview-idioms",
  title: "Interview idioms",
  blurb: "The coding-round template and the JavaScript decisions to make before being asked; the twelve algorithm patterns; the idiom sheet and the trap behind each idiom; the reimplementation questions and the spec details that decide them; the theory repertoire in two-sentence answers.",
  icon: "trophy",
  overview: `The last module turns fifteen modules of language knowledge into interview performance. A coding round is a conversation with a program in the middle, and it is won or lost on process: restating the problem, probing its edges, naming the brute force, coding aloud, tracing an example, stating complexity. A theory round is a finite repertoire answered crisply. A reimplementation question hinges on one spec detail the interviewer already has in mind. This module makes each of those explicit.

The first lesson is the template and the JavaScript-specific decisions — \`Map\` over object, comparators, index-pointer queues, code points, \`BigInt\`, \`Array.from\` grids. The second names the twelve patterns behind most problems, the signs that identify each, and its JavaScript shape. The third is the idiom sheet: the collection, string, object, number and function one-liners, each with the trap inside it. The fourth covers the reimplementation questions — \`bind\`, \`new\`, the array methods, \`Promise.all\`, a \`Promise\` class, \`JSON.stringify\`, deep clone and equality — and the details that decide them. The fifth is the theory repertoire as flashcards with two-sentence answers and pointers to depth.

The exercises are interview problems done the interview way — two-sum three ways with operation counts, a test table with edge cases, sliding windows and two pointers, stacks and BFS, the idiom sheets as command interpreters, \`bind\`/\`new\`/\`instanceof\` and the array methods checked against the natives, a Leitner flashcard scheduler and an answer grader — then the three senior-round reimplementations: a \`Promise\` class with adoption and the four combinators, a \`JSON.stringify\` that matches the native one, and a deep-equality and deep-clone toolkit reported as TAP.`,
  lessons: [
    {
      slug: "the-template",
      file: "01-the-template.md",
      exercises: [
        {
          title: "Two-sum, three ways",
          prompt: `Line 1 is a list of integers, line 2 the target. Solve two-sum three times and count the work each way does: brute force over every pair (\`pairs checked\`), sort with the original indices attached and walk two pointers (\`steps\`), and a single pass with a \`Map\` (\`lookups\`). Print one line per approach — \`<name>: <counter>=<n> -> indices <i>,<j> (<a>+<b>) | <complexity>\` or \`-> none\` — with the complexities \`O(n^2) time, O(1) space\`, \`O(n log n) time, O(n) space for the index pairs\` and \`O(n) time, O(n) space\`. Finish with \`all three found a pair summing to <target>\` or \`no pair sums to <target>: all three agree\`.

Example: \`2 7 11 15\` / \`9\` →
\`\`\`
brute force: pairs checked=1 -> indices 0,1 (2+7) | O(n^2) time, O(1) space
two pointers: sort, then steps=3 -> indices 0,1 (2+7) | O(n log n) time, O(n) space for the index pairs
hash map: lookups=2 -> indices 0,1 (2+7) | O(n) time, O(n) space
all three found a pair summing to 9
\`\`\``,
          starterFile: "code/two-sum-three-ways.starter.js",
          solutionFile: "code/two-sum-three-ways.solution.js",
          hints: ["Sort `[value, index]` pairs so the two-pointer answer can still report indices; sort the found pair ascending.", "The hash-map pass looks up `target - nums[i]` before inserting `nums[i]`, so an element never pairs with itself."],
          cases: [
            { stdin: "2 7 11 15\n9\n", expected: "brute force: pairs checked=1 -> indices 0,1 (2+7) | O(n^2) time, O(1) space\ntwo pointers: sort, then steps=3 -> indices 0,1 (2+7) | O(n log n) time, O(n) space for the index pairs\nhash map: lookups=2 -> indices 0,1 (2+7) | O(n) time, O(n) space\nall three found a pair summing to 9\n" },
            { stdin: "3 3\n6\n", expected: "brute force: pairs checked=1 -> indices 0,1 (3+3) | O(n^2) time, O(1) space\ntwo pointers: sort, then steps=1 -> indices 0,1 (3+3) | O(n log n) time, O(n) space for the index pairs\nhash map: lookups=2 -> indices 0,1 (3+3) | O(n) time, O(n) space\nall three found a pair summing to 6\n", hidden: true },
            { stdin: "1 2 3\n100\n", expected: "brute force: pairs checked=3 -> none | O(n^2) time, O(1) space\ntwo pointers: sort, then steps=2 -> none | O(n log n) time, O(n) space for the index pairs\nhash map: lookups=3 -> none | O(n) time, O(n) space\nno pair sums to 100: all three agree\n", hidden: true },
          ],
        },
        {
          title: "A test table for isAnagram",
          prompt: `Write \`isAnagram(a, b)\` the way you would defend it in a round: NFC-normalise, lower-case, drop everything that is not a letter or digit (Unicode-aware), compare the sorted **code points**. Then run the test table from stdin — each line \`<a> | <b> | <expected>\` — printing \`ok   isAnagram(<a JSON>, <b JSON>) -> <actual>\` or \`FAIL … -> <actual> (table expected <expected>)\`, and finally \`<n> passed, <m> failed\`. The table includes the edge cases you would ask about: punctuation and spaces, empty strings, a precomposed versus a decomposed \`é\`, emoji, and one row whose expectation is wrong so that a FAIL is visible.

Example rows: \`Dormitory | dirty room! | true\` → \`ok   isAnagram("Dormitory", "dirty room!") -> true\`; \`rat | car | true\` → \`FAIL isAnagram("rat", "car") -> false (table expected true)\`.`,
          starterFile: "code/anagram-test-table.starter.js",
          solutionFile: "code/anagram-test-table.solution.js",
          hints: ["`[...s.normalize(\"NFC\").toLowerCase().replace(/[^\\p{L}\\p{N}]/gu, \"\")].sort().join(\"\")` is the whole key.", "Split each row on `|` and trim; an empty cell is the empty string, which is an anagram of itself."],
          cases: [
            { stdin: "Listen | Silent | true\nDormitory | dirty room! | true\nAstronomer | Moon starer | true\nabc | ab | false\n | | true\nécole | école | true\n👍😀 | 😀👍 | true\nrat | car | true\n", expected: "ok   isAnagram(\"Listen\", \"Silent\") -> true\nok   isAnagram(\"Dormitory\", \"dirty room!\") -> true\nok   isAnagram(\"Astronomer\", \"Moon starer\") -> true\nok   isAnagram(\"abc\", \"ab\") -> false\nok   isAnagram(\"\", \"\") -> true\nok   isAnagram(\"école\", \"école\") -> true\nok   isAnagram(\"👍😀\", \"😀👍\") -> true\nFAIL isAnagram(\"rat\", \"car\") -> false (table expected true)\n7 passed, 1 failed\n" },
            { stdin: "a | A | true\nab | ba | true\n", expected: "ok   isAnagram(\"a\", \"A\") -> true\nok   isAnagram(\"ab\", \"ba\") -> true\n2 passed, 0 failed\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "The first thing to do after hearing a problem is…",
          options: ["Start coding the brute force", "Restate it in your own words including the return type, then probe edge cases with examples", "Ask for the optimal complexity", "Write the tests"],
          answer: 1,
          explanation: "Restate → probe → plan (brute force first) → code aloud → trace → analyse.",
        },
        {
          prompt: "`[10, 9, 1].sort()` returns…",
          options: ["`[1, 9, 10]`", "`[1, 10, 9]` — the default comparator sorts as strings; pass `(a, b) => a - b`", "`[10, 9, 1]`", "A `TypeError`"],
          answer: 1,
          explanation: "One of the decisions to make before the interviewer has to ask.",
        },
        {
          prompt: "Why prefer a `Map` over a plain object for counting in an interview?",
          options: ["It is faster to type", "Keys keep their type, there is no prototype to collide with, `size` is free and insertion order is kept", "Objects cannot hold numbers", "`Map` is immutable"],
          answer: 1,
          explanation: "`Set` for membership, `Map` for lookup — say it before you are asked.",
        },
        {
          prompt: "`Array(3).fill([])` as a grid…",
          options: ["Makes three independent rows", "Shares one array between all three rows — use `Array.from({ length: 3 }, () => [])`", "Throws", "Makes a typed array"],
          answer: 1,
          explanation: "`fill` writes the same reference into every slot.",
        },
        {
          prompt: "You have a working O(n²) solution and see a possible O(n) one with five minutes left. You should…",
          options: ["Delete the working one and start over", "Keep the working solution, state the improvement you see and its complexity, and only implement it if there is time", "Say nothing", "Ask for more time"],
          answer: 1,
          explanation: "A working brute force beats a broken optimum; naming the better approach still earns credit.",
        },
      ],
    },
    {
      slug: "the-patterns",
      file: "02-the-patterns.md",
      exercises: [
        {
          title: "Sliding windows and two pointers",
          prompt: `Commands, one per line. \`longest-unique <s>\` — the longest substring without repeating characters (code points), printed \`longest-unique <s>: length=<n> substring=<first such substring>\`. \`at-most-k <k> <s>\` — the longest substring with at most k distinct characters. \`max-window <k> <nums…>\` — the maximum sum over windows of size k: \`max-window k=<k>: sum=<s> window=[a,b,c] at <start>\`, or \`k larger than n=<n>\`. \`pair-sorted <target> <sorted nums…>\` — two pointers from both ends: \`pair-sorted target=<t>: <a>+<b> steps=<n>\` or \`none steps=<n>\`.

Example: \`longest-unique pwwkew\` → \`longest-unique pwwkew: length=3 substring=wke\`; \`at-most-k 2 eceba\` → \`at-most-k k=2 eceba: length=3 substring=ece\`; \`max-window 3 2 1 5 1 3 2\` → \`max-window k=3: sum=9 window=[5,1,3] at 2\`; \`pair-sorted 9 1 2 4 5 7 11\` → \`pair-sorted target=9: 2+7 steps=3\`.`,
          starterFile: "code/window-and-pointers.starter.js",
          solutionFile: "code/window-and-pointers.solution.js",
          hints: ["For longest-unique keep `last` index per character and jump `left` past the previous occurrence; for at-most-k keep counts and delete a key at 0 so `map.size` is the number of distinct characters.", "The fixed window adds `nums[i]` and subtracts `nums[i - k]`; record the best only once `i >= k - 1`."],
          cases: [
            { stdin: "longest-unique abcabcbb\nlongest-unique pwwkew\nlongest-unique 😀a😀\nat-most-k 2 eceba\nmax-window 3 2 1 5 1 3 2\nmax-window 9 1 2\npair-sorted 9 1 2 4 5 7 11\npair-sorted 100 1 2 3\n", expected: "longest-unique abcabcbb: length=3 substring=abc\nlongest-unique pwwkew: length=3 substring=wke\nlongest-unique 😀a😀: length=2 substring=😀a\nat-most-k k=2 eceba: length=3 substring=ece\nmax-window k=3: sum=9 window=[5,1,3] at 2\nmax-window k=9: k larger than n=2\npair-sorted target=9: 2+7 steps=3\npair-sorted target=100: none steps=2\n" },
            { stdin: "longest-unique aaaa\nat-most-k 1 aabbb\nmax-window 1 -3 -1 -2\npair-sorted 3 1 2\n", expected: "longest-unique aaaa: length=1 substring=a\nat-most-k k=1 aabbb: length=3 substring=bbb\nmax-window k=1: sum=-1 window=[-1] at 1\npair-sorted target=3: 1+2 steps=1\n", hidden: true },
          ],
        },
        {
          title: "Stacks and breadth-first search",
          prompt: `Commands. \`brackets <s>\` — validate \`()[]{}\` with a stack: \`brackets "<s>": valid\`, \`invalid at <i> (unexpected '<c>')\` or \`invalid at <i> (unclosed '<c>')\`. \`next-greater <nums…>\` — the next greater element for each position via a monotonic stack, \`-1\` when none: \`next-greater [2,1,2,4,3] -> [4,2,4,-1,-1]\`. \`simplify-path <path>\` — collapse \`.\`, \`..\` and repeated slashes with a stack: \`simplify-path /a/./b/../../c/ -> /c\`. \`bfs <rows>\` followed by that many grid lines (\`S\` start, \`E\` end, \`#\` wall, \`.\` open) — the shortest path in four directions with an index-pointer queue: \`bfs <cols>x<rows>: shortest=<steps> visited=<n>\` or \`unreachable visited=<n>\`.

Example: the 4×4 grid \`S.#.\` / \`.##.\` / \`....\` / \`#..E\` → \`bfs 4x4: shortest=6 visited=11\`.`,
          starterFile: "code/stack-and-bfs.starter.js",
          solutionFile: "code/stack-and-bfs.solution.js",
          hints: ["Monotonic stack: while the top's value is smaller than the current, pop it and record the current as its answer; then push the current index.", "BFS: `for (let i = 0; i < queue.length; i++)` is the queue — never `shift()`; a `seen` Set keyed `r,c` prevents revisits."],
          cases: [
            { stdin: "brackets ([]{})\nbrackets ([)]\nbrackets ((\nbrackets ())\nnext-greater 2 1 2 4 3\nsimplify-path /a/./b/../../c/\nsimplify-path /../x//y/\nbfs 4\nS.#.\n.##.\n....\n#..E\nbfs 2\nS#\n#E\n", expected: "brackets \"([]{})\": valid\nbrackets \"([)]\": invalid at 2 (unexpected ')')\nbrackets \"((\": invalid at 1 (unclosed '(')\nbrackets \"())\": invalid at 2 (unexpected ')')\nnext-greater [2,1,2,4,3] -> [4,2,4,-1,-1]\nsimplify-path /a/./b/../../c/ -> /c\nsimplify-path /../x//y/ -> /x/y\nbfs 4x4: shortest=6 visited=11\nbfs 2x2: unreachable visited=1\n" },
            { stdin: "brackets \nnext-greater 5 4 3\nsimplify-path /\nbfs 1\nSE\n", expected: "brackets \"\": valid\nnext-greater [5,4,3] -> [-1,-1,-1]\nsimplify-path / -> /\nbfs 2x1: shortest=1 visited=2\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "\"Shortest path in an unweighted grid\" is a sign for…",
          options: ["DFS", "BFS — level-by-level expansion reaches the target first along a shortest path", "Binary search", "Dynamic programming"],
          answer: 1,
          explanation: "DFS finds *a* path; BFS finds the shortest one on unweighted graphs.",
        },
        {
          prompt: "In a sliding window, when the window becomes invalid you…",
          options: ["Restart from `right + 1`", "Move `left` forward in a `while` loop until it is valid again, then record the best", "Move `right` backward", "Reset the counts"],
          answer: 1,
          explanation: "Each index enters and leaves once, so the whole pass is O(n).",
        },
        {
          prompt: "In backtracking, recording an answer with `result.push(path)`…",
          options: ["Is correct", "Stores the live array that later `pop`s mutate — push a copy: `result.push([...path])`", "Is faster", "Throws"],
          answer: 1,
          explanation: "Choose, recurse, undo — and copy what you keep.",
        },
        {
          prompt: "JavaScript's built-in priority queue is…",
          options: ["`PriorityQueue`", "Nonexistent — write a ~30-line binary heap, or sort and slice for a one-shot top-k while saying what the heap would change", "`Array.prototype.heapify`", "`Map`"],
          answer: 1,
          explanation: "Interviewers accept the sort for small inputs when you name the trade-off.",
        },
        {
          prompt: "A solution that sorts and then does one linear pass is…",
          options: ["O(n)", "O(n log n) — the sort counts; state the complexity of the whole solution", "O(log n)", "O(n²)"],
          answer: 1,
          explanation: "Same for building a Map before a loop: the total, not the last step.",
        },
      ],
    },
    {
      slug: "the-idiom-sheet",
      file: "03-the-idiom-sheet.md",
      exercises: [
        {
          title: "The collection idioms as a command interpreter",
          prompt: `Line 1 lists records \`name:dept:age\`. Then commands: \`count <field>\` → \`count dept: eng=2 ops=2 hr=1\` (a \`Map\`, insertion order); \`group <field>\` → \`group dept: eng=[ann,bob] …\`; \`unique <field>\` → \`unique age: 30,25,41\` (a \`Set\`); \`sort <f1> <f2>\` → a **copy** sorted by the first field (numeric or \`localeCompare\`) then the second: \`sort age,name: cid(25) ann(30) …\`; \`chunk <n>\` → \`chunk 2: [ann,bob] [cid,dee] [eve]\`; \`top <k> <field>\` → the k most frequent values, ties broken alphabetically; \`range <a> <b>\` → \`range 3..7: 3,4,5,6,7\`; \`zip <f1> <f2>\` → \`zip name,age: ann=30 …\`; \`minmax <field>\` → via one \`reduce\` (never \`Math.max(...huge)\`): \`minmax age: 25..41\`; \`dedupe-by <field>\` → the last record per value through a \`Map\`: \`dedupe-by dept: bob(eng) dee(ops) eve(hr)\`.`,
          starterFile: "code/collection-idioms.starter.js",
          solutionFile: "code/collection-idioms.solution.js",
          hints: ["`(m.get(k) ?? m.set(k, []).get(k)).push(r)` is the group-by one-liner — `Map.set` returns the map.", "Multi-key sort: `cmp(f1)(a, b) || cmp(f2)(a, b)`, where `cmp` picks subtraction for numbers and `localeCompare` for strings."],
          cases: [
            { stdin: "ann:eng:30 bob:eng:30 cid:ops:25 dee:ops:41 eve:hr:30\ncount dept\ngroup dept\nunique age\nsort age name\nchunk 2\ntop 2 dept\nrange 3 7\nzip name age\nminmax age\ndedupe-by dept\n", expected: "count dept: eng=2 ops=2 hr=1\ngroup dept: eng=[ann,bob] ops=[cid,dee] hr=[eve]\nunique age: 30,25,41\nsort age,name: cid(25) ann(30) bob(30) eve(30) dee(41)\nchunk 2: [ann,bob] [cid,dee] [eve]\ntop 2 dept: eng=2 ops=2\nrange 3..7: 3,4,5,6,7\nzip name,age: ann=30 bob=30 cid=25 dee=41 eve=30\nminmax age: 25..41\ndedupe-by dept: bob(eng) dee(ops) eve(hr)\n" },
            { stdin: "zed:qa:50\ncount dept\nsort age name\nchunk 3\ntop 5 age\nminmax age\n", expected: "count dept: qa=1\nsort age,name: zed(50)\nchunk 3: [zed]\ntop 5 age: 50=1\nminmax age: 50..50\n", hidden: true },
          ],
        },
        {
          title: "The string idioms as a command interpreter",
          prompt: `Commands: \`reverse <s>\` by code points (\`reverse: 👍cba\` for \`abc👍\`); \`palindrome <text…>\` ignoring case and anything that is not a letter or digit; \`camel <kebab-case>\`; \`kebab <camelCase>\`; \`title <text…>\`; \`truncate <n> <text…>\` to n code points with a trailing \`…\` counting as one; \`rle <s>\` run-length encoding via a backreference regex (\`3a1b2c4d\`); \`count <char> <text…>\`; \`pad <width> <n>\` with \`padStart\`; \`words <text…>\` → \`words: <count> longest=<word>\`.

Example: \`palindrome A man, a plan, a canal: Panama\` → \`palindrome: true\`; \`truncate 5 hello world\` → \`truncate 5: hell…\`; \`rle 👍👍👍x\` → \`rle: 3👍1x\`.`,
          starterFile: "code/string-idioms.starter.js",
          solutionFile: "code/string-idioms.solution.js",
          hints: ["`/(.)\\1*/gsu` matches a run; with the `u` flag `.` is a whole code point, so measure the run with `[...run].length`.", "`s.replace(/-(\\w)/g, (_, c) => c.toUpperCase())` and `s.replace(/[A-Z]/g, (c) => \"-\" + c.toLowerCase())` convert the cases."],
          cases: [
            { stdin: "reverse abc👍\npalindrome A man, a plan, a canal: Panama\npalindrome not one\ncamel background-color-hover\nkebab backgroundColorHover\ntitle hELLO wORLD from js\ntruncate 5 hello world\ntruncate 20 short\nrle aaabccdddd\ncount a banana bread\npad 5 42\nwords the quick brown fox jumps\n", expected: "reverse: 👍cba\npalindrome: true\npalindrome: false\ncamel: backgroundColorHover\nkebab: background-color-hover\ntitle: Hello World From Js\ntruncate 5: hell…\ntruncate 20: short\nrle: 3a1b2c4d\ncount a: 4\npad: 00042\nwords: 5 longest=quick\n" },
            { stdin: "reverse 😀👍\nrle 👍👍👍x\ntruncate 3 abcdef\npad 2 12345\nwords   spaced    out  \n", expected: "reverse: 👍😀\nrle: 3👍1x\ntruncate 3: ab…\npad: 12345\nwords: 2 longest=spaced\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "`Math.max(...arr)` on an array of 200 000 numbers…",
          options: ["Returns the maximum", "Can throw a `RangeError` (too many arguments) — use a `reduce`", "Returns `NaN`", "Is O(log n)"],
          answer: 1,
          explanation: "Spread into a call is bounded by the argument limit.",
        },
        {
          prompt: "`[\"1\", \"2\", \"3\"].map(parseInt)` gives…",
          options: ["`[1, 2, 3]`", "`[1, NaN, NaN]` — `map` passes the index as `parseInt`'s radix; use `Number` or `(s) => parseInt(s, 10)`", "`[\"1\", \"2\", \"3\"]`", "A `TypeError`"],
          answer: 1,
          explanation: "Every idiom on the sheet has a trap like this one.",
        },
        {
          prompt: "`[...s].reverse().join(\"\")` rather than `s.split(\"\").reverse().join(\"\")` because…",
          options: ["It is shorter", "Spread iterates code points, so surrogate pairs (emoji) stay intact; `split(\"\")` splits them", "`split` is deprecated", "It is faster"],
          answer: 1,
          explanation: "`\"👍\".length` is 2; the string is UTF-16 underneath.",
        },
        {
          prompt: "`JSON.parse(JSON.stringify(obj))` as a deep clone…",
          options: ["Is exact", "Loses `undefined`, functions, `Map`/`Set`, turns `Date` into a string and `NaN` into `null`, and throws on cycles", "Keeps prototypes", "Is the fastest possible"],
          answer: 1,
          explanation: "`structuredClone` or a recursive clone with a seen-map is the real answer.",
        },
        {
          prompt: "`[].reduce((a, b) => a + b)`…",
          options: ["Returns `0`", "Throws a `TypeError` — no seed and no elements; always pass an initial value", "Returns `undefined`", "Returns `[]`"],
          answer: 1,
          explanation: "The seed also fixes the accumulator's type.",
        },
      ],
    },
    {
      slug: "implement-the-built-in",
      file: "04-implement-the-built-in.md",
      exercises: [
        {
          title: "bind, call, apply, new and instanceof by hand",
          prompt: `Implement \`Function.prototype.myCall\`/\`myApply\` (bind \`this\` through a temporary symbol-keyed method), \`myBind\` (pre-applied arguments **and** the \`new\` case — a bound function called with \`new\` ignores the bound \`this\` and keeps the prototype chain), \`myNew(Ctor, …args)\` (an object returned by the constructor replaces \`this\`) and \`myInstanceOf(value, Ctor)\` (walk the prototype chain; primitives and \`null\` are \`false\`). The starter's checks compare each against the native behaviour; stdin lists check names or \`all\`. Print \`ok <check>: <detail> match=true\` per check and \`<n>/<total> match the native behaviour\`.

Example (\`all\`) →
\`\`\`
ok call: hi, Ada! match=true
ok apply: 9 match=true
ok bind-partial: add(10)(5)=15 match=true
ok bind-this: n=2 match=true
ok bind-new: {x:1,y:2} instanceof Point=true sum=3 match=true
ok new-plain: {x:1,y:2} sum=3 match=true
ok new-returns-object: {"custom":true} match=true
ok instanceof: dog->Dog,Animal,Object,Array | [],5,null,nullProto->Object = true,true,true,false,true,false,false,false match=true
8/8 match the native behaviour
\`\`\``,
          starterFile: "code/bind-new-instanceof.starter.js",
          solutionFile: "code/bind-new-instanceof.solution.js",
          hints: ["Inside `bound`, `this instanceof bound` is true only for a `new` call — then use `this` instead of the bound `thisArg`; set `bound.prototype = Object.create(target.prototype)`.", "`myNew`: `Object.create(Ctor.prototype)`, apply, and return the constructor's result only if it is an object or function."],
          cases: [
            { stdin: "all\n", expected: "ok call: hi, Ada! match=true\nok apply: 9 match=true\nok bind-partial: add(10)(5)=15 match=true\nok bind-this: n=2 match=true\nok bind-new: {x:1,y:2} instanceof Point=true sum=3 match=true\nok new-plain: {x:1,y:2} sum=3 match=true\nok new-returns-object: {\"custom\":true} match=true\nok instanceof: dog->Dog,Animal,Object,Array | [],5,null,nullProto->Object = true,true,true,false,true,false,false,false match=true\n8/8 match the native behaviour\n" },
            { stdin: "bind-new\ninstanceof\nnew-returns-object\n", expected: "ok bind-new: {x:1,y:2} instanceof Point=true sum=3 match=true\nok instanceof: dog->Dog,Animal,Object,Array | [],5,null,nullProto->Object = true,true,true,false,true,false,false,false match=true\nok new-returns-object: {\"custom\":true} match=true\n3/3 match the native behaviour\n", hidden: true },
          ],
        },
        {
          title: "The array methods from scratch",
          prompt: `Line 1 lists elements — numbers, \`NaN\`, words, JSON arrays like \`[3,[4,[5]]]\` and \`_\` for a **hole**. Implement \`myForEach\`, \`myMap\`, \`myFilter\`, \`myReduce\`, \`myFlat(depth = 1)\`, \`myFlatMap\`, \`myIncludes\` and \`myIndexOf\` on \`Array.prototype\` with the spec details: holes are skipped by the callbacks (\`map\` keeps them as holes), \`thisArg\` is honoured, \`reduce\` without a seed starts from the first present element and throws \`TypeError\` on an empty array, \`includes\` uses SameValueZero (finds \`NaN\`, reads a hole as \`undefined\`) while \`indexOf\` uses \`===\` and skips holes. The starter's \`show\` renders holes as \`<hole>\`; print each comparison as \`<label>: <mine> match=<bool>\`.

Example: \`1 _ 2 NaN hello [3,[4,[5]]] _\` → \`map x2: [2,<hole>,4,NaN,"hello",[3,[4,[5]]],<hole>] match=true\`, \`flat(Infinity): [1,2,NaN,"hello",3,4,5] match=true\`, \`includes(NaN): true match=true\`, \`indexOf(NaN): -1 match=true\`, \`includes(undefined) (a hole reads as undefined): true match=true\`.`,
          starterFile: "code/array-methods-from-scratch.starter.js",
          solutionFile: "code/array-methods-from-scratch.solution.js",
          hints: ["`i in this` is the hole test; `new Array(this.length)` then assigning only present indices keeps holes in `myMap`.", "Take the seed as a rest parameter — `seed.length` distinguishes \"no seed\" from \"seed is undefined\", which is what the spec checks with `arguments.length`."],
          cases: [
            { stdin: "1 _ 2 NaN hello [3,[4,[5]]] _\n", expected: "forEach visits (holes skipped): 5 match=true\nmap x2: [2,<hole>,4,NaN,\"hello\",[3,[4,[5]]],<hole>] match=true\nfilter numbers: [1,2] match=true\nreduce sum: 3 match=true\nreduce on [] without a seed: TypeError match=true\nreduce on [] with seed: 0 match=true\nflat(): [1,2,NaN,\"hello\",3,[4,[5]]] match=true\nflat(Infinity): [1,2,NaN,\"hello\",3,4,5] match=true\nflatMap [x,x]: [1,1,2,2,NaN,NaN,\"hello\",\"hello\",3,[4,[5]]] match=true\nincludes(NaN): true match=true\nindexOf(NaN): -1 match=true\nincludes(undefined) (a hole reads as undefined): true match=true\nindexOf(undefined) (holes skipped): -1 match=true\n" },
            { stdin: "1 2 3\n", expected: "forEach visits (holes skipped): 3 match=true\nmap x2: [2,4,6] match=true\nfilter numbers: [1,2,3] match=true\nreduce sum: 6 match=true\nreduce on [] without a seed: TypeError match=true\nreduce on [] with seed: 0 match=true\nflat(): [1,2,3] match=true\nflat(Infinity): [1,2,3] match=true\nflatMap [x,x]: [1,1,2,2,3,3] match=true\nincludes(NaN): false match=true\nindexOf(NaN): -1 match=true\nincludes(undefined) (a hole reads as undefined): false match=true\nindexOf(undefined) (holes skipped): -1 match=true\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "A hand-written `bind` is most often wrong about…",
          options: ["Argument order", "The `new` case — a bound function called with `new` must ignore the bound `this` and keep the prototype chain", "Return values", "Arrow functions"],
          answer: 1,
          explanation: "Detect it with `this instanceof bound` (or `new.target`) inside the wrapper.",
        },
        {
          prompt: "`Promise.all` implemented by pushing results as they arrive…",
          options: ["Is correct", "Breaks the contract — results must be in **input** order; write `results[i] = value` and count settled promises", "Is faster", "Rejects on the first success"],
          answer: 1,
          explanation: "Also: an empty input must resolve `[]` immediately, and the first rejection wins.",
        },
        {
          prompt: "A `then` handler registered on an already-settled promise runs…",
          options: ["Synchronously, right away", "Asynchronously in a microtask — always, so ordering is predictable", "On the next timer tick", "Never"],
          answer: 1,
          explanation: "Handlers also run in a fresh promise's context: their return value resolves the next promise, a thrown error rejects it.",
        },
        {
          prompt: "`JSON.stringify({ a: undefined, b: [undefined] })`…",
          options: ["`{\"a\":undefined,\"b\":[undefined]}`", "`{\"b\":[null]}` — `undefined` is omitted from objects but becomes `null` in arrays", "Throws", "`{\"a\":null,\"b\":[null]}`"],
          answer: 1,
          explanation: "Functions and symbols behave the same; `NaN`/`Infinity` become `null`; cycles throw.",
        },
        {
          prompt: "`[1, , 3].map(f)` calls `f`…",
          options: ["Three times", "Twice — holes are skipped and preserved in the result; `includes(undefined)` on that array is nonetheless `true`", "Once", "Zero times"],
          answer: 1,
          explanation: "`i in arr` is the hole test a reimplementation needs.",
        },
      ],
    },
    {
      slug: "theory-drill",
      file: "05-theory-drill.md",
      exercises: [
        {
          title: "A Leitner flashcard scheduler",
          prompt: `Line 1 is \`cards: a b c …\` (every card starts in box 1). Each following line is \`session <n>: a=ok b=miss …\`. Box 1 is due every session, box 2 every second session, box 3 every fourth; box 4 is mastered and retired (printed \`M\`). A due card answered \`ok\` moves up one box; \`miss\` sends it back to box 1; a due card with no result is \`skipped\`; a result for a card that was not due is \`ignored\`. Print per session \`session <n>: due=[…] ok=[…] miss=[…]\` (plus \` skipped=[…]\` / \` ignored=[…]\` when non-empty) \` -> a=2 b=1 …\`, then \`mastered: … | box3: … | box2: … | box1: …\` (\`-\` for empty) and \`next due (session <n+1>): […]\`.

Example: four cards, four sessions →
\`\`\`
session 1: due=[a,b,c,d] ok=[a,b,d] miss=[c] -> a=2 b=2 c=1 d=2
session 2: due=[a,b,c,d] ok=[a,c,d] miss=[b] -> a=3 b=1 c=2 d=3
session 3: due=[b] ok=[] miss=[] skipped=[b] ignored=[c,a] -> a=3 b=1 c=2 d=3
session 4: due=[a,b,c,d] ok=[a,b,c,d] miss=[] -> a=M b=2 c=3 d=M
mastered: a,d | box3: c | box2: b | box1: -
next due (session 5): []
\`\`\``,
          starterFile: "code/leitner-scheduler.starter.js",
          solutionFile: "code/leitner-scheduler.solution.js",
          hints: ["`due = cards where box < 4 && session % INTERVAL[box] === 0` with `INTERVAL = { 1: 1, 2: 2, 3: 4 }`.", "Parse results into an object with `Object.fromEntries`; iterate the due list for ok/miss/skipped, then the results' keys for ignored."],
          cases: [
            { stdin: "cards: a b c d\nsession 1: a=ok b=ok c=miss d=ok\nsession 2: a=ok b=miss c=ok d=ok\nsession 3: c=ok a=ok\nsession 4: a=ok b=ok c=ok d=ok\n", expected: "session 1: due=[a,b,c,d] ok=[a,b,d] miss=[c] -> a=2 b=2 c=1 d=2\nsession 2: due=[a,b,c,d] ok=[a,c,d] miss=[b] -> a=3 b=1 c=2 d=3\nsession 3: due=[b] ok=[] miss=[] skipped=[b] ignored=[c,a] -> a=3 b=1 c=2 d=3\nsession 4: due=[a,b,c,d] ok=[a,b,c,d] miss=[] -> a=M b=2 c=3 d=M\nmastered: a,d | box3: c | box2: b | box1: -\nnext due (session 5): []\n" },
            { stdin: "cards: x\nsession 1: x=miss\nsession 2:\n", expected: "session 1: due=[x] ok=[] miss=[x] -> x=1\nsession 2: due=[x] ok=[] miss=[] skipped=[x] -> x=1\nmastered: - | box3: - | box2: - | box1: x\nnext due (session 3): [x]\n", hidden: true },
          ],
        },
        {
          title: "An answer grader",
          prompt: `Line 1 is \`keywords: a, b, c\` (the terms a strong answer mentions), line 2 \`misconceptions: x, y\` (phrases that mark a wrong model); the remaining lines are \`<candidate>: <answer>\`. Normalise the answer (lower-case, punctuation to spaces, collapsed whitespace, padded with spaces) and match each keyword and misconception as a whole phrase. Score = coverage % minus 25 per flagged misconception; grade \`strong\` (≥ 80% coverage, nothing flagged), \`partial\` (≥ 50%), else \`weak\`, with \` (misconception)\` appended to partial/weak when something was flagged. Print, sorted by score then name, \`<name>: coverage=<hit>/<total> (<pct>%) missing=[…] flagged=[…] words=<n>\` (plus \` (long)\` past 60 words) \` -> <grade>\`, then \`best: <name>\`.

Example (garbage collection) →
\`\`\`
ada: coverage=5/6 (83%) missing=[reachable] flagged=[] words=29 -> strong
bob: coverage=1/6 (17%) missing=[reachable, roots, scavenge, promoted, mark-sweep] flagged=[reference count, frees immediately] words=17 -> weak (misconception)
cid: coverage=0/6 (0%) missing=[…] flagged=[] words=10 -> weak
best: ada
\`\`\`
"unreachable" does not count as "reachable" — the padded-phrase match is deliberate.`,
          starterFile: "code/answer-grader.starter.js",
          solutionFile: "code/answer-grader.solution.js",
          hints: ["Keep hyphens in the normalisation so `mark-sweep` survives: `/[^\\p{L}\\p{N}\\s-]/gu`.", "Pad the normalised text with a space on both ends and search for `\" \" + phrase + \" \"` — a cheap whole-phrase match."],
          cases: [
            { stdin: "keywords: reachable, roots, generational, scavenge, promoted, mark-sweep\nmisconceptions: reference count, frees immediately\nada: Objects unreachable from the roots are garbage. V8 is generational: young objects are freed by a cheap scavenge, survivors get promoted to old space, which is collected by mark-sweep.\nbob: The engine keeps a reference count and frees immediately when it hits zero; the heap is generational.\ncid: It cleans up memory automatically when you stop using variables.\n", expected: "ada: coverage=5/6 (83%) missing=[reachable] flagged=[] words=29 -> strong\nbob: coverage=1/6 (17%) missing=[reachable, roots, scavenge, promoted, mark-sweep] flagged=[reference count, frees immediately] words=17 -> weak (misconception)\ncid: coverage=0/6 (0%) missing=[reachable, roots, generational, scavenge, promoted, mark-sweep] flagged=[] words=10 -> weak\nbest: ada\n" },
            { stdin: "keywords: closure, scope, lexical\nmisconceptions: copies the variables\nzed: A closure is a function plus the lexical scope it was created in; it keeps the scope alive by reference, it never copies the variables.\n", expected: "zed: coverage=3/3 (100%) missing=[] flagged=[copies the variables] words=25 -> partial (misconception)\nbest: zed\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "The two-sentence answer to \"what is a closure?\" is…",
          options: ["\"It's like a function inside a function\"", "A function keeps access to the variables of the scope where it was created, even after that scope has returned; this implements private state, memoisation and module patterns", "A way to copy variables", "A class"],
          answer: 1,
          explanation: "Definition first, example only if asked; then stop and take the follow-up.",
        },
        {
          prompt: "Microtasks versus macrotasks:",
          options: ["Both run one per loop turn", "Microtasks (promise reactions, `queueMicrotask`) drain completely before the loop continues; one macrotask (timer, I/O) runs per turn", "Timers are microtasks", "There is no difference in Node"],
          answer: 1,
          explanation: "Node runs `process.nextTick` callbacks before the microtasks.",
        },
        {
          prompt: "CORS protects…",
          options: ["The server from attackers", "Users — the browser blocks cross-origin responses unless the server opts in; it is not authentication", "The database", "Cookies from JavaScript"],
          answer: 1,
          explanation: "`HttpOnly` cookies and CSP answer the other two threats.",
        },
        {
          prompt: "\"`const` makes an object immutable.\"",
          options: ["True", "False — `const` fixes the binding, not the value; `Object.freeze` is shallow immutability, and deep immutability needs copy-on-write discipline", "True for arrays only", "True in strict mode"],
          answer: 1,
          explanation: "One of the classic confusions the drill exists to remove.",
        },
        {
          prompt: "When you do not know a theory answer you should…",
          options: ["Guess confidently", "Say so cleanly, reduce it to something you do know if possible, and move on", "Change the subject", "Answer a different question"],
          answer: 1,
          explanation: "Guessing confidently and wrong is the worst outcome; a clean \"I don't know that one\" is not.",
        },
      ],
    },
    {
      slug: "interview-checkpoint",
      file: "06-checkpoint.md",
      kind: "test",
      passMark: 70,
      exercises: [
        {
          title: "A Promise from scratch",
          prompt: `Implement \`MyPromise\`: one-shot settlement; \`then\`/\`catch\`/\`finally\` returning new promises; handlers always run asynchronously (\`queueMicrotask\`) even on a settled promise; missing handlers pass the value or reason through; a handler's return value resolves the next promise and a throw rejects it; thenables are **adopted** both when returned from a handler and when passed to \`resolve\` (another \`MyPromise\`, a plain \`{ then }\` object, or a native \`Promise\`); an executor that throws rejects. Statics: \`resolve\`, \`reject\`, \`all\` (input order, fail-fast, \`[]\` resolves at once), \`allSettled\`, \`race\` and \`any\` (\`AggregateError\` when every input rejects, including an empty input). The starter's scenarios — \`chain adopt reject order all allSettled race any\`, chosen by stdin — drive it and print \`[<scenario>] <message>\` lines.

Example (\`order\`) →
\`\`\`
[order] sync 1
[order] sync 2 (then already registered)
[order] then on a settled promise
[order] queueMicrotask registered after
\`\`\`
The \`then\` on an already-fulfilled promise still ran after the synchronous code — and before a microtask queued later.`,
          starterFile: "code/promise-from-scratch.starter.js",
          solutionFile: "code/promise-from-scratch.solution.js",
          hints: ["Separate `settle(state, value)` (one-shot, flushes handlers) from `doResolve(value)` (adopts thenables with a once-guard, else settles fulfilled); the public `resolve`/`reject` are guarded by a `called` flag.", "`then` pushes `run` onto the handler list while pending and calls it immediately otherwise; `run` itself queues the microtask."],
          cases: [
            { stdin: "chain\nadopt\nreject\norder\n", expected: "[chain] step 2\n[chain] step 20\n[chain] fulfilled undefined\n[chain] fulfilled \"x\"\n[adopt] fulfilled 201\n[adopt] fulfilled \"adopted in executor\"\n[adopt] rejected Error: adopted rejection\n[reject] caught boom\n[reject] finally ran\n[reject] fulfilled \"after recovered\"\n[reject] fulfilled \"caught RangeError\"\n[reject] rejected Error: executor threw\n[reject] rejected \"plain value\"\n[order] sync 1\n[order] sync 2 (then already registered)\n[order] then on a settled promise\n[order] queueMicrotask registered after\n" },
            { stdin: "all\nallSettled\nrace\nany\n", expected: "[all] fulfilled [\"a\",\"b\",\"c\"] settledOrder=b,c,a\n[all] fulfilled [1,2,3]\n[all] fulfilled []\n[all] rejected Error: fast-fail settledSoFar=fast-fail (rejected before the slow task finished)\n[allSettled] fulfilled [\"fulfilled:a\",\"rejected:b\",\"fulfilled:3\"]\n[allSettled] fulfilled []\n[race] rejected Error: fast\n[race] fulfilled \"immediate\"\n[race] race([]) stays pending forever\n[any] fulfilled \"c\"\n[any] fulfilled \"AggregateError: All promises were rejected [x,y]\"\n[any] fulfilled \"AggregateError with 0 errors\"\n", hidden: true },
          ],
        },
        {
          title: "JSON.stringify from scratch",
          prompt: `Write \`stringify(value, replacer, indent)\` matching the native one. Each input line is \`<expression> | <replacer expression or -> | <indent expression or ->\` (the starter evaluates them); print \`mine=<result> match=<bool>\` — or \`throws <ErrorName> match=<bool>\` when yours throws — comparing against \`JSON.stringify\`. The details: \`toJSON\` is applied first (Dates), then a replacer **function** (called with \`this\` = the holder); an **array** replacer is an allow-list applied in *its* order at every level; \`undefined\`, functions and symbols are omitted from objects and become \`null\` in arrays; \`NaN\`/\`±Infinity\` become \`null\`; boxed primitives unwrap; BigInt and cycles throw \`TypeError\`; strings are escaped (\`"\`, \`\\\`, control characters as \`\\b \\f \\n \\r \\t\` or \`\\u00XX\`); a numeric indent is capped at 10 spaces and a string indent at 10 characters, with \`": "\` after keys only when indenting; empty containers print \`{}\`/\`[]\`.

Example: \`{a: 1, b: 2, c: {a: 3, b: 4}} | ["c", "a"] | -\` → \`mine={"c":{"a":3},"a":1} match=true\`; a self-referencing object → \`throws TypeError match=true\`.`,
          starterFile: "code/json-stringify-from-scratch.starter.js",
          solutionFile: "code/json-stringify-from-scratch.solution.js",
          hints: ["Serialise recursively with `(holder, key, value, depth)`: apply `toJSON`, then the replacer, then switch on `typeof`; return `undefined` for the omitted kinds so arrays can substitute `null` and objects can skip.", "Keep a stack of the objects being serialised; seeing one again is the cycle."],
          cases: [
            { stdin: "{a: undefined, b: [undefined, () => 1, Symbol(\"s\")], c: NaN, d: -Infinity, e: \"q\\\"uote\\n\\ttab\", f: null} | - | -\n{date: new Date(0), nested: {n: 1, arr: [1, [2, [3]]], empty: {}, none: []}} | - | 2\n{a: 1, b: 2, c: {a: 3, b: 4}} | [\"c\", \"a\"] | -\n{a: 1, b: \"x\", c: [2, 3]} | (k, v) => typeof v === \"number\" ? v * 10 : v | -\n(() => { const o = { name: \"loop\" }; o.self = o; return o; })() | - | -\n{ big: 10n } | - | -\n[new Number(3), new String(\"s\"), new Boolean(false), null] | - | -\n{ toJSON() { return { replaced: true }; }, ignored: 1 } | - | -\n\"plain string\" | - | -\nundefined | - | -\n{ b: 1, 2: \"two\", a: 3, 1: \"one\", m: new Map([[1, 2]]), s: new Set([1]) } | - | -\n{a: [], b: {c: [1]}} | - | \"\\t\"\n", expected: "mine={\"b\":[null,null,null],\"c\":null,\"d\":null,\"e\":\"q\\\"uote\\n\\ttab\",\"f\":null} match=true\nmine={\n  \"date\": \"1970-01-01T00:00:00.000Z\",\n  \"nested\": {\n    \"n\": 1,\n    \"arr\": [\n      1,\n      [\n        2,\n        [\n          3\n        ]\n      ]\n    ],\n    \"empty\": {},\n    \"none\": []\n  }\n} match=true\nmine={\"c\":{\"a\":3},\"a\":1} match=true\nmine={\"a\":10,\"b\":\"x\",\"c\":[20,30]} match=true\nthrows TypeError match=true\nthrows TypeError match=true\nmine=[3,\"s\",false,null] match=true\nmine={\"replaced\":true} match=true\nmine=\"plain string\" match=true\nmine=undefined match=true\nmine={\"1\":\"one\",\"2\":\"two\",\"b\":1,\"a\":3,\"m\":{},\"s\":{}} match=true\nmine={\n\t\"a\": [],\n\t\"b\": {\n\t\t\"c\": [\n\t\t\t1\n\t\t]\n\t}\n} match=true\n" },
            { stdin: "[1, [2, [3, [4]]]] | - | 12\n{x: 1} | (k, v) => (k === \"\" ? v : undefined) | -\n{\"weird key\": String.fromCharCode(8, 12) + \"é\"} | - | -\n", expected: "mine=[\n          1,\n          [\n                    2,\n                    [\n                              3,\n                              [\n                                        4\n                              ]\n                    ]\n          ]\n] match=true\nmine={} match=true\nmine={\"weird key\":\"\\b\\fé\"} match=true\n", hidden: true },
          ],
        },
        {
          title: "A deep-equality and deep-clone toolkit",
          prompt: `Implement \`deepEqual(a, b)\` (\`Object.is\` for primitives so \`NaN\` equals \`NaN\` and \`0\` differs from \`-0\`; same prototype; \`Date\` by time; \`RegExp\` by source and flags; \`Map\`/\`Set\` by entries; arrays by elements; objects by own keys; cycles via a seen-map), \`deepClone(value)\` (primitives, \`Date\`, \`RegExp\`, \`Map\`, \`Set\`, arrays and objects keeping their prototype; a \`WeakMap\` of clones so **cycles and shared references** survive), and \`flatten\`/\`unflatten\` with dotted keys where arrays and empty objects are leaves. Commands: \`equal <expected> ||| <a> ||| <b>\`, \`clone <expr>\` (checks equality, distinctness, a \`self\` cycle, \`x\`/\`y\` shared references and per-key prototypes), \`flatten <expr>\` (prints the flat JSON and checks the round trip). Output is TAP: \`ok <n> - …\` / \`not ok <n> - …\`, then \`1..<n>\` and \`# pass <p> fail <f>\`.

Example: \`clone (() => { const shared = { v: 1 }; const o = { x: shared, y: shared, when: new Date(0), tags: new Set([1]) }; o.self = o; return o; })()\` → \`ok 7 - clone: equal=true distinct=true cycle=kept shared=kept typesKept=true\`; \`flatten {a: {b: {c: 1}, d: [1, 2]}, e: "x", f: {}}\` → \`ok 9 - flatten {"a.b.c":1,"a.d":[1,2],"e":"x","f":{}} roundtrip=true\`.`,
          starterFile: "code/deep-toolkit.starter.js",
          solutionFile: "code/deep-toolkit.solution.js",
          hints: ["Register the clone in the seen-map *before* recursing into children — that is what makes `o.self = o` terminate and `x`/`y` stay one object.", "In `deepEqual`, `seen.get(a) === b` returning `true` for a pair already under comparison is the standard cycle rule."],
          cases: [
            { stdin: "equal true ||| {a: [1, {b: NaN}], d: new Date(0)} ||| {a: [1, {b: NaN}], d: new Date(0)}\nequal false ||| {a: 1} ||| {a: 1, b: undefined}\nequal false ||| [1, 2] ||| [2, 1]\nequal true ||| new Map([[\"k\", [1]]]) ||| new Map([[\"k\", [1]]])\nequal false ||| {n: 1} ||| Object.assign(Object.create(null), {n: 1})\nequal false ||| 0 ||| -0\nclone (() => { const shared = { v: 1 }; const o = { x: shared, y: shared, when: new Date(0), tags: new Set([1]), m: new Map([[1, {z: 2}]]), re: /a/g }; o.self = o; return o; })()\nclone [1, [2, [3]]]\nflatten {a: {b: {c: 1}, d: [1, 2]}, e: \"x\", f: {}}\n", expected: "ok 1 - equal {a: [1, {b: NaN}], d: new Date(0)} vs {a: [1, {b: NaN}], d: new Date(0)} -> true\nok 2 - equal {a: 1} vs {a: 1, b: undefined} -> false\nok 3 - equal [1, 2] vs [2, 1] -> false\nok 4 - equal new Map([[\"k\", [1]]]) vs new Map([[\"k\", [1]]]) -> true\nok 5 - equal {n: 1} vs Object.assign(Object.create(null), {n: 1}) -> false\nok 6 - equal 0 vs -0 -> false\nok 7 - clone: equal=true distinct=true cycle=kept shared=kept typesKept=true\nok 8 - clone: equal=true distinct=true cycle=n/a shared=n/a typesKept=true\nok 9 - flatten {\"a.b.c\":1,\"a.d\":[1,2],\"e\":\"x\",\"f\":{}} roundtrip=true\n1..9\n# pass 9 fail 0\n" },
            { stdin: "equal true ||| NaN ||| NaN\nequal true ||| /a+/gi ||| /a+/gi\nequal false ||| new Set([1]) ||| new Set([2])\nclone {p: 1}\nflatten {x: 1}\n", expected: "ok 1 - equal NaN vs NaN -> true\nok 2 - equal /a+/gi vs /a+/gi -> true\nok 3 - equal new Set([1]) vs new Set([2]) -> false\nok 4 - clone: equal=true distinct=true cycle=n/a shared=n/a typesKept=true\nok 5 - flatten {\"x\":1} roundtrip=true\n1..5\n# pass 5 fail 0\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "Stating the brute force before the optimal solution…",
          options: ["Wastes time", "Shows you separate understanding from optimisation and gives you a working fallback if the clever idea stalls", "Is only for junior candidates", "Lowers your score"],
          answer: 1,
          explanation: "Name its complexity, then say what repeated work the better approach removes.",
        },
        {
          prompt: "\"Longest substring with at most k distinct characters\" is…",
          options: ["Binary search", "A sliding window with a count `Map`, shrinking from the left while `map.size > k`", "Backtracking", "A heap problem"],
          answer: 1,
          explanation: "Delete keys at count 0 so `size` means distinct.",
        },
        {
          prompt: "Using `arr.shift()` as a BFS queue on 10⁶ nodes is…",
          options: ["Fine", "O(n²) overall — each `shift` moves every remaining element; use an index pointer over the array", "O(n log n)", "Faster than a pointer"],
          answer: 1,
          explanation: "The same trap appears in the idiom sheet and the performance module.",
        },
        {
          prompt: "`new Set([NaN, NaN, 0, -0]).size` is…",
          options: ["4", "2 — `Set` uses SameValueZero: one `NaN`, and `0` equals `-0`", "3", "1"],
          answer: 1,
          explanation: "`includes` uses the same rule; `indexOf` and `===` do not find `NaN`.",
        },
        {
          prompt: "`\"b\" + \"a\" + +\"a\" + \"a\"`…",
          options: ["Is `\"baaa\"`", "Is `\"baNaNa\"` — the unary plus turns `\"a\"` into `NaN`, which concatenates as text", "Throws", "Is `\"ba\"`"],
          answer: 1,
          explanation: "Coercion questions are traps on the idiom sheet; know the rule, not the meme.",
        },
        {
          prompt: "A hand-written `new` must…",
          options: ["Always return the created object", "Create an object with `Ctor.prototype`, call `Ctor` with it as `this`, and return the constructor's result instead only when that result is an object", "Call `Object.freeze`", "Copy the prototype"],
          answer: 1,
          explanation: "Same rule the real `new` follows — a returned primitive is ignored.",
        },
        {
          prompt: "`Array.prototype.reduce` on a sparse `[, , 5]` with no seed…",
          options: ["Starts from `undefined`", "Starts from `5`, the first *present* element — holes are skipped; an all-holes array throws `TypeError`", "Throws", "Starts from `0`"],
          answer: 1,
          explanation: "Arity, not `undefined`-ness, decides whether a seed was given.",
        },
        {
          prompt: "In a correct `then`, a handler that returns a thenable…",
          options: ["Resolves the next promise with the thenable object itself", "Is adopted — the next promise follows the thenable's settlement", "Throws", "Is ignored"],
          answer: 1,
          explanation: "Adoption is what makes chains flatten instead of nesting.",
        },
        {
          prompt: "`JSON.stringify(obj, [\"c\", \"a\"])`…",
          options: ["Keeps all keys", "Keeps only `c` and `a`, in that order, at every level of the object", "Throws", "Sorts the keys"],
          answer: 1,
          explanation: "An array replacer is an allow-list; a function replacer is applied after `toJSON`.",
        },
        {
          prompt: "`deepClone` without a seen-map on an object with `o.self = o`…",
          options: ["Works", "Recurses forever (stack overflow) — register each clone before descending into its children", "Returns `null`", "Copies the reference"],
          answer: 1,
          explanation: "The same map makes shared references stay shared in the copy.",
        },
        {
          prompt: "Two heap snapshots compared, and the retainer path of a grown class, answer the question…",
          options: ["\"Why is my code slow?\"", "\"How do you find a memory leak?\"", "\"What is the event loop?\"", "\"How does `this` work?\""],
          answer: 1,
          explanation: "Two sentences, then stop; the follow-up is where the depth goes.",
        },
        {
          prompt: "The best response to a theory question you cannot answer is…",
          options: ["A confident guess", "\"I don't know that one\" — cleanly, optionally reducing it to something you do know", "Silence", "Asking to skip the interview"],
          answer: 1,
          explanation: "Interviewers help candidates who expose their reasoning; they cannot help a bluff.",
        },
      ],
    },
  ],
});

import { defineModule } from "../../dsl.js";

export default defineModule(import.meta.url, {
  slug: "modules-and-node",
  title: "Modules and Node",
  blurb: "CommonJS and ES modules, resolution and interop; package.json, npm, semver and lockfiles; the core modules — path, fs, process, events, url, crypto; Buffers and streams with pipeline and backpressure; arguments, environment, exit codes, signals, child processes and workers.",
  icon: "box",
  overview: `A JavaScript program bigger than one file lives inside a module system, a package, and a process — and each has rules that are invisible until they break: \`Cannot use import statement outside a module\`, a dependency that installs a different version in CI, a script that exits 0 after failing, a stream that silently stops on error. This module is the Node platform as a working developer meets it.

It opens with the two module systems — how \`require\` and \`import\` load, cache and bind, how Node decides which one a file is, and how they interoperate on Node 16 — then packages: the \`package.json\` fields that matter, the resolution algorithm precisely enough to debug it, semver ranges and why the lockfile is committed. The core-module lesson is a tour of \`path\`, \`fs\`, \`process\`, \`util\`, \`events\`, \`url\` and \`crypto\` with the idiom and the trap for each. Streams get a full lesson — Buffers and encodings, the four stream kinds, \`pipeline\` over \`pipe\`, backpressure, object-mode Transforms. The last lesson is the process itself: parsing arguments, configuration through the environment, exit codes and signals, safe child processes, and when to reach for workers.

The exercises run on real Node: import a live ES module from a \`data:\` URL, implement the \`require\` resolution algorithm over a virtual file tree, write a semver matcher, audit a \`package.json\`, round-trip files through a temp directory, decode Buffers across a split UTF-8 boundary, build object-mode stream pipelines, parse argv and \`.env\` files — and finish with a module-graph loader that detects cycles, a log-summarising pipeline, and a configuration CLI with flag > env > default precedence.`,
  lessons: [
    {
      slug: "commonjs-and-esm",
      file: "01-commonjs-and-esm.md",
      exercises: [
        {
          title: "Live bindings, observed",
          prompt: `The starter defines an ES module as a \`data:\` URL exporting \`let count\`, \`inc()\` and a default. Import it with \`await import(url)\`, print \`count before=<>\`, call \`inc()\` the number of times given on input, print \`count after=<>\` (the binding is live), import the same URL again and print \`sameInstance=<again === ns> default=<ns.default>\`, then \`namespaceKeys=<sorted keys>\`, then try \`ns.count = 99\` and print \`assignToImport=<changed or the error's constructor name> stillCount=<ns.count>\`, and finally the CommonJS side of the same file: \`requireCached=<require("fs") === require("fs")> typeofRequire=<typeof require> dirnameIsString=<typeof __dirname === "string">\`.

Example: \`3\` →
\`\`\`
count before=0
count after=3
sameInstance=true default=the default
namespaceKeys=count,default,inc
assignToImport=TypeError stillCount=3
requireCached=true typeofRequire=function dirnameIsString=true
\`\`\``,
          starterFile: "code/esm-live-bindings.starter.js",
          solutionFile: "code/esm-live-bindings.solution.js",
          hints: ["import() works inside a CommonJS file and returns a promise of the namespace object.", "Module namespaces are read-only: assigning throws a TypeError in strict mode."],
          cases: [
            { stdin: "3\n", expected: "count before=0\ncount after=3\nsameInstance=true default=the default\nnamespaceKeys=count,default,inc\nassignToImport=TypeError stillCount=3\nrequireCached=true typeofRequire=function dirnameIsString=true\n" },
            { stdin: "0\n", expected: "count before=0\ncount after=0\nsameInstance=true default=the default\nnamespaceKeys=count,default,inc\nassignToImport=TypeError stillCount=0\nrequireCached=true typeofRequire=function dirnameIsString=true\n", hidden: true },
          ],
        },
        {
          title: "Implement require's resolution algorithm",
          prompt: `Over a virtual file tree, resolve CommonJS specifiers the way Node does. Input: \`file <absolute path>\` declares a file, \`pkg <dir> <main>\` declares a \`package.json\` with that \`main\`, \`require <fromDir> <specifier>\` asks for a resolution. Rules: a core module (\`fs\`, \`path\`, \`os\`, \`http\`, \`events\`, \`util\`, \`url\`, \`crypto\`, \`stream\`, with or without \`node:\`) → \`<core name>\`; a specifier starting with \`./\`, \`../\` or \`/\` → normalise against \`fromDir\`, then try the exact path, \`.js\`, \`.json\`, then as a directory (its \`main\`, then \`index.js\`/\`index.json\`); a bare name → for \`fromDir\` and each parent up to \`/\`, try \`<dir>/node_modules/<name>\` with the same file-then-directory logic. Print \`<fromDir> require(<spec>) -> <path>\` or \`-> MODULE_NOT_FOUND\`. Use \`path.posix\`.

Example (excerpt): with \`/app/src/util.js\`, \`/app/src/lib/index.js\`, \`/app/node_modules/lodash/lodash.js\` + \`pkg /app/node_modules/lodash lodash.js\`:
\`\`\`
/app/src require(./util) -> /app/src/util.js
/app/src require(./lib) -> /app/src/lib/index.js
/app/src/lib require(lodash) -> /app/node_modules/lodash/lodash.js
/app/src require(node:fs) -> <core fs>
/app/src require(express) -> MODULE_NOT_FOUND
\`\`\``,
          starterFile: "code/resolve-require.starter.js",
          solutionFile: "code/resolve-require.solution.js",
          hints: ["loadAs(base) = tryFile(base) ?? tryDirectory(base) — the same two probes serve relative paths and node_modules entries.", "Walk up with path.posix.dirname until it returns \"/\" (and try \"/\" itself)."],
          cases: [
            { stdin: "file /app/src/util.js\nfile /app/src/lib/index.js\nfile /app/node_modules/lodash/lodash.js\npkg /app/node_modules/lodash lodash.js\nfile /app/node_modules/tiny/index.js\nfile /app/src/data.json\nrequire /app/src ./util\nrequire /app/src ./lib\nrequire /app/src/lib ../data\nrequire /app/src/lib lodash\nrequire /app/src tiny\nrequire /app/src node:fs\nrequire /app/src ./nope\nrequire /app/src express\n", expected: "/app/src require(./util) -> /app/src/util.js\n/app/src require(./lib) -> /app/src/lib/index.js\n/app/src/lib require(../data) -> /app/src/data.json\n/app/src/lib require(lodash) -> /app/node_modules/lodash/lodash.js\n/app/src require(tiny) -> /app/node_modules/tiny/index.js\n/app/src require(node:fs) -> <core fs>\n/app/src require(./nope) -> MODULE_NOT_FOUND\n/app/src require(express) -> MODULE_NOT_FOUND\n" },
            { stdin: "file /x/node_modules/a/main.js\npkg /x/node_modules/a main.js\nrequire /x/deep/er a\nrequire /x path\n", expected: "/x/deep/er require(a) -> /x/node_modules/a/main.js\n/x require(path) -> <core path>\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "A `.js` file is treated as an ES module when…",
          options: ["It contains `import`", "The nearest `package.json` has `\"type\": \"module\"` (or the file is `.mjs`)", "It is in `src/`", "Node is version 16 or later"],
          answer: 1,
          explanation: "Get it wrong and you see `Cannot use import statement outside a module` or `require is not defined`.",
        },
        {
          prompt: "`const { count } = require(\"./counter\")` — when the module later increments its own `count`, the destructured variable…",
          options: ["Updates", "Keeps the old value — CommonJS hands out copies at require time; ESM imports would be live", "Becomes `undefined`", "Throws"],
          answer: 1,
          explanation: "Read `counter.count` through the exports object, or use ESM.",
        },
        {
          prompt: "On Node 16, a CommonJS file that needs an ESM-only package must…",
          options: ["`require` it", "Use `await import(\"pkg\")` — `require` of ESM throws `ERR_REQUIRE_ESM`", "Rename itself to `.mjs` only", "Bundle it"],
          answer: 1,
          explanation: "ESM importing CJS works the other way round (default export = `module.exports`).",
        },
        {
          prompt: "In a CommonJS cycle A → B → A, what does B receive from `require(\"./a\")`?",
          options: ["A `ReferenceError`", "A's **partial** exports as filled in so far — often an empty object — silently", "The complete module", "`null`"],
          answer: 1,
          explanation: "ESM throws on reading an uninitialised live binding instead; both mean the cycle should be broken.",
        },
        {
          prompt: "`import { area } from \"./math\"` fails in Node ESM because…",
          options: ["Named imports are not supported", "Relative ESM specifiers require the file extension: `\"./math.js\"`", "`math` is a core module", "It must be a default import"],
          answer: 1,
          explanation: "Bundlers hid this for years; Node does not guess.",
        },
      ],
    },
    {
      slug: "packages-and-npm",
      file: "02-packages-and-npm.md",
      exercises: [
        {
          title: "A semver range matcher",
          prompt: `Implement \`satisfies(version, range)\` for the ranges npm users type: an exact version; \`^x.y.z\` (same major; for \`^0.y.z\` same minor; for \`^0.0.z\` exact); \`~x.y.z\` (same minor); comparators \`>=\`, \`>\`, \`<=\`, \`<\`; wildcards \`1.x\`, \`1.2.x\`, \`*\`; and space-separated parts that must all hold. Commands: \`check <version> <range…>\` prints \`<range> vs <version>: <bool>\`; \`max <range> <versions…>\` prints \`max <range>: <highest satisfying version or none>\`.

Example (excerpt):
\`\`\`
^1.2.3 vs 1.9.0: true
^1.2.3 vs 2.0.0: false
~1.2.3 vs 1.3.0: false
^0.2.3 vs 0.3.0: false
>=1.2.0 <2.0.0 vs 1.999.0: true
max ^1.0.0: 1.10.0
\`\`\`
\`1.10.0\` beats \`1.4.2\` — compare numerically, never as strings.`,
          starterFile: "code/semver.starter.js",
          solutionFile: "code/semver.solution.js",
          hints: ["Turn each part into an inclusive lower bound and an exclusive upper bound; ^ and ~ differ only in which component of the upper bound is bumped.", "Sort candidates with a component-wise numeric comparator before taking the last."],
          cases: [
            { stdin: "check 1.9.0 ^1.2.3\ncheck 2.0.0 ^1.2.3\ncheck 1.2.9 ~1.2.3\ncheck 1.3.0 ~1.2.3\ncheck 0.2.9 ^0.2.3\ncheck 0.3.0 ^0.2.3\ncheck 1.5.2 1.x\ncheck 1.999.0 >=1.2.0 <2.0.0\ncheck 2.0.0 >=1.2.0 <2.0.0\ncheck 9.9.9 *\ncheck 1.2.3 1.2.3\ncheck 1.2.4 1.2.3\nmax ^1.0.0 0.9.0 1.0.0 1.4.2 2.0.0 1.10.0\nmax ~3.1.0 3.0.9 3.2.0\n", expected: "^1.2.3 vs 1.9.0: true\n^1.2.3 vs 2.0.0: false\n~1.2.3 vs 1.2.9: true\n~1.2.3 vs 1.3.0: false\n^0.2.3 vs 0.2.9: true\n^0.2.3 vs 0.3.0: false\n1.x vs 1.5.2: true\n>=1.2.0 <2.0.0 vs 1.999.0: true\n>=1.2.0 <2.0.0 vs 2.0.0: false\n* vs 9.9.9: true\n1.2.3 vs 1.2.3: true\n1.2.3 vs 1.2.4: false\nmax ^1.0.0: 1.10.0\nmax ~3.1.0: none\n" },
            { stdin: "check 0.0.4 ^0.0.3\ncheck 1.0.0 >1.0.0\ncheck 1.0.0 <=1.0.0\nmax * 1.0.0 0.1.0\n", expected: "^0.0.3 vs 0.0.4: false\n>1.0.0 vs 1.0.0: false\n<=1.0.0 vs 1.0.0: true\nmax *: 1.0.0\n", hidden: true },
          ],
        },
        {
          title: "Audit a package.json",
          prompt: `Read a \`package.json\` from stdin and print a report: \`name=<name or (missing)> version=<version if valid semver else invalid>\`; \`type=<type or commonjs (default)> entry=<exports | main <main> | index.js (implicit)>\`; \`scripts=<sorted names or none>\`; \`deps=<n> devDeps=<n> peerDeps=<n>\`; \`unpinned: <sorted names whose range is *, x or latest, or none>\`; and \`warnings: <joined by "; " or none>\` for: no \`engines.node\`; a \`postinstall\` script; publishable (\`private\` not true) without a \`files\` list; a package listed in both \`dependencies\` and \`devDependencies\`.

Example (a library with several problems) →
\`\`\`
name=@acme/tools version=2.3.1
type=module entry=exports
scripts=build,postinstall,test
deps=2 devDeps=2 peerDeps=1
unpinned: express,left-pad
warnings: no engines.node; postinstall script runs on every install; publishable without a files allow-list; listed in both dependencies and devDependencies: express
\`\`\``,
          starterFile: "code/package-audit.starter.js",
          solutionFile: "code/package-audit.solution.js",
          hints: ["A semver regex: /^\\d+\\.\\d+\\.\\d+(-[0-9A-Za-z.-]+)?$/ — \"1.0\" is invalid.", "Optional chaining (pkg.engines?.node, pkg.scripts?.postinstall) keeps the checks short."],
          cases: [
            { stdin: "{\"name\":\"@acme/tools\",\"version\":\"2.3.1\",\"type\":\"module\",\"exports\":{\".\":\"./dist/index.js\"},\"scripts\":{\"test\":\"node --test\",\"build\":\"tsc\",\"postinstall\":\"node setup.js\"},\"dependencies\":{\"express\":\"^4.18.2\",\"left-pad\":\"*\"},\"devDependencies\":{\"typescript\":\"~5.4.0\",\"express\":\"latest\"},\"peerDependencies\":{\"react\":\">=18\"}}", expected: "name=@acme/tools version=2.3.1\ntype=module entry=exports\nscripts=build,postinstall,test\ndeps=2 devDeps=2 peerDeps=1\nunpinned: express,left-pad\nwarnings: no engines.node; postinstall script runs on every install; publishable without a files allow-list; listed in both dependencies and devDependencies: express\n" },
            { stdin: "{\"name\":\"app\",\"version\":\"1.0\",\"private\":true,\"main\":\"server.js\",\"dependencies\":{\"pg\":\"8.11.3\"},\"engines\":{\"node\":\">=18\"}}", expected: "name=app version=invalid\ntype=commonjs (default) entry=main server.js\nscripts=none\ndeps=1 devDeps=0 peerDeps=0\nunpinned: none\nwarnings: none\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "`^1.2.3` accepts…",
          options: ["Only `1.2.x`", "Any `1.y.z` ≥ 1.2.3 — same major; `~1.2.3` would fix the minor too", "Any version ≥ 1.2.3", "Exactly 1.2.3"],
          answer: 1,
          explanation: "`^0.2.3` behaves like `~`: 0.x versions promise nothing across minors.",
        },
        {
          prompt: "`npm ci` differs from `npm install` in that it…",
          options: ["Is faster only", "Installs exactly the lockfile (failing if `package.json` disagrees) after removing `node_modules` — reproducible CI installs", "Updates dependencies", "Skips devDependencies"],
          answer: 1,
          explanation: "Commit the lockfile; use `ci` in CI and deployments.",
        },
        {
          prompt: "A package used only at runtime by consumers was put in `devDependencies`. The effect is…",
          options: ["None", "Consumers (and `--omit=dev` production installs) do not get it — the module fails to load in production", "It installs twice", "npm warns"],
          answer: 1,
          explanation: "`dependencies` for runtime, `devDependencies` for developing the package itself.",
        },
        {
          prompt: "The `exports` field in `package.json`…",
          options: ["Lists files to publish", "Defines the package's public entry points (with `import`/`require` conditions) and blocks deep imports of anything else", "Replaces `scripts`", "Is for TypeScript only"],
          answer: 1,
          explanation: "Refactoring internals no longer breaks consumers who reached into them.",
        },
        {
          prompt: "Why is a `postinstall` script a supply-chain concern?",
          options: ["It slows installs", "It runs arbitrary code on every machine that installs the package — a compromised dependency executes there", "It is deprecated", "It cannot use `node`"],
          answer: 1,
          explanation: "Lockfiles, `npm audit`, fewer dependencies and `--ignore-scripts` where possible.",
        },
      ],
    },
    {
      slug: "node-core-modules",
      file: "03-node-core-modules.md",
      exercises: [
        {
          title: "A path toolkit",
          prompt: `Using \`require("node:path").posix\` (so the answers are identical on every OS) and a fixed working directory \`/home/user/project\` for \`resolve\`, execute each command and print \`<command> <args> => <result>\`: \`join a b …\`, \`resolve a b …\` (resolved from the fixed directory), \`normalize p\`, \`basename p [ext]\`, \`extname p\` (JSON-quoted so an empty result is visible), \`dirname p\`, \`relative from to\`, \`parse p\` (JSON).

Example (excerpt):
\`\`\`
join /app src ../lib x.js => /app/lib/x.js
resolve src x.js => /home/user/project/src/x.js
resolve /etc x => /etc/x
normalize /a//b/./c/../d => /a/b/d
basename /a/b/file.txt .txt => file
extname archive.tar.gz => ".gz"
extname .bashrc => ""
relative /a/b /a/c/d => ../c/d
\`\`\``,
          starterFile: "code/path-toolkit.starter.js",
          solutionFile: "code/path-toolkit.solution.js",
          hints: ["path.posix.resolve(CWD, ...args) — the first absolute segment from the right wins, so /etc x ignores CWD.", "extname of a dotfile is the empty string; JSON.stringify makes that visible."],
          cases: [
            { stdin: "join /app src ../lib x.js\nresolve src x.js\nresolve /etc x\nnormalize /a//b/./c/../d\nbasename /a/b/file.txt\nbasename /a/b/file.txt .txt\nextname archive.tar.gz\nextname .bashrc\ndirname /a/b/file.txt\nrelative /a/b /a/c/d\nparse /a/b/file.txt\n", expected: "join /app src ../lib x.js => /app/lib/x.js\nresolve src x.js => /home/user/project/src/x.js\nresolve /etc x => /etc/x\nnormalize /a//b/./c/../d => /a/b/d\nbasename /a/b/file.txt => file.txt\nbasename /a/b/file.txt .txt => file\nextname archive.tar.gz => \".gz\"\nextname .bashrc => \"\"\ndirname /a/b/file.txt => /a/b\nrelative /a/b /a/c/d => ../c/d\nparse /a/b/file.txt => {\"root\":\"/\",\"dir\":\"/a/b\",\"base\":\"file.txt\",\"ext\":\".txt\",\"name\":\"file\"}\n" },
            { stdin: "join a b\nresolve . \nextname noext\n", expected: "join a b => a/b\nresolve . => /home/user/project\nextname noext => \"\"\n", hidden: true },
          ],
        },
        {
          title: "Files in a temp directory, round trip",
          prompt: `Create a unique directory with \`fsp.mkdtemp(path.join(os.tmpdir(), "study-"))\` and run commands against it with \`fs/promises\`: \`write name text…\` (writes text plus a newline; prints \`wrote name\`), \`append name text…\` (\`appended name\`), \`read name\` (prints \`name: <JSON of contents>\`), \`list\` (\`list: <sorted entries, directories with a trailing />\` or \`(empty)\`), \`stat name\` (\`name: <size> bytes file=<isFile>\`), \`rename a b\`, \`remove name\`, \`mkdir name\`, \`exists name\` (\`name exists=<bool>\`, via \`access\`). A failing command prints \`<cmd> <name>: error <err.code>\`. Remove the directory in a \`finally\`.

Example (excerpt):
\`\`\`
wrote a.txt
appended a.txt
a.txt: "hello world\\nsecond line\\n"
a.txt: 24 bytes file=true
list: a.txt sub/
read a.txt: error ENOENT
remove ghost.txt: error ENOENT
\`\`\``,
          starterFile: "code/fs-roundtrip.starter.js",
          solutionFile: "code/fs-roundtrip.solution.js",
          hints: ["readdir with { withFileTypes: true } gives Dirent objects with isDirectory().", "Branch on err.code — ENOENT is the missing-file case; print it rather than the engine-specific message."],
          cases: [
            { stdin: "write a.txt hello world\nappend a.txt second line\nread a.txt\nstat a.txt\nmkdir sub\nlist\nrename a.txt b.txt\nlist\nread a.txt\nexists b.txt\nremove b.txt\nexists b.txt\nremove ghost.txt\n", expected: "wrote a.txt\nappended a.txt\na.txt: \"hello world\\nsecond line\\n\"\na.txt: 24 bytes file=true\nmkdir sub\nlist: a.txt sub/\nrenamed a.txt -> b.txt\nlist: b.txt sub/\nread a.txt: error ENOENT\nb.txt exists=true\nremoved b.txt\nb.txt exists=false\nremove ghost.txt: error ENOENT\n" },
            { stdin: "list\nwrite x.txt hi\nlist\n", expected: "list: (empty)\nwrote x.txt\nlist: x.txt\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "`path.join(\"/a\", \"../b\")` and `path.resolve(\"/a\", \"../b\")`…",
          options: ["Both `/b`", "`join` → `/b` (normalised concatenation); `resolve` → `/b` too here, but `resolve(\"x\")` would be absolute from the cwd while `join(\"x\")` stays relative", "Both throw", "`join` keeps `..`"],
          answer: 1,
          explanation: "`resolve` always returns an absolute path; `join` only normalises.",
        },
        {
          prompt: "`fs.readFile(\"a.txt\", cb)` without an encoding gives…",
          options: ["A string", "A `Buffer` — pass `\"utf8\"` for a string", "An array of lines", "A stream"],
          answer: 1,
          explanation: "Same for `readFileSync` and `fsp.readFile`.",
        },
        {
          prompt: "`emitter.emit(\"error\", err)` with no `\"error\"` listener…",
          options: ["Is ignored", "Throws `err` — always attach an error listener on emitters that can fail", "Logs a warning", "Rejects a promise"],
          answer: 1,
          explanation: "Streams, sockets and servers are all emitters.",
        },
        {
          prompt: "`console.log(\"done\"); process.exit(0);` may…",
          options: ["Always print `done`", "Lose the output — `exit()` is immediate and does not wait for pending writes; set `process.exitCode` instead", "Print twice", "Hang"],
          answer: 1,
          explanation: "`exit()` also skips in-flight `finally` blocks.",
        },
        {
          prompt: "To build a query string safely use…",
          options: ["String concatenation with `&`", "`URLSearchParams` (or `URL#searchParams`) — it encodes values correctly", "`JSON.stringify`", "`querystring.escape` on the whole string"],
          answer: 1,
          explanation: "The legacy `url.parse`/`querystring` modules are superseded by the WHATWG `URL`.",
        },
      ],
    },
    {
      slug: "streams-and-buffers",
      file: "04-streams-and-buffers.md",
      exercises: [
        {
          title: "Buffers, encodings and the split character",
          prompt: `Line 1 is base64 text, line 2 hex. Decode each: print \`base64 -> <JSON string> bytes=<length> hex=<hex>\` and \`hex -> <JSON string> base64=<base64> uint16be=<readUInt16BE(0) or n/a if under 2 bytes>\`. Then build the word \`caf\` + \`String.fromCodePoint(0xe9)\` and print \`length=<string length> byteLength=<UTF-8 bytes> bytes=<hex>\`; split its buffer after byte 4 (inside the two-byte character), decode the chunks naively (\`chunk.toString()\` each, concatenated) and carefully (a \`StringDecoder\`), and print \`naive=<code points in hex> careful=<code points in hex> equal=<careful === word>\`; finally \`compare=<Buffer.compare("a","b")> equals=<Buffer "hi" equals "hi"> concat=<concat of "ab" and "cd">\`.

Example: \`aGVsbG8=\` / \`4142\` →
\`\`\`
base64 -> "hello" bytes=5 hex=68656c6c6f
hex -> "AB" base64=QUI= uint16be=16706
length=4 byteLength=5 bytes=636166c3a9
naive=63 61 66 fffd fffd careful=63 61 66 e9 equal=true
compare=-1 equals=true concat=abcd
\`\`\`
The naive decode produced two replacement characters (\`fffd\`) where the split \`é\` was.`,
          starterFile: "code/buffers.starter.js",
          solutionFile: "code/buffers.solution.js",
          hints: ["Buffer.from(text, \"base64\") / Buffer.from(text, \"hex\") decode; buf.toString(encoding) encodes.", "new StringDecoder(\"utf8\") buffers a partial multi-byte sequence across write() calls; end() flushes."],
          cases: [
            { stdin: "aGVsbG8=\n4142\n", expected: "base64 -> \"hello\" bytes=5 hex=68656c6c6f\nhex -> \"AB\" base64=QUI= uint16be=16706\nlength=4 byteLength=5 bytes=636166c3a9\nnaive=63 61 66 fffd fffd careful=63 61 66 e9 equal=true\ncompare=-1 equals=true concat=abcd\n" },
            { stdin: "Sm9l\n7a\n", expected: "base64 -> \"Joe\" bytes=3 hex=4a6f65\nhex -> \"z\" base64=eg== uint16be=n/a\nlength=4 byteLength=5 bytes=636166c3a9\nnaive=63 61 66 fffd fffd careful=63 61 66 e9 equal=true\ncompare=-1 equals=true concat=abcd\n", hidden: true },
          ],
        },
        {
          title: "Object-mode transforms and pipeline",
          prompt: `Line 1 is a minimum level (\`DEBUG < INFO < WARN < ERROR\`); the rest are log lines \`LEVEL message\`. Build a \`Transform\` with \`readableObjectMode\` that parses each line into \`{ level, message }\` (and fails with \`Error("corrupt line")\` on the text \`BAD\`), a second object-mode \`Transform\` that drops records below the minimum, and an object-mode \`Writable\` that collects; run them with \`stream/promises\` \`pipeline\` over \`Readable.from(lines without BAD)\` and print \`kept <n> of <m>: <LEVEL:message joined by " | ">\` and \`counts: <LEVEL=n in level order>\`. If the input contained \`BAD\`, run a second pipeline **with** it and print \`pipeline with BAD: failed - <message>; sinkDestroyed=<sink.destroyed>\`. Finally count non-empty lines of the whole input with \`readline\` over \`Readable.from([input])\` and print \`readline lines=<n>\`.

Example: \`WARN\`, then \`INFO server started\`, \`DEBUG cache warm\`, \`WARN disk 91% full\`, \`ERROR db timeout\`, \`INFO request served\`, \`BAD\` →
\`\`\`
kept 2 of 5: WARN:disk 91% full | ERROR:db timeout
counts: WARN=1 ERROR=1
pipeline with BAD: failed - corrupt line; sinkDestroyed=true
readline lines=7
\`\`\``,
          starterFile: "code/transform-pipeline.starter.js",
          solutionFile: "code/transform-pipeline.solution.js",
          hints: ["cb(err) from a transform fails the whole pipeline; pipeline destroys every other stage — that is what sinkDestroyed shows.", "Readable.from(array) is object mode; a Transform with readableObjectMode: true bridges string chunks in to records out."],
          cases: [
            { stdin: "WARN\nINFO server started\nDEBUG cache warm\nWARN disk 91% full\nERROR db timeout\nINFO request served\nBAD\n", expected: "kept 2 of 5: WARN:disk 91% full | ERROR:db timeout\ncounts: WARN=1 ERROR=1\npipeline with BAD: failed - corrupt line; sinkDestroyed=true\nreadline lines=7\n" },
            { stdin: "DEBUG\nINFO a\nDEBUG b\n", expected: "kept 2 of 2: INFO:a | DEBUG:b\ncounts: DEBUG=1 INFO=1\nreadline lines=3\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "`Buffer.from(\"héllo\").length` is…",
          options: ["5", "6 — bytes, not characters; `é` is two bytes in UTF-8", "10", "It throws"],
          answer: 1,
          explanation: "`Buffer.byteLength(str)` gives the same without allocating.",
        },
        {
          prompt: "Decoding a UTF-8 stream with `chunk.toString()` per chunk risks…",
          options: ["Nothing", "Garbled characters where a multi-byte sequence is split across two chunks — use `setEncoding` or a `StringDecoder`", "Memory leaks", "Slower code"],
          answer: 1,
          explanation: "The boundary is arbitrary; the decoder must buffer partial sequences.",
        },
        {
          prompt: "`a.pipe(b)` versus `pipeline(a, b)`:",
          options: ["Identical", "`pipeline` forwards errors from every stage, destroys the others on failure and returns a promise; `pipe` leaves `b` open when `a` errors", "`pipe` is asynchronous", "`pipeline` buffers everything"],
          answer: 1,
          explanation: "Use `stream/promises` `pipeline` for any real flow.",
        },
        {
          prompt: "Backpressure means…",
          options: ["Compressing data", "A writable signals it is full (`write()` returns `false`) and the producer waits for `\"drain\"` — `pipeline` and `for await` handle it for you", "An error", "A timeout"],
          answer: 1,
          explanation: "A hand-written `for` loop of `write()` calls ignores it and buffers unboundedly.",
        },
        {
          prompt: "Object mode…",
          options: ["Is for JSON only", "Lets chunks be arbitrary JavaScript values (records, events) with `highWaterMark` counted in objects", "Disables backpressure", "Requires TypeScript"],
          answer: 1,
          explanation: "A parser is a byte→object Transform; `Readable.from(array)` is object mode by default.",
        },
      ],
    },
    {
      slug: "processes-and-environment",
      file: "05-processes-and-environment.md",
      exercises: [
        {
          title: "An argv parser",
          prompt: `Write \`parseArgs(argv)\` returning \`{ opts, positional }\` with the standard conventions: \`--key=value\`; \`--key value\` when the next token does not start with \`-\`, otherwise \`--key\` is \`true\`; \`--no-key\` sets \`key\` to \`false\`; a cluster \`-xy\` sets \`x\` and \`y\` to \`true\`; \`--\` ends option parsing and everything after is positional; anything else is positional. The input line is the argv; print the result as JSON.

Example: \`--name=ada --verbose -n 3 in.txt --tags a --no-color -xy out.txt -- --literal -z\` →
\`\`\`
{"opts":{"name":"ada","verbose":true,"n":true,"tags":"a","color":false,"x":true,"y":true},"positional":["3","in.txt","out.txt","--literal","-z"]}
\`\`\`
Short flags are booleans here, so \`-n 3\` makes \`3\` positional — the rule set is the exercise's, and a real tool documents its own.`,
          starterFile: "code/argv-parser.starter.js",
          solutionFile: "code/argv-parser.solution.js",
          hints: ["Use indexOf(\"=\") rather than split so values containing = survive.", "Handle -- first, then --long forms, then -short clusters, then positionals."],
          cases: [
            { stdin: "--name=ada --verbose -n 3 in.txt --tags a --no-color -xy out.txt -- --literal -z", expected: "{\"opts\":{\"name\":\"ada\",\"verbose\":true,\"n\":true,\"tags\":\"a\",\"color\":false,\"x\":true,\"y\":true},\"positional\":[\"3\",\"in.txt\",\"out.txt\",\"--literal\",\"-z\"]}\n" },
            { stdin: "serve", expected: "{\"opts\":{},\"positional\":[\"serve\"]}\n", hidden: true },
            { stdin: "--port 8080 --host=0.0.0.0 -v", expected: "{\"opts\":{\"port\":\"8080\",\"host\":\"0.0.0.0\",\"v\":true},\"positional\":[]}\n", hidden: true },
          ],
        },
        {
          title: "Parse a .env file and check what is required",
          prompt: `Write \`parseDotenv(text)\`: skip blank lines and \`#\` comments; accept \`KEY=VALUE\` with an optional \`export \` prefix; strip matching single or double quotes (a \`#\` inside quotes is kept); on unquoted values drop a trailing \` # comment\`; expand \`\${NAME}\` from keys defined earlier (unknown → empty). The input is the file, then a line \`---\`, then the required key names. Print \`env=<JSON>\`, then \`missing=<JSON array of required keys absent or empty> wouldExitWith=<1 if any, else 0>\`, and register a \`process.on("exit")\` handler that prints \`exit handler: code=<code>\`.

Example:
\`\`\`
# database
export DB_HOST=db.local
DB_PORT=5432
DB_URL=postgres://\${DB_HOST}:\${DB_PORT}/app
NAME="My App"
EMPTY=
MOTTO='keep # this'
PLAIN=value # a comment
---
DB_URL API_KEY EMPTY
\`\`\`
→
\`\`\`
env={"DB_HOST":"db.local","DB_PORT":"5432","DB_URL":"postgres://db.local:5432/app","NAME":"My App","EMPTY":"","MOTTO":"keep # this","PLAIN":"value"}
missing=["API_KEY","EMPTY"] wouldExitWith=1
exit handler: code=0
\`\`\``,
          starterFile: "code/env-config.starter.js",
          solutionFile: "code/env-config.solution.js",
          hints: ["One regex for the line shape: /^(?:export\\s+)?([A-Za-z_][A-Za-z0-9_]*)\\s*=\\s*(.*)$/.", "Expand ${NAME} with a replace callback reading the object built so far."],
          cases: [
            { stdin: "# database\nexport DB_HOST=db.local\nDB_PORT=5432\nDB_URL=postgres://${DB_HOST}:${DB_PORT}/app\nNAME=\"My App\"\nEMPTY=\nMOTTO='keep # this'\nPLAIN=value # a comment\n---\nDB_URL API_KEY EMPTY\n", expected: "env={\"DB_HOST\":\"db.local\",\"DB_PORT\":\"5432\",\"DB_URL\":\"postgres://db.local:5432/app\",\"NAME\":\"My App\",\"EMPTY\":\"\",\"MOTTO\":\"keep # this\",\"PLAIN\":\"value\"}\nmissing=[\"API_KEY\",\"EMPTY\"] wouldExitWith=1\nexit handler: code=0\n" },
            { stdin: "A=1\n---\nA\n", expected: "env={\"A\":\"1\"}\nmissing=[] wouldExitWith=0\nexit handler: code=0\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "`process.argv[0]` and `[1]` are…",
          options: ["The first two user arguments", "The Node executable and the script path — user arguments start at index 2", "The cwd and the home directory", "Always empty"],
          answer: 1,
          explanation: "`process.argv.slice(2)`.",
        },
        {
          prompt: "Values in `process.env` are…",
          options: ["Typed", "Always strings (or `undefined`) — parse and validate them once at startup", "Numbers when numeric", "Frozen"],
          answer: 1,
          explanation: "`PORT=\"3000\"` is a string; precedence flag > env > file > default.",
        },
        {
          prompt: "`exec(\"ls \" + userInput)` is dangerous because…",
          options: ["`ls` is slow", "It runs through a shell — input like `; rm -rf /` executes; use `execFile`/`spawn` with an argument array", "It is asynchronous", "It buffers output"],
          answer: 1,
          explanation: "`execFile`/`spawn` start the program directly with no shell parsing.",
        },
        {
          prompt: "After installing a `SIGTERM` handler, the process…",
          options: ["Exits automatically after the handler", "Keeps running until you call `process.exit` yourself — the handler replaces the default exit", "Ignores the signal", "Restarts"],
          answer: 1,
          explanation: "Stop accepting work, drain, close, then exit within the grace period; `SIGKILL` cannot be handled.",
        },
        {
          prompt: "`worker_threads` are appropriate for…",
          options: ["Database queries", "CPU-bound work that would block the event loop; I/O is already non-blocking and gains nothing", "Reading files", "HTTP requests"],
          answer: 1,
          explanation: "Workers have separate loops and heaps and communicate by message passing.",
        },
      ],
    },
    {
      slug: "modules-and-node-checkpoint",
      file: "06-checkpoint.md",
      kind: "test",
      passMark: 70,
      exercises: [
        {
          title: "Load a module graph the CommonJS way",
          prompt: `Lines \`module <name>: <dep> <dep>…\` declare modules and what they require (in order); \`entry <name>\` names the entry point. Simulate CommonJS loading from the entry: a module is marked *loading*, pushed on the stack and recorded in the **start** order; each dependency is required in turn — a *loaded* module is a cache hit, a *loading* one is a **cycle** recorded as \`a -> b -> a\` (the stack from the repeated module, plus it) and returns its partial exports, an undeclared one is recorded as **missing**; then the module is marked loaded and recorded in the **finish** order. Print \`start: …\`, \`finish: …\`, \`cycles: <"; "-joined or none>\`, \`missing: <names or none> unused: <declared modules never loaded, or none>\`.

Example:
\`\`\`
module app: config db routes
module config:
module db: config logger
module logger: config
module routes: db handlers
module handlers: routes
module unused: config
entry app
\`\`\`
→
\`\`\`
start: app config db logger routes handlers
finish: config logger db handlers routes app
cycles: routes -> handlers -> routes
missing: none unused: unused
\`\`\``,
          starterFile: "code/module-graph.starter.js",
          solutionFile: "code/module-graph.solution.js",
          hints: ["A depth-first walk with a state Map (loading/loaded) and an explicit stack array for the cycle path.", "Finish order is post-order: a module completes only after every dependency has."],
          cases: [
            { stdin: "module app: config db routes\nmodule config:\nmodule db: config logger\nmodule logger: config\nmodule routes: db handlers\nmodule handlers: routes\nmodule unused: config\nentry app\n", expected: "start: app config db logger routes handlers\nfinish: config logger db handlers routes app\ncycles: routes -> handlers -> routes\nmissing: none unused: unused\n" },
            { stdin: "module a: b\nmodule b: a\nentry a\n", expected: "start: a b\nfinish: b a\ncycles: a -> b -> a\nmissing: none unused: none\n", hidden: true },
            { stdin: "module main: lib missing\nmodule lib:\nentry main\n", expected: "start: main lib\nfinish: lib main\ncycles: none\nmissing: missing unused: none\n", hidden: true },
          ],
        },
        {
          title: "A log-summarising stream pipeline",
          prompt: `Line 1 is the minimum level; each following line is \`<ISO time> <LEVEL> <message>\`. Build a \`pipeline\` of \`Readable.from(lines)\` → a parsing \`Transform\` (readable object mode; a line that does not match \`^(\\S+)\\s+(DEBUG|INFO|WARN|ERROR)\\s+(.*)$\` is counted as malformed and dropped) → a filtering \`Transform\` (keep levels ≥ minimum) → a summarising object-mode \`Writable\` that counts per level, per hour (characters 11–12 of the time), and remembers the first \`ERROR\`. Print \`seen=<lines> malformed=<n> kept=<n>\`, \`levels: <LEVEL=n in DEBUG,INFO,WARN,ERROR order, or none>\`, \`byHour: <HHh=n sorted, or none>\`, \`firstError: <time message or none>\`.

Example: \`WARN\` and five log lines including one garbage line →
\`\`\`
seen=6 malformed=1 kept=3
levels: WARN=1 ERROR=2
byHour: 10h=1 11h=2
firstError: 2024-01-01T10:16:00Z db timeout
\`\`\``,
          starterFile: "code/log-pipeline.starter.js",
          solutionFile: "code/log-pipeline.solution.js",
          hints: ["Calling cb() with no record drops the chunk without ending the stream.", "Count `seen` in the parser and `kept` in the writable — the filter sits between them."],
          cases: [
            { stdin: "WARN\n2024-01-01T10:15:00Z INFO server started\n2024-01-01T10:16:00Z ERROR db timeout\nthis line is garbage\n2024-01-01T11:02:00Z WARN disk 91% full\n2024-01-01T11:03:00Z ERROR db timeout again\n2024-01-01T11:04:00Z DEBUG noise\n", expected: "seen=6 malformed=1 kept=3\nlevels: WARN=1 ERROR=2\nbyHour: 10h=1 11h=2\nfirstError: 2024-01-01T10:16:00Z db timeout\n" },
            { stdin: "DEBUG\n2024-05-05T00:00:00Z DEBUG a\n", expected: "seen=1 malformed=0 kept=1\nlevels: DEBUG=1\nbyHour: 00h=1\nfirstError: none\n", hidden: true },
          ],
        },
        {
          title: "A configuration CLI: flag > env > default",
          prompt: `Defaults are \`{ port: 3000, host: "localhost", debug: false, workers: 1 }\`, read from the environment as \`APP_PORT\`, \`APP_HOST\`, \`APP_DEBUG\`, \`APP_WORKERS\`. Line 1 of the input is the argv (possibly blank) — only \`--key=value\`, \`--flag\` (true) and \`--no-flag\` (false) matter; the following lines are \`KEY=VALUE\` environment entries. For each key take the flag, else the env value, else the default, coercing to the default's type (integers for numbers; \`true\`/\`1\`/\`false\`/\`0\` for booleans; anything else is a \`TypeError("<key> must be an integer, got <JSON>")\`/\`("<key> must be true/false, got <JSON>")\`). Validate \`port\` 1–65535 and \`workers\` ≥ 1. Print \`config=<JSON>\` and \`sources: <key=flag|env|default …>\` and \`wouldExitWith=0\`, or \`invalid: <messages joined by "; ">\` and \`wouldExitWith=1\`.

Example: \`--port=8080 --debug\` then \`APP_HOST=0.0.0.0\`, \`APP_WORKERS=4\`, \`APP_PORT=9999\` →
\`\`\`
config={"port":8080,"host":"0.0.0.0","debug":true,"workers":4}
sources: port=flag host=env debug=flag workers=env
wouldExitWith=0
\`\`\`
The flag beats \`APP_PORT\`; \`--workers=0 --port=70000\` → \`invalid: port must be 1-65535, got 70000; workers must be at least 1, got 0\`.`,
          starterFile: "code/config-cli.starter.js",
          solutionFile: "code/config-cli.solution.js",
          hints: ["Take line 1 as argv even when it is blank — do not filter empty lines before splitting off the first.", "typeof DEFAULTS[key] tells coerce() which parser to apply."],
          cases: [
            { stdin: "--port=8080 --debug\nAPP_HOST=0.0.0.0\nAPP_WORKERS=4\nAPP_PORT=9999\n", expected: "config={\"port\":8080,\"host\":\"0.0.0.0\",\"debug\":true,\"workers\":4}\nsources: port=flag host=env debug=flag workers=env\nwouldExitWith=0\n" },
            { stdin: "\nAPP_DEBUG=yes\n", expected: "invalid: debug must be true/false, got \"yes\"\nwouldExitWith=1\n", hidden: true },
            { stdin: "--workers=0 --port=70000\n", expected: "invalid: port must be 1-65535, got 70000; workers must be at least 1, got 0\nwouldExitWith=1\n", hidden: true },
            { stdin: "--no-debug\nAPP_DEBUG=true\n", expected: "config={\"port\":3000,\"host\":\"localhost\",\"debug\":false,\"workers\":1}\nsources: port=default host=default debug=flag workers=default\nwouldExitWith=0\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "Module-level state (a `const cache = new Map()` at the top of a file) is…",
          options: ["Re-created per import", "Created once per process — modules are evaluated once and cached, so it is a process-wide singleton", "Per function call", "Per request"],
          answer: 1,
          explanation: "Handy for pools and caches; a trap when you expected isolation.",
        },
        {
          prompt: "ESM's `import.meta.url` replaces…",
          options: ["`process.argv`", "`__filename`/`__dirname`, which do not exist in ES modules — convert with `fileURLToPath`", "`require.cache`", "`module.exports`"],
          answer: 1,
          explanation: "`createRequire(import.meta.url)` gives a `require` when you must have one.",
        },
        {
          prompt: "Dynamic `import()`…",
          options: ["Only works in ESM", "Works in both module systems, returns a promise of the namespace, and is the only import form usable inside functions", "Is synchronous", "Cannot load packages"],
          answer: 1,
          explanation: "Lazy loading, conditional loading, plugins named at runtime.",
        },
        {
          prompt: "Resolving a bare specifier like `lodash` walks…",
          options: ["Only the project root", "Up the directory tree checking each `node_modules/` until the filesystem root", "The global installation only", "`PATH`"],
          answer: 1,
          explanation: "Which is why nested and hoisted `node_modules` both work.",
        },
        {
          prompt: "`peerDependencies` say…",
          options: ["Install this for me", "The host application must provide this package (plugins, React components) — the package does not bundle its own copy", "Optional extras", "Development tools"],
          answer: 1,
          explanation: "Two copies of React in one tree is the classic failure this prevents.",
        },
        {
          prompt: "`fs.existsSync(p)` followed by `fs.readFileSync(p)`…",
          options: ["Is the safe pattern", "Is a race — the file can vanish between the two calls; open it and handle `ENOENT`", "Is faster", "Is required by Node"],
          answer: 1,
          explanation: "Branch on `err.code`.",
        },
        {
          prompt: "`EventEmitter#emit` calls listeners…",
          options: ["On the next tick", "Synchronously, in registration order, before `emit` returns", "In parallel", "Randomly"],
          answer: 1,
          explanation: "A slow listener slows the emitter; a throw propagates to the `emit` call.",
        },
        {
          prompt: "`crypto.createHash(\"sha256\")` is appropriate for…",
          options: ["Storing passwords", "Checksums and content addressing — passwords need `scrypt`/`bcrypt`/`argon2`", "Generating session tokens", "Encryption"],
          answer: 1,
          explanation: "Tokens: `randomBytes`/`randomUUID`; signatures: `createHmac`.",
        },
        {
          prompt: "A `Transform` that assumes each chunk is exactly one line…",
          options: ["Is correct", "Is wrong — byte chunks are arbitrary slices; buffer the partial tail and emit it in `flush`", "Is faster", "Works for files only"],
          answer: 1,
          explanation: "`readline` exists so you do not have to write that buffering.",
        },
        {
          prompt: "Program output goes to stdout and messages to stderr because…",
          options: ["stderr is faster", "A pipe or file consumes stdout; progress and diagnostics on it would corrupt the data", "stdout is unbuffered", "It is required by POSIX"],
          answer: 1,
          explanation: "`console.log` versus `console.error`.",
        },
        {
          prompt: "`process.exitCode = 1` followed by returning normally…",
          options: ["Does nothing", "Exits with code 1 once the event loop drains, after pending output is flushed", "Exits immediately", "Throws"],
          answer: 1,
          explanation: "Prefer it to `process.exit(1)` in all but emergencies.",
        },
        {
          prompt: "`spawn(\"ffmpeg\", args, { stdio: \"inherit\" })` versus `exec(\"ffmpeg …\")`:",
          options: ["Identical", "`spawn` streams the child's I/O and takes an argument array (no shell); `exec` buffers output (1 MB cap) and runs a shell string", "`exec` is safer", "`spawn` is synchronous"],
          answer: 1,
          explanation: "`execFile` is the buffered-but-shell-free middle option.",
        },
      ],
    },
  ],
});

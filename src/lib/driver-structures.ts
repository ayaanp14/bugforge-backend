/**
 * Drivers for the problem shapes the plain signature cannot carry: binary
 * trees, linked lists and design problems (a class whose methods the judge
 * calls in sequence). Added for wave 7 of the catalogue (2026-10-22); the
 * plain signatures in driver-codegen.ts are untouched and never come here.
 *
 * The wire format is LeetCode's, so a statement's examples read the way a
 * candidate has seen them everywhere else:
 *
 *   TreeNode    level order with nulls, trailing nulls dropped  [3,9,20,null,null,15,7]
 *   ListNode    the values head to tail                         [1,2,3]
 *   ListNode[]  one list per element                            [[1,4,5],[1,3,4],[2,6]]
 *   design      two lines — the operations, then each one's arguments
 *                 ["LRUCache","put","get"]
 *                 [[2],[1,1],[1]]
 *               and the answer is one array with null for the constructor
 *               and every void method:  [null,null,1]
 *
 * A design signature is `{ funcName: <class>, params: <constructor params>,
 * returns: "void", methods: [{ name, params, returns }] }`. Its methods take
 * and return only the plain types (plus "void"); trees and lists are for
 * functions.
 *
 * Every language — JavaScript and Python included, which elsewhere go through
 * wrapCode's signature-free harness — gets a complete program here, because
 * turning a parsed array into a TreeNode needs the signature. Those two carry
 * STRUCTURED_DRIVER_MARK so wrapCode (src/lib/judge0.ts) passes them through
 * untouched; user code can never contain it (containsReservedMarker).
 *
 * The node types follow each language's LeetCode definition (Rust's
 * Option<Rc<RefCell<TreeNode>>> included) and are defined by the driver, so a
 * solution that redefines them does not compile — the stubs say so. Values are
 * read with a small bracket-aware splitter in the languages without a JSON
 * reader on the judge; a string never holds a quote or a backslash (the
 * catalogue's judge contract), which is what lets that splitter stay small.
 *
 * Output is capped at 200,000 nodes per returned tree or list, so a cycle the
 * solution built reads as an error rather than a timeout.
 */

import type { Language } from "./driver-codegen.js";

// Kept in sync with src/lib/batch.ts (as driver-codegen.ts does).
const SENTINEL = "__CODEKAIRO_CASE__";
const ERR = "__CODEKAIRO_ERROR__:";
const GZ = "__CODEKAIRO_GZ__";
const BEGIN = "__CODEKAIRO_BEGIN__";
const GZIN = "__CODEKAIRO_GZIN__";
const GZ_THRESHOLD = 65536;
const NODE_CAP = 200000;

/** Marks a JavaScript/Python program that is already complete (see the header). */
export const STRUCTURED_DRIVER_MARK = "__CODEKAIRO_DRIVER__";

export type StructType =
  | "int" | "bool" | "string" | "int[]" | "int[][]" | "string[]"
  | "TreeNode" | "ListNode" | "ListNode[]" | "void";

interface SParam { name: string; type: string }
interface SMethod { name: string; params: SParam[]; returns: string }
/** The signature as stored — the plain one, optionally with methods. */
export interface StructSignature { funcName: string; params: SParam[]; returns: string; methods?: SMethod[] }

const NODE_TYPES = new Set(["TreeNode", "ListNode", "ListNode[]"]);
const PLAIN = new Set(["int", "bool", "string", "int[]", "int[][]", "string[]"]);

/** True when the signature needs this module: a node type anywhere, or methods. */
export function isStructured(sig: StructSignature): boolean {
  if (Array.isArray(sig.methods)) return true;
  return NODE_TYPES.has(sig.returns) || sig.params.some((p) => NODE_TYPES.has(p.type));
}

const isClass = (sig: StructSignature) => Array.isArray(sig.methods);

/** Refuses a signature the drivers below cannot honour, at seed/validate time rather than in a learner's run. */
export function checkStructSignature(sig: StructSignature): void {
  const where = sig.funcName;
  if (isClass(sig)) {
    if (sig.returns !== "void") throw new Error(`${where}: a design signature returns "void"`);
    const all = [...sig.params.map((p) => p.type), ...sig.methods!.flatMap((m) => [...m.params.map((p) => p.type), m.returns])];
    for (const t of all) if (!PLAIN.has(t) && t !== "void") throw new Error(`${where}: design methods take plain types only, not ${t}`);
    for (const m of sig.methods!) for (const p of m.params) if (p.type === "bool" || p.type === "void") throw new Error(`${where}.${m.name}: no ${p.type} parameters`);
    for (const p of sig.params) if (p.type === "bool" || p.type === "void") throw new Error(`${where}: no ${p.type} constructor parameters`);
    if (!sig.methods!.length) throw new Error(`${where}: a design signature needs methods`);
    return;
  }
  for (const p of sig.params) {
    if (!PLAIN.has(p.type) && !NODE_TYPES.has(p.type)) throw new Error(`${where}: unknown parameter type ${p.type}`);
    if (p.type === "bool") throw new Error(`${where}: no bool parameters`);
  }
  if (!PLAIN.has(sig.returns) && sig.returns !== "TreeNode" && sig.returns !== "ListNode") throw new Error(`${where}: cannot return ${sig.returns}`);
}

const uses = (sig: StructSignature, t: "tree" | "list") => {
  const types = [sig.returns, ...sig.params.map((p) => p.type)];
  return t === "tree" ? types.includes("TreeNode") : types.includes("ListNode") || types.includes("ListNode[]");
};
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const lowerFirst = (s: string) => s.charAt(0).toLowerCase() + s.slice(1);
const indent = (lines: string[], pad: string) => lines.map((l) => (l === "" ? "" : pad + l));

// ═══════════════════════════════════════════════════════════════════
// JavaScript (Node 12)
// ═══════════════════════════════════════════════════════════════════
const JS_DOC: Record<string, string> = {
  int: "number", bool: "boolean", string: "string", "int[]": "number[]", "int[][]": "number[][]", "string[]": "string[]",
  TreeNode: "TreeNode", ListNode: "ListNode", "ListNode[]": "ListNode[]", void: "void",
};

const JS_TREE_DOC = [
  "/**",
  " * Definition for a binary tree node (provided by the judge — do not redefine it):",
  " * function TreeNode(val, left, right) {",
  " *     this.val = (val===undefined ? 0 : val)",
  " *     this.left = (left===undefined ? null : left)",
  " *     this.right = (right===undefined ? null : right)",
  " * }",
  " */",
];
const JS_LIST_DOC = [
  "/**",
  " * Definition for singly-linked list (provided by the judge — do not redefine it):",
  " * function ListNode(val, next) {",
  " *     this.val = (val===undefined ? 0 : val)",
  " *     this.next = (next===undefined ? null : next)",
  " * }",
  " */",
];

function jsStub(sig: StructSignature): string {
  if (isClass(sig)) {
    const out = ["/**", ...sig.params.map((p) => ` * @param {${JS_DOC[p.type]}} ${p.name}`), " */", `var ${sig.funcName} = function(${sig.params.map((p) => p.name).join(", ")}) {`, "    ", "};"];
    for (const m of sig.methods!) {
      out.push("", "/**", ...m.params.map((p) => ` * @param {${JS_DOC[p.type]}} ${p.name}`), ` * @return {${JS_DOC[m.returns]}}`, " */");
      out.push(`${sig.funcName}.prototype.${m.name} = function(${m.params.map((p) => p.name).join(", ")}) {`, "    ", "};");
    }
    return out.join("\n");
  }
  const out: string[] = [];
  if (uses(sig, "tree")) out.push(...JS_TREE_DOC);
  if (uses(sig, "list")) out.push(...JS_LIST_DOC);
  out.push("/**", ...sig.params.map((p) => ` * @param {${JS_DOC[p.type]}} ${p.name}`), ` * @return {${JS_DOC[sig.returns]}}`, " */");
  out.push(`var ${sig.funcName} = function(${sig.params.map((p) => p.name).join(", ")}) {`, "    // Write your code here", "    ", "};");
  return out.join("\n");
}

const JS_NODES = `function TreeNode(val, left, right) {
    this.val = (val === undefined ? 0 : val);
    this.left = (left === undefined ? null : left);
    this.right = (right === undefined ? null : right);
}
function ListNode(val, next) {
    this.val = (val === undefined ? 0 : val);
    this.next = (next === undefined ? null : next);
}
function __ckTree(a) {
    if (!a || a.length === 0 || a[0] === null) return null;
    var root = new TreeNode(a[0]), q = [root], h = 0, i = 1;
    while (i < a.length && h < q.length) {
        var n = q[h++];
        if (i < a.length && a[i] !== null) { n.left = new TreeNode(a[i]); q.push(n.left); }
        i++;
        if (i < a.length && a[i] !== null) { n.right = new TreeNode(a[i]); q.push(n.right); }
        i++;
    }
    return root;
}
function __ckTreeOut(root) {
    var out = [], q = [root === undefined ? null : root], h = 0;
    while (h < q.length) {
        var n = q[h++];
        if (n === null || n === undefined) { out.push(null); continue; }
        out.push(n.val);
        q.push(n.left === undefined ? null : n.left);
        q.push(n.right === undefined ? null : n.right);
        if (out.length > ${NODE_CAP}) throw new Error("the returned tree is too large (or has a cycle)");
    }
    while (out.length > 0 && out[out.length - 1] === null) out.pop();
    return out;
}
function __ckList(a) {
    var d = new ListNode(0), t = d;
    for (var i = 0; i < a.length; i++) { t.next = new ListNode(a[i]); t = t.next; }
    return d.next;
}
function __ckListOut(h) {
    var out = [];
    while (h !== null && h !== undefined) {
        out.push(h.val);
        h = h.next;
        if (out.length > ${NODE_CAP}) throw new Error("the returned list is too long (or has a cycle)");
    }
    return out;
}`;

const jsIn = (t: string, v: string) => (t === "TreeNode" ? `__ckTree(${v})` : t === "ListNode" ? `__ckList(${v})` : t === "ListNode[]" ? `(${v}).map(__ckList)` : v);
const jsOut = (t: string, v: string) =>
  t === "TreeNode" ? `JSON.stringify(__ckTreeOut(${v}))`
  : t === "ListNode" ? `JSON.stringify(__ckListOut(${v}))`
  : t === "string" ? `String(${v})`
  : `JSON.stringify(${v})`;

function jsFile(sig: StructSignature, fn: string): string {
  const userEnd = fn.split("\n").length + 1; // user code is lines 2..userEnd
  let body: string[];
  if (isClass(sig)) {
    const branches = sig.methods!.map((m, i) => {
      const call = `__obj.${m.name}(${m.params.map((_, j) => `__a[${j}]`).join(", ")})`;
      return `${i === 0 ? "if" : "else if"} (__m === ${JSON.stringify(m.name)}) ${m.returns === "void" ? `{ ${call}; __res.push(null); }` : `{ __res.push(${call}); }`}`;
    });
    body = [
      "var __ops = JSON.parse(__lines[0]), __all = JSON.parse(__lines[1]);",
      `var __obj = new ${sig.funcName}(${sig.params.map((_, j) => `__all[0][${j}]`).join(", ")});`,
      "var __res = [null];",
      "for (var __k = 1; __k < __ops.length; __k++) {",
      "    var __m = __ops[__k], __a = __all[__k];",
      ...branches.map((b) => "    " + b),
      '    else throw new Error("unknown operation " + __m);',
      "}",
      "__out.push(JSON.stringify(__res));",
    ];
  } else {
    body = [
      ...sig.params.map((p, i) => `var ${p.name} = ${jsIn(p.type, `JSON.parse(__lines[${i}])`)};`),
      `var __r = ${sig.funcName}(${sig.params.map((p) => p.name).join(", ")});`,
      `__out.push(${jsOut(sig.returns, "__r")});`,
    ];
  }
  return [
    `// ${STRUCTURED_DRIVER_MARK}`,
    fn,
    "",
    "// ---- driver (do not edit below) ----",
    uses(sig, "tree") || uses(sig, "list") ? JS_NODES : "",
    "var __fs = require('fs');",
    "var __input = __fs.readFileSync(0, 'utf8').trim();",
    `if (__input.indexOf("${GZIN}") === 0) {`,
    `    var __b64 = __input.slice(${GZIN.length}).replace(/\\s+/g, "");`,
    "    __input = require('zlib').gunzipSync(Buffer.from(__b64, 'base64')).toString('utf8').trim();",
    "}",
    "var __t0 = Date.now();",
    "var __out = [];",
    `var __chunks = __input.split("${SENTINEL}");`,
    "for (var __c = 0; __c < __chunks.length; __c++) {",
    "    var __lines = __chunks[__c].split(/\\r?\\n/).map(function (l) { return l.trim(); }).filter(function (l) { return l !== ''; });",
    "    if (__lines.length === 0) continue;",
    "    try {",
    ...indent(body, "        "),
    "    } catch (__e) {",
    "        var __note = '', __st = __e && __e.stack ? String(__e.stack) : '', __re = /:(\\d+):\\d+/g, __f;",
    "        while ((__f = __re.exec(__st)) !== null) {",
    "            var __ln = parseInt(__f[1], 10);",
    `            if (__ln >= 2 && __ln <= ${userEnd}) { __note = ' (line ' + (__ln - 1) + ')'; break; }`,
    "        }",
    `        __out.push("${ERR} Execution error" + __note + ": " + (__e && __e.message ? __e.message : String(__e)));`,
    "    }",
    `    __out.push("${SENTINEL}");`,
    "}",
    `__out.push("__CODEKAIRO_STATS__ " + (Date.now() - __t0) + " " + Math.round(process.memoryUsage().rss / 1024));`,
    "var __joined = __out.join('\\n') + '\\n';",
    `process.stdout.write("${BEGIN}\\n");`,
    `if (__joined.length > ${GZ_THRESHOLD}) {`,
    `    process.stdout.write("${GZ}\\n" + require('zlib').gzipSync(Buffer.from(__joined)).toString('base64') + "\\n");`,
    "} else {",
    "    process.stdout.write(__joined);",
    "}",
  ].join("\n");
}

// ═══════════════════════════════════════════════════════════════════
// Python 3.8
// ═══════════════════════════════════════════════════════════════════
const PY_T: Record<string, string> = {
  int: "int", bool: "bool", string: "str", "int[]": "List[int]", "int[][]": "List[List[int]]", "string[]": "List[str]",
  TreeNode: "Optional[TreeNode]", ListNode: "Optional[ListNode]", "ListNode[]": "List[Optional[ListNode]]", void: "None",
};

function pyStub(sig: StructSignature): string {
  if (isClass(sig)) {
    const out = [`class ${sig.funcName}:`, "", `    def __init__(${["self", ...sig.params.map((p) => `${p.name}: ${PY_T[p.type]}`)].join(", ")}):`, "        pass"];
    for (const m of sig.methods!) out.push("", `    def ${m.name}(${["self", ...m.params.map((p) => `${p.name}: ${PY_T[p.type]}`)].join(", ")}) -> ${PY_T[m.returns]}:`, "        pass");
    const needsList = /List\[/.test(out.join("\n"));
    return (needsList ? "from typing import List\n\n" : "") + out.join("\n");
  }
  const out: string[] = [];
  if (uses(sig, "tree")) out.push("# Definition for a binary tree node (provided by the judge — do not redefine it):", "# class TreeNode:", "#     def __init__(self, val=0, left=None, right=None):", "#         self.val = val", "#         self.left = left", "#         self.right = right");
  if (uses(sig, "list")) out.push("# Definition for singly-linked list (provided by the judge — do not redefine it):", "# class ListNode:", "#     def __init__(self, val=0, next=None):", "#         self.val = val", "#         self.next = next");
  out.push("from typing import List, Optional", "");
  out.push(`def ${sig.funcName}(${sig.params.map((p) => `${p.name}: ${PY_T[p.type]}`).join(", ")}) -> ${PY_T[sig.returns]}:`, "    # Write your code here", "    pass");
  return out.join("\n");
}

const PY_PRELUDE = `# ${STRUCTURED_DRIVER_MARK}
import sys
import json
from typing import List, Optional, Dict, Tuple, Set
sys.setrecursionlimit(20000)
class TreeNode:
    def __init__(self, val=0, left=None, right=None):
        self.val = val
        self.left = left
        self.right = right
class ListNode:
    def __init__(self, val=0, next=None):
        self.val = val
        self.next = next`;

const PY_DRIVER_HELPERS = `def __ck_tree(a):
    if not a or a[0] is None:
        return None
    root = TreeNode(a[0])
    q = [root]
    h = 0
    i = 1
    while i < len(a) and h < len(q):
        n = q[h]
        h += 1
        if i < len(a) and a[i] is not None:
            n.left = TreeNode(a[i])
            q.append(n.left)
        i += 1
        if i < len(a) and a[i] is not None:
            n.right = TreeNode(a[i])
            q.append(n.right)
        i += 1
    return root

def __ck_tree_out(root):
    out = []
    q = [root]
    h = 0
    while h < len(q):
        n = q[h]
        h += 1
        if n is None:
            out.append(None)
            continue
        out.append(n.val)
        q.append(n.left)
        q.append(n.right)
        if len(out) > ${NODE_CAP}:
            raise Exception("the returned tree is too large (or has a cycle)")
    while out and out[-1] is None:
        out.pop()
    return out

def __ck_list(a):
    d = ListNode(0)
    t = d
    for v in a:
        t.next = ListNode(v)
        t = t.next
    return d.next

def __ck_list_out(h):
    out = []
    while h is not None:
        out.append(h.val)
        h = h.next
        if len(out) > ${NODE_CAP}:
            raise Exception("the returned list is too long (or has a cycle)")
    return out

def __ck_json(v):
    return json.dumps(v, separators=(",", ":"))`;

const pyIn = (t: string, v: string) => (t === "TreeNode" ? `__ck_tree(${v})` : t === "ListNode" ? `__ck_list(${v})` : t === "ListNode[]" ? `[__ck_list(x) for x in ${v}]` : v);
const pyOut = (t: string, v: string) =>
  t === "TreeNode" ? `__ck_json(__ck_tree_out(${v}))`
  : t === "ListNode" ? `__ck_json(__ck_list_out(${v}))`
  : t === "string" ? `str(${v})`
  : t === "int" ? `str(${v})`
  : `__ck_json(${v})`;

function pyFile(sig: StructSignature, fn: string): string {
  const preludeLines = PY_PRELUDE.split("\n").length;
  const userStart = preludeLines + 1;
  const userEnd = preludeLines + fn.split("\n").length;
  let body: string[];
  if (isClass(sig)) {
    const branches = sig.methods!.map((m, i) => {
      const call = `__obj.${m.name}(${m.params.map((_, j) => `__a[${j}]`).join(", ")})`;
      return [`${i === 0 ? "if" : "elif"} __m == ${JSON.stringify(m.name)}:`, m.returns === "void" ? `    ${call}` : `    __res.append(${call})`, ...(m.returns === "void" ? ["    __res.append(None)"] : [])];
    });
    body = [
      "__ops = json.loads(__lines[0])",
      "__all = json.loads(__lines[1])",
      `__obj = ${sig.funcName}(${sig.params.map((_, j) => `__all[0][${j}]`).join(", ")})`,
      "__res = [None]",
      "for __k in range(1, len(__ops)):",
      "    __m = __ops[__k]",
      "    __a = __all[__k]",
      ...branches.flat().map((l) => "    " + l),
      "    else:",
      '        raise Exception("unknown operation " + str(__m))',
      "__out.append(__ck_json(__res))",
    ];
  } else {
    body = [
      ...sig.params.map((p, i) => `${p.name} = ${pyIn(p.type, `json.loads(__lines[${i}])`)}`),
      `__r = ${sig.funcName}(${sig.params.map((p) => p.name).join(", ")})`,
      `__out.append(${pyOut(sig.returns, "__r")})`,
    ];
  }
  return [
    PY_PRELUDE,
    fn,
    "",
    "# ---- driver (do not edit below) ----",
    PY_DRIVER_HELPERS,
    "",
    "__input = sys.stdin.read().strip()",
    `if __input.startswith("${GZIN}"):`,
    "    import gzip",
    "    import base64",
    `    __input = gzip.decompress(base64.b64decode("".join(__input[${GZIN.length}:].split()))).decode("utf-8").strip()`,
    "import time as __time_mod",
    "__t0 = __time_mod.time()",
    "__out = []",
    `for __chunk in __input.split("${SENTINEL}"):`,
    "    __lines = [l.strip() for l in __chunk.splitlines() if l.strip() != '']",
    "    if not __lines:",
    "        continue",
    "    try:",
    ...indent(body, "        "),
    "    except Exception as __e:",
    "        import traceback",
    "        __note = ''",
    "        for __fr in reversed(traceback.extract_tb(sys.exc_info()[2])):",
    `            if ${userStart} <= __fr.lineno <= ${userEnd}:`,
    `                __note = ' (line %d)' % (__fr.lineno - ${preludeLines})`,
    "                break",
    `        __out.append("${ERR} Execution error%s: %s" % (__note, str(__e)))`,
    `    __out.append("${SENTINEL}")`,
    "try:",
    "    import resource as __res_mod",
    "    __peak = __res_mod.getrusage(__res_mod.RUSAGE_SELF).ru_maxrss",
    "except Exception:",
    "    __peak = 0",
    '__out.append("__CODEKAIRO_STATS__ %d %d" % (int((__time_mod.time() - __t0) * 1000), __peak))',
    "__joined = '\\n'.join(__out) + '\\n'",
    `sys.stdout.write("${BEGIN}\\n")`,
    `if len(__joined) > ${GZ_THRESHOLD}:`,
    "    import gzip",
    "    import base64",
    `    sys.stdout.write("${GZ}\\n" + base64.b64encode(gzip.compress(__joined.encode('utf-8'))).decode('ascii') + "\\n")`,
    "else:",
    "    sys.stdout.write(__joined)",
  ].join("\n");
}

// ═══════════════════════════════════════════════════════════════════
// TypeScript 3.7 (ES5 target)
// ═══════════════════════════════════════════════════════════════════
const TS_T: Record<string, string> = {
  int: "number", bool: "boolean", string: "string", "int[]": "number[]", "int[][]": "number[][]", "string[]": "string[]",
  TreeNode: "TreeNode | null", ListNode: "ListNode | null", "ListNode[]": "Array<ListNode | null>", void: "void",
};
const TS_DEFAULT: Record<string, string> = {
  int: "return 0;", bool: "return false;", string: 'return "";', "int[]": "return [];", "int[][]": "return [];", "string[]": "return [];",
  TreeNode: "return null;", ListNode: "return null;", void: "",
};

function tsStub(sig: StructSignature): string {
  if (isClass(sig)) {
    const out = [`class ${sig.funcName} {`, `    constructor(${sig.params.map((p) => `${p.name}: ${TS_T[p.type]}`).join(", ")}) {`, "", "    }"];
    for (const m of sig.methods!) {
      out.push("", `    ${m.name}(${m.params.map((p) => `${p.name}: ${TS_T[p.type]}`).join(", ")}): ${TS_T[m.returns]} {`, m.returns === "void" ? "" : `        ${TS_DEFAULT[m.returns]}`, "    }");
    }
    out.push("}");
    return out.join("\n");
  }
  const out: string[] = [];
  if (uses(sig, "tree")) out.push("/**", " * Definition for a binary tree node (provided by the judge — do not redefine it):", " * class TreeNode {", " *     val: number", " *     left: TreeNode | null", " *     right: TreeNode | null", " *     constructor(val?: number, left?: TreeNode | null, right?: TreeNode | null)", " * }", " */");
  if (uses(sig, "list")) out.push("/**", " * Definition for singly-linked list (provided by the judge — do not redefine it):", " * class ListNode {", " *     val: number", " *     next: ListNode | null", " *     constructor(val?: number, next?: ListNode | null)", " * }", " */");
  out.push(`function ${sig.funcName}(${sig.params.map((p) => `${p.name}: ${TS_T[p.type]}`).join(", ")}): ${TS_T[sig.returns]} {`, "    // Write your code here", `    ${TS_DEFAULT[sig.returns]}`, "}");
  return out.join("\n");
}

const TS_NODES = `class TreeNode {
    val: number;
    left: TreeNode | null;
    right: TreeNode | null;
    constructor(val?: number, left?: TreeNode | null, right?: TreeNode | null) {
        this.val = (val === undefined ? 0 : val);
        this.left = (left === undefined ? null : left);
        this.right = (right === undefined ? null : right);
    }
}
class ListNode {
    val: number;
    next: ListNode | null;
    constructor(val?: number, next?: ListNode | null) {
        this.val = (val === undefined ? 0 : val);
        this.next = (next === undefined ? null : next);
    }
}`;

const TS_HELPERS = `function __ckTree(a: any[]): TreeNode | null {
    if (!a || a.length === 0 || a[0] === null) return null;
    var root = new TreeNode(a[0]), q: TreeNode[] = [root], h = 0, i = 1;
    while (i < a.length && h < q.length) {
        var n = q[h++];
        if (i < a.length && a[i] !== null) { n.left = new TreeNode(a[i]); q.push(n.left); }
        i++;
        if (i < a.length && a[i] !== null) { n.right = new TreeNode(a[i]); q.push(n.right); }
        i++;
    }
    return root;
}
function __ckTreeOut(root: any): any[] {
    var out: any[] = [], q: any[] = [root === undefined ? null : root], h = 0;
    while (h < q.length) {
        var n = q[h++];
        if (n === null || n === undefined) { out.push(null); continue; }
        out.push(n.val);
        q.push(n.left === undefined ? null : n.left);
        q.push(n.right === undefined ? null : n.right);
        if (out.length > ${NODE_CAP}) throw new Error("the returned tree is too large (or has a cycle)");
    }
    while (out.length > 0 && out[out.length - 1] === null) out.pop();
    return out;
}
function __ckList(a: number[]): ListNode | null {
    var d = new ListNode(0), t = d;
    for (var i = 0; i < a.length; i++) { t.next = new ListNode(a[i]); t = t.next; }
    return d.next;
}
function __ckListOut(h: any): number[] {
    var out: number[] = [];
    while (h !== null && h !== undefined) {
        out.push(h.val);
        h = h.next;
        if (out.length > ${NODE_CAP}) throw new Error("the returned list is too long (or has a cycle)");
    }
    return out;
}`;

function tsFile(sig: StructSignature, fn: string): string {
  const nodes = uses(sig, "tree") || uses(sig, "list");
  let body: string[];
  if (isClass(sig)) {
    const branches = sig.methods!.map((m, i) => {
      const call = `__obj.${m.name}(${m.params.map((_, j) => `__a[${j}]`).join(", ")})`;
      return `${i === 0 ? "if" : "else if"} (__m === ${JSON.stringify(m.name)}) ${m.returns === "void" ? `{ ${call}; __res.push(null); }` : `{ __res.push(${call}); }`}`;
    });
    body = [
      "const __ops: any[] = JSON.parse(__lines[0]);",
      "const __all: any[] = JSON.parse(__lines[1]);",
      `const __obj = new ${sig.funcName}(${sig.params.map((_, j) => `__all[0][${j}]`).join(", ")});`,
      "const __res: any[] = [null];",
      "for (let __k = 1; __k < __ops.length; __k++) {",
      "    const __m = __ops[__k];",
      "    const __a: any[] = __all[__k];",
      ...branches.map((b) => "    " + b),
      '    else throw new Error("unknown operation " + __m);',
      "}",
      "__out.push(JSON.stringify(__res));",
    ];
  } else {
    body = [
      ...sig.params.map((p, i) => `const ${p.name}: any = ${jsIn(p.type, `JSON.parse(__lines[${i}])`)};`),
      `const __r: any = ${sig.funcName}(${sig.params.map((p) => p.name).join(", ")});`,
      `__out.push(${jsOut(sig.returns, "__r")});`,
    ];
  }
  return [
    `// ${STRUCTURED_DRIVER_MARK}`,
    nodes ? TS_NODES : "",
    fn,
    "",
    "// ---- driver (do not edit below) ----",
    nodes ? TS_HELPERS : "",
    "const __g: any = globalThis as any;",
    'const __require: (m: string) => any = typeof __g.require === "function" ? __g.require : eval("require");',
    "const __Buffer: any = __g.Buffer;",
    "const __process: any = __g.process;",
    'let __input: string = __require("fs").readFileSync(0, "utf8");',
    `if (__input.slice(0, ${GZIN.length}) === "${GZIN}") {`,
    `    __input = __require("zlib").gunzipSync(__Buffer.from(__input.slice(${GZIN.length}).replace(/\\s+/g, ""), "base64")).toString("utf8");`,
    "}",
    "const __t0: number = Date.now();",
    "const __out: string[] = [];",
    `const __chunks: string[] = __input.split("${SENTINEL}");`,
    "for (let __c = 0; __c < __chunks.length; __c++) {",
    "    const __lines: string[] = __chunks[__c].split(/\\r?\\n/).map(function (l: string) { return l.trim(); }).filter(function (l: string) { return l !== ''; });",
    "    if (__lines.length === 0) continue;",
    "    try {",
    ...indent(body, "        "),
    "    } catch (__e) {",
    `        __out.push("${ERR} " + __e);`,
    "    }",
    `    __out.push("${SENTINEL}");`,
    "}",
    '__out.push("__CODEKAIRO_STATS__ " + (Date.now() - __t0) + " " + Math.round(__process.memoryUsage().rss / 1024));',
    'const __joined = __out.join("\\n") + "\\n";',
    `__process.stdout.write("${BEGIN}\\n");`,
    `if (__joined.length > ${GZ_THRESHOLD}) {`,
    `    __process.stdout.write("${GZ}\\n" + __require("zlib").gzipSync(__Buffer.from(__joined)).toString("base64") + "\\n");`,
    "} else {",
    "    __process.stdout.write(__joined);",
    "}",
  ].join("\n");
}

// ═══════════════════════════════════════════════════════════════════
// Java (OpenJDK 13)
// ═══════════════════════════════════════════════════════════════════
const JAVA_T: Record<string, string> = {
  int: "int", bool: "boolean", string: "String", "int[]": "int[]", "int[][]": "int[][]", "string[]": "String[]",
  TreeNode: "TreeNode", ListNode: "ListNode", "ListNode[]": "ListNode[]", void: "void",
};
const JAVA_DEFAULT: Record<string, string> = {
  int: "return 0;", bool: "return false;", string: 'return "";', "int[]": "return new int[0];", "int[][]": "return new int[0][];", "string[]": "return new String[0];",
  TreeNode: "return null;", ListNode: "return null;", void: "",
};

function javaStub(sig: StructSignature): string {
  if (isClass(sig)) {
    const out = [`class ${sig.funcName} {`, "", `    public ${sig.funcName}(${sig.params.map((p) => `${JAVA_T[p.type]} ${p.name}`).join(", ")}) {`, "", "    }"];
    for (const m of sig.methods!) out.push("", `    public ${JAVA_T[m.returns]} ${m.name}(${m.params.map((p) => `${JAVA_T[p.type]} ${p.name}`).join(", ")}) {`, m.returns === "void" ? "" : `        ${JAVA_DEFAULT[m.returns]}`, "    }");
    out.push("}");
    return out.join("\n");
  }
  const out: string[] = [];
  if (uses(sig, "tree")) out.push("    /**", "     * TreeNode is provided by the judge (do not redefine it):", "     * class TreeNode {", "     *     int val; TreeNode left; TreeNode right;", "     *     TreeNode() {}  TreeNode(int val) {...}  TreeNode(int val, TreeNode left, TreeNode right) {...}", "     * }", "     */");
  if (uses(sig, "list")) out.push("    /**", "     * ListNode is provided by the judge (do not redefine it):", "     * class ListNode {", "     *     int val; ListNode next;", "     *     ListNode() {}  ListNode(int val) {...}  ListNode(int val, ListNode next) {...}", "     * }", "     */");
  out.push(`    public static ${JAVA_T[sig.returns]} ${sig.funcName}(${sig.params.map((p) => `${JAVA_T[p.type]} ${p.name}`).join(", ")}) {`, "        // Write your code here", `        ${JAVA_DEFAULT[sig.returns]}`, "    }");
  return out.join("\n");
}

const JAVA_NODES = `class TreeNode {
    int val;
    TreeNode left;
    TreeNode right;
    TreeNode() {}
    TreeNode(int val) { this.val = val; }
    TreeNode(int val, TreeNode left, TreeNode right) { this.val = val; this.left = left; this.right = right; }
}
class ListNode {
    int val;
    ListNode next;
    ListNode() {}
    ListNode(int val) { this.val = val; }
    ListNode(int val, ListNode next) { this.val = val; this.next = next; }
}`;

const JAVA_HELPERS = `    // ---- driver (do not edit below) ----
    static java.util.List<String> ckSplit(String s) {
        java.util.List<String> out = new java.util.ArrayList<>();
        s = s.trim();
        if (s.length() < 2) return out;
        int depth = 0, start = 1;
        boolean q = false;
        for (int i = 1; i < s.length() - 1; i++) {
            char c = s.charAt(i);
            if (q) { if (c == '"') q = false; continue; }
            if (c == '"') q = true;
            else if (c == '[') depth++;
            else if (c == ']') depth--;
            else if (c == ',' && depth == 0) { out.add(s.substring(start, i).trim()); start = i + 1; }
        }
        String last = s.substring(start, s.length() - 1).trim();
        if (!last.isEmpty() || !out.isEmpty()) out.add(last);
        return out;
    }
    static int ckInt(String t) { return Integer.parseInt(t.trim()); }
    static String ckStr(String t) {
        t = t.trim();
        if (t.length() >= 2 && t.charAt(0) == '"' && t.charAt(t.length() - 1) == '"') return t.substring(1, t.length() - 1);
        return t;
    }
    static int[] ckIntArr(String t) {
        java.util.List<String> p = ckSplit(t);
        int[] r = new int[p.size()];
        for (int i = 0; i < r.length; i++) r[i] = ckInt(p.get(i));
        return r;
    }
    static int[][] ckIntMat(String t) {
        java.util.List<String> p = ckSplit(t);
        int[][] r = new int[p.size()][];
        for (int i = 0; i < r.length; i++) r[i] = ckIntArr(p.get(i));
        return r;
    }
    static String[] ckStrArr(String t) {
        java.util.List<String> p = ckSplit(t);
        String[] r = new String[p.size()];
        for (int i = 0; i < r.length; i++) r[i] = ckStr(p.get(i));
        return r;
    }
    static String ckQ(String s) { return "\\"" + s + "\\""; }
    static String ckB(boolean b) { return b ? "true" : "false"; }
    static String ckFmtIntArr(int[] a) {
        StringBuilder sb = new StringBuilder("[");
        for (int i = 0; i < a.length; i++) { if (i > 0) sb.append(","); sb.append(a[i]); }
        return sb.append("]").toString();
    }
    static String ckFmtIntMat(int[][] m) {
        StringBuilder sb = new StringBuilder("[");
        for (int i = 0; i < m.length; i++) { if (i > 0) sb.append(","); sb.append(ckFmtIntArr(m[i])); }
        return sb.append("]").toString();
    }
    static String ckFmtStrArr(String[] a) {
        StringBuilder sb = new StringBuilder("[");
        for (int i = 0; i < a.length; i++) { if (i > 0) sb.append(","); sb.append(ckQ(a[i])); }
        return sb.append("]").toString();
    }`;

const JAVA_TREE_HELPERS = `    static TreeNode ckTree(String t) {
        java.util.List<String> p = ckSplit(t);
        if (p.isEmpty() || p.get(0).equals("null")) return null;
        TreeNode root = new TreeNode(ckInt(p.get(0)));
        java.util.ArrayList<TreeNode> q = new java.util.ArrayList<>();
        q.add(root);
        int h = 0, i = 1;
        while (i < p.size() && h < q.size()) {
            TreeNode n = q.get(h++);
            if (i < p.size() && !p.get(i).equals("null")) { n.left = new TreeNode(ckInt(p.get(i))); q.add(n.left); }
            i++;
            if (i < p.size() && !p.get(i).equals("null")) { n.right = new TreeNode(ckInt(p.get(i))); q.add(n.right); }
            i++;
        }
        return root;
    }
    static String ckFmtTree(TreeNode root) {
        java.util.ArrayList<TreeNode> q = new java.util.ArrayList<>();
        java.util.ArrayList<String> out = new java.util.ArrayList<>();
        q.add(root);
        int h = 0;
        while (h < q.size()) {
            TreeNode n = q.get(h++);
            if (n == null) { out.add("null"); continue; }
            out.add(String.valueOf(n.val));
            q.add(n.left);
            q.add(n.right);
            if (out.size() > ${NODE_CAP}) throw new RuntimeException("the returned tree is too large (or has a cycle)");
        }
        int end = out.size();
        while (end > 0 && out.get(end - 1).equals("null")) end--;
        return "[" + String.join(",", out.subList(0, end)) + "]";
    }`;

const JAVA_LIST_HELPERS = `    static ListNode ckList(String t) {
        ListNode d = new ListNode(0), tail = d;
        for (String x : ckSplit(t)) { tail.next = new ListNode(ckInt(x)); tail = tail.next; }
        return d.next;
    }
    static ListNode[] ckLists(String t) {
        java.util.List<String> p = ckSplit(t);
        ListNode[] r = new ListNode[p.size()];
        for (int i = 0; i < r.length; i++) r[i] = ckList(p.get(i));
        return r;
    }
    static String ckFmtList(ListNode h) {
        StringBuilder sb = new StringBuilder("[");
        int n = 0;
        while (h != null) {
            if (n > 0) sb.append(",");
            sb.append(h.val);
            h = h.next;
            if (++n > ${NODE_CAP}) throw new RuntimeException("the returned list is too long (or has a cycle)");
        }
        return sb.append("]").toString();
    }`;

const javaParse = (t: string, v: string) =>
  ({ int: `ckInt(${v})`, string: `ckStr(${v})`, "int[]": `ckIntArr(${v})`, "int[][]": `ckIntMat(${v})`, "string[]": `ckStrArr(${v})`, TreeNode: `ckTree(${v})`, ListNode: `ckList(${v})`, "ListNode[]": `ckLists(${v})` } as Record<string, string>)[t];
const javaFmt = (t: string, v: string, inArray: boolean) =>
  ({ int: `String.valueOf(${v})`, bool: `ckB(${v})`, string: inArray ? `ckQ(${v})` : `${v}`, "int[]": `ckFmtIntArr(${v})`, "int[][]": `ckFmtIntMat(${v})`, "string[]": `ckFmtStrArr(${v})`, TreeNode: `ckFmtTree(${v})`, ListNode: `ckFmtList(${v})` } as Record<string, string>)[t];

function javaFile(sig: StructSignature, fn: string): string {
  const helpers = [JAVA_HELPERS, uses(sig, "tree") ? JAVA_TREE_HELPERS : "", uses(sig, "list") ? JAVA_LIST_HELPERS : ""].filter(Boolean).join("\n");
  let body: string[];
  if (isClass(sig)) {
    const branches = sig.methods!.map((m, i) => {
      const call = `__obj.${m.name}(${m.params.map((p, j) => javaParse(p.type, `__a.get(${j})`)).join(", ")})`;
      return `${i === 0 ? "if" : "else if"} (__m.equals(${JSON.stringify(m.name)})) ${m.returns === "void" ? `{ ${call}; __res.add("null"); }` : `{ __res.add(${javaFmt(m.returns, call, true)}); }`}`;
    });
    body = [
      "String[] __ops = ckStrArr(lines.get(0));",
      "java.util.List<String> __all = ckSplit(lines.get(1));",
      "java.util.List<String> __a0 = ckSplit(__all.get(0));",
      `${sig.funcName} __obj = new ${sig.funcName}(${sig.params.map((p, j) => javaParse(p.type, `__a0.get(${j})`)).join(", ")});`,
      "java.util.List<String> __res = new java.util.ArrayList<>();",
      '__res.add("null");',
      "for (int __k = 1; __k < __ops.length; __k++) {",
      "    String __m = __ops[__k];",
      "    java.util.List<String> __a = ckSplit(__all.get(__k));",
      ...branches.map((b) => "    " + b),
      '    else throw new RuntimeException("unknown operation " + __m);',
      "}",
      'OUT.append("[").append(String.join(",", __res)).append("]\\n");',
    ];
  } else {
    body = [
      ...sig.params.map((p, i) => `${JAVA_T[p.type]} ${p.name} = ${javaParse(p.type, `lines.get(${i})`)};`),
      `OUT.append(${javaFmt(sig.returns, `${sig.funcName}(${sig.params.map((p) => p.name).join(", ")})`, false)}).append("\\n");`,
    ];
  }
  const main = [
    "    public static void main(String[] args) throws Exception {",
    '        java.util.Scanner scin = new java.util.Scanner(System.in).useDelimiter("\\\\A");',
    '        String raw = scin.hasNext() ? scin.next() : "";',
    `        if (raw.startsWith("${GZIN}")) {`,
    `            String b64 = raw.substring(${GZIN.length}).replaceAll("\\\\s", "");`,
    "            java.util.zip.GZIPInputStream gzin = new java.util.zip.GZIPInputStream(new java.io.ByteArrayInputStream(java.util.Base64.getDecoder().decode(b64)));",
    '            raw = new String(gzin.readAllBytes(), "UTF-8");',
    "        }",
    "        java.util.List<java.util.List<String>> cases = new java.util.ArrayList<>();",
    "        java.util.List<String> cur = new java.util.ArrayList<>();",
    '        for (String l0 : raw.split("\\n")) {',
    "            String l = l0.trim();",
    `            if (l.equals("${SENTINEL}")) {`,
    "                if (!cur.isEmpty()) { cases.add(cur); cur = new java.util.ArrayList<>(); }",
    "            } else if (!l.isEmpty()) {",
    "                cur.add(l);",
    "            }",
    "        }",
    "        if (!cur.isEmpty()) cases.add(cur);",
    "        long __t0 = System.currentTimeMillis();",
    "        StringBuilder OUT = new StringBuilder();",
    "        for (java.util.List<String> lines : cases) {",
    "            try {",
    ...indent(body, "                "),
    "            } catch (Exception e) {",
    `                OUT.append("${ERR} " + e).append("\\n");`,
    "            } catch (StackOverflowError e) {",
    `                OUT.append("${ERR} " + e).append("\\n");`,
    "            }",
    `            OUT.append("${SENTINEL}\\n");`,
    "        }",
    "        long __mem = (Runtime.getRuntime().totalMemory() - Runtime.getRuntime().freeMemory()) / 1024;",
    '        OUT.append("__CODEKAIRO_STATS__ " + (System.currentTimeMillis() - __t0) + " " + __mem + "\\n");',
    "        String joined = OUT.toString();",
    `        System.out.println("${BEGIN}");`,
    `        if (joined.length() > ${GZ_THRESHOLD}) {`,
    "            java.io.ByteArrayOutputStream bos = new java.io.ByteArrayOutputStream();",
    "            java.util.zip.GZIPOutputStream gz = new java.util.zip.GZIPOutputStream(bos);",
    '            gz.write(joined.getBytes("UTF-8"));',
    "            gz.close();",
    `            System.out.println("${GZ}");`,
    "            System.out.println(java.util.Base64.getEncoder().encodeToString(bos.toByteArray()));",
    "        } else {",
    "            System.out.print(joined);",
    "        }",
    "    }",
  ];
  const nodes = uses(sig, "tree") || uses(sig, "list") ? JAVA_NODES : "";
  if (isClass(sig)) {
    return ["import java.util.*;", "", fn, "", "public class Main {", helpers, "", ...main, "}"].join("\n");
  }
  return ["import java.util.*;", "", nodes, "", "public class Main {", fn, "", helpers, "", ...main, "}"].join("\n");
}

// ═══════════════════════════════════════════════════════════════════
// C++ (GCC 9)
// ═══════════════════════════════════════════════════════════════════
const CPP_T: Record<string, string> = {
  int: "int", bool: "bool", string: "string", "int[]": "vector<int>", "int[][]": "vector<vector<int>>", "string[]": "vector<string>",
  TreeNode: "TreeNode*", ListNode: "ListNode*", "ListNode[]": "vector<ListNode*>", void: "void",
};
const CPP_DEFAULT: Record<string, string> = {
  int: "return 0;", bool: "return false;", string: 'return "";', "int[]": "return {};", "int[][]": "return {};", "string[]": "return {};",
  TreeNode: "return nullptr;", ListNode: "return nullptr;", void: "",
};
const cppParam = (p: SParam) => (p.type.endsWith("[]") || p.type.endsWith("[][]") ? `${CPP_T[p.type]}& ${p.name}` : `${CPP_T[p.type]} ${p.name}`);

function cppStub(sig: StructSignature): string {
  if (isClass(sig)) {
    const out = [`class ${sig.funcName} {`, "public:", `    ${sig.funcName}(${sig.params.map(cppParam).join(", ")}) {`, "        ", "    }"];
    for (const m of sig.methods!) out.push("    ", `    ${CPP_T[m.returns]} ${m.name}(${m.params.map(cppParam).join(", ")}) {`, m.returns === "void" ? "        " : `        ${CPP_DEFAULT[m.returns]}`, "    }");
    out.push("};");
    return out.join("\n");
  }
  const out: string[] = [];
  if (uses(sig, "tree")) out.push("/**", " * Definition for a binary tree node (provided by the judge — do not redefine it):", " * struct TreeNode {", " *     int val;", " *     TreeNode *left;", " *     TreeNode *right;", " *     TreeNode() : val(0), left(nullptr), right(nullptr) {}", " *     TreeNode(int x) : val(x), left(nullptr), right(nullptr) {}", " *     TreeNode(int x, TreeNode *left, TreeNode *right) : val(x), left(left), right(right) {}", " * };", " */");
  if (uses(sig, "list")) out.push("/**", " * Definition for singly-linked list (provided by the judge — do not redefine it):", " * struct ListNode {", " *     int val;", " *     ListNode *next;", " *     ListNode() : val(0), next(nullptr) {}", " *     ListNode(int x) : val(x), next(nullptr) {}", " *     ListNode(int x, ListNode *next) : val(x), next(next) {}", " * };", " */");
  out.push(`${CPP_T[sig.returns]} ${sig.funcName}(${sig.params.map(cppParam).join(", ")}) {`, "    // Write your code here", `    ${CPP_DEFAULT[sig.returns]}`, "}");
  return out.join("\n");
}

const CPP_NODES = `struct TreeNode {
    int val;
    TreeNode *left;
    TreeNode *right;
    TreeNode() : val(0), left(nullptr), right(nullptr) {}
    TreeNode(int x) : val(x), left(nullptr), right(nullptr) {}
    TreeNode(int x, TreeNode *left, TreeNode *right) : val(x), left(left), right(right) {}
};
struct ListNode {
    int val;
    ListNode *next;
    ListNode() : val(0), next(nullptr) {}
    ListNode(int x) : val(x), next(nullptr) {}
    ListNode(int x, ListNode *next) : val(x), next(next) {}
};`;

const CPP_HELPERS = `// ---- driver (do not edit below) ----
static string ckTrim(const string& s) {
    size_t b = s.find_first_not_of(" \\t\\r\\n");
    if (b == string::npos) return "";
    size_t e = s.find_last_not_of(" \\t\\r\\n");
    return s.substr(b, e - b + 1);
}
static vector<string> ckSplit(const string& s0) {
    vector<string> out;
    string s = ckTrim(s0);
    if (s.size() < 2) return out;
    int depth = 0;
    bool q = false;
    size_t start = 1;
    for (size_t i = 1; i + 1 < s.size(); i++) {
        char c = s[i];
        if (q) { if (c == '"') q = false; continue; }
        if (c == '"') q = true;
        else if (c == '[') depth++;
        else if (c == ']') depth--;
        else if (c == ',' && depth == 0) { out.push_back(ckTrim(s.substr(start, i - start))); start = i + 1; }
    }
    string last = ckTrim(s.substr(start, s.size() - 1 - start));
    if (!last.empty() || !out.empty()) out.push_back(last);
    return out;
}
static int ckInt(const string& t) { return stoi(ckTrim(t)); }
static string ckStr(const string& t) {
    string s = ckTrim(t);
    if (s.size() >= 2 && s.front() == '"' && s.back() == '"') return s.substr(1, s.size() - 2);
    return s;
}
static vector<int> ckIntArr(const string& t) { vector<int> r; for (auto& x : ckSplit(t)) r.push_back(ckInt(x)); return r; }
static vector<vector<int>> ckIntMat(const string& t) { vector<vector<int>> r; for (auto& x : ckSplit(t)) r.push_back(ckIntArr(x)); return r; }
static vector<string> ckStrArr(const string& t) { vector<string> r; for (auto& x : ckSplit(t)) r.push_back(ckStr(x)); return r; }
static string ckQ(const string& s) { return "\\"" + s + "\\""; }
static string ckB(bool b) { return b ? "true" : "false"; }
static string ckFmtIntArr(const vector<int>& a) {
    string r = "[";
    for (size_t i = 0; i < a.size(); i++) { if (i) r += ","; r += to_string(a[i]); }
    return r + "]";
}
static string ckFmtIntMat(const vector<vector<int>>& m) {
    string r = "[";
    for (size_t i = 0; i < m.size(); i++) { if (i) r += ","; r += ckFmtIntArr(m[i]); }
    return r + "]";
}
static string ckFmtStrArr(const vector<string>& a) {
    string r = "[";
    for (size_t i = 0; i < a.size(); i++) { if (i) r += ","; r += ckQ(a[i]); }
    return r + "]";
}`;

const CPP_TREE_HELPERS = `static TreeNode* ckTree(const string& t) {
    vector<string> p = ckSplit(t);
    if (p.empty() || p[0] == "null") return nullptr;
    TreeNode* root = new TreeNode(ckInt(p[0]));
    vector<TreeNode*> q;
    q.push_back(root);
    size_t h = 0, i = 1;
    while (i < p.size() && h < q.size()) {
        TreeNode* n = q[h++];
        if (i < p.size() && p[i] != "null") { n->left = new TreeNode(ckInt(p[i])); q.push_back(n->left); }
        i++;
        if (i < p.size() && p[i] != "null") { n->right = new TreeNode(ckInt(p[i])); q.push_back(n->right); }
        i++;
    }
    return root;
}
static string ckFmtTree(TreeNode* root) {
    vector<TreeNode*> q;
    vector<string> out;
    q.push_back(root);
    size_t h = 0;
    while (h < q.size()) {
        TreeNode* n = q[h++];
        if (!n) { out.push_back("null"); continue; }
        out.push_back(to_string(n->val));
        q.push_back(n->left);
        q.push_back(n->right);
        if (out.size() > ${NODE_CAP}) throw runtime_error("the returned tree is too large (or has a cycle)");
    }
    while (!out.empty() && out.back() == "null") out.pop_back();
    string r = "[";
    for (size_t i = 0; i < out.size(); i++) { if (i) r += ","; r += out[i]; }
    return r + "]";
}`;

const CPP_LIST_HELPERS = `static ListNode* ckList(const string& t) {
    ListNode dummy;
    ListNode* tail = &dummy;
    for (auto& x : ckSplit(t)) { tail->next = new ListNode(ckInt(x)); tail = tail->next; }
    return dummy.next;
}
static vector<ListNode*> ckLists(const string& t) { vector<ListNode*> r; for (auto& x : ckSplit(t)) r.push_back(ckList(x)); return r; }
static string ckFmtList(ListNode* h) {
    string r = "[";
    size_t n = 0;
    while (h) {
        if (n) r += ",";
        r += to_string(h->val);
        h = h->next;
        if (++n > ${NODE_CAP}) throw runtime_error("the returned list is too long (or has a cycle)");
    }
    return r + "]";
}`;

const cppParse = (t: string, v: string) =>
  ({ int: `ckInt(${v})`, string: `ckStr(${v})`, "int[]": `ckIntArr(${v})`, "int[][]": `ckIntMat(${v})`, "string[]": `ckStrArr(${v})`, TreeNode: `ckTree(${v})`, ListNode: `ckList(${v})`, "ListNode[]": `ckLists(${v})` } as Record<string, string>)[t];
const cppFmt = (t: string, v: string, inArray: boolean) =>
  ({ int: `to_string(${v})`, bool: `ckB(${v})`, string: inArray ? `ckQ(${v})` : `string(${v})`, "int[]": `ckFmtIntArr(${v})`, "int[][]": `ckFmtIntMat(${v})`, "string[]": `ckFmtStrArr(${v})`, TreeNode: `ckFmtTree(${v})`, ListNode: `ckFmtList(${v})` } as Record<string, string>)[t];

function cppFile(sig: StructSignature, fn: string): string {
  let body: string[];
  if (isClass(sig)) {
    // Each argument is parsed into a named local first: a method taking
    // `vector<int>&` cannot bind a temporary.
    const branches = sig.methods!.flatMap((m, i) => {
      const locals = m.params.map((p, j) => `${CPP_T[p.type]} __p${j} = ${cppParse(p.type, `__a[${j}]`)};`);
      const call = `__obj->${m.name}(${m.params.map((_, j) => `__p${j}`).join(", ")})`;
      return [`${i === 0 ? "if" : "else if"} (__m == ${JSON.stringify(m.name)}) {`, ...locals.map((l) => "    " + l), m.returns === "void" ? `    ${call}; __res.push_back("null");` : `    __res.push_back(${cppFmt(m.returns, call, true)});`, "}"];
    });
    body = [
      "vector<string> __ops = ckStrArr(lines[0]);",
      "vector<string> __all = ckSplit(lines[1]);",
      "vector<string> __a0 = ckSplit(__all[0]);",
      ...sig.params.map((p, j) => `${CPP_T[p.type]} __c${j} = ${cppParse(p.type, `__a0[${j}]`)};`),
      `${sig.funcName}* __obj = new ${sig.funcName}(${sig.params.map((_, j) => `__c${j}`).join(", ")});`,
      'vector<string> __res(1, "null");',
      "for (size_t __k = 1; __k < __ops.size(); __k++) {",
      "    const string& __m = __ops[__k];",
      "    vector<string> __a = ckSplit(__all[__k]);",
      ...branches.map((b) => "    " + b),
      '    else throw runtime_error("unknown operation " + __m);',
      "}",
      "string __line = \"[\";",
      "for (size_t __i = 0; __i < __res.size(); __i++) { if (__i) __line += \",\"; __line += __res[__i]; }",
      '__OUT << __line << "]\\n";',
    ];
  } else {
    body = [
      ...sig.params.map((p, i) => `${CPP_T[p.type]} ${p.name} = ${cppParse(p.type, `lines[${i}]`)};`),
      `__OUT << ${cppFmt(sig.returns, `${sig.funcName}(${sig.params.map((p) => p.name).join(", ")})`, false)} << "\\n";`,
    ];
  }
  const nodes = uses(sig, "tree") || uses(sig, "list") ? CPP_NODES : "";
  return [
    "#include <bits/stdc++.h>",
    "#include <sys/resource.h>",
    "using namespace std;",
    "",
    nodes,
    "",
    fn,
    "",
    CPP_HELPERS,
    uses(sig, "tree") ? CPP_TREE_HELPERS : "",
    uses(sig, "list") ? CPP_LIST_HELPERS : "",
    "",
    "int main() {",
    "    ostringstream __OUT;",
    "    vector<vector<string>> cases;",
    "    vector<string> cur;",
    "    string line;",
    "    while (getline(cin, line)) {",
    "        string t = ckTrim(line);",
    `        if (t == "${SENTINEL}") {`,
    "            if (!cur.empty()) { cases.push_back(cur); cur.clear(); }",
    "        } else if (!t.empty()) {",
    "            cur.push_back(t);",
    "        }",
    "    }",
    "    if (!cur.empty()) cases.push_back(cur);",
    "    for (auto& lines : cases) {",
    "        try {",
    ...indent(body, "            "),
    "        } catch (const exception& __e) {",
    `            __OUT << "${ERR} " << __e.what() << "\\n";`,
    "        } catch (...) {",
    `            __OUT << "${ERR} runtime error\\n";`,
    "        }",
    `        __OUT << "${SENTINEL}\\n";`,
    "    }",
    "    struct rusage __ru;",
    "    getrusage(RUSAGE_SELF, &__ru);",
    "    long __cpu_ms = (__ru.ru_utime.tv_sec + __ru.ru_stime.tv_sec) * 1000 + (__ru.ru_utime.tv_usec + __ru.ru_stime.tv_usec) / 1000;",
    '    __OUT << "__CODEKAIRO_STATS__ " << __cpu_ms << " " << __ru.ru_maxrss << "\\n";',
    "    cout.flush();",
    "    fflush(stdout);",
    `    cout << "${BEGIN}\\n" << __OUT.str();`,
    "    cout.flush();",
    "    return 0;",
    "}",
  ].join("\n");
}

// ═══════════════════════════════════════════════════════════════════
// C (GCC 9) — LeetCode's C conventions: arrays carry a size, array returns
// a returnSize, design classes are a typedef'd struct with prefixed functions
// (`LRUCache` → lRUCacheCreate / lRUCacheGet / lRUCacheFree).
// ═══════════════════════════════════════════════════════════════════
function cParams(params: SParam[]): string[] {
  const parts: string[] = [];
  for (const p of params) {
    if (p.type === "int[][]") parts.push(`int** ${p.name}`, `int ${p.name}Size`, `int* ${p.name}ColSize`);
    else if (p.type === "int[]") parts.push(`int* ${p.name}`, `int ${p.name}Size`);
    else if (p.type === "string[]") parts.push(`char** ${p.name}`, `int ${p.name}Size`);
    else if (p.type === "string") parts.push(`char* ${p.name}`);
    else if (p.type === "TreeNode") parts.push(`struct TreeNode* ${p.name}`);
    else if (p.type === "ListNode") parts.push(`struct ListNode* ${p.name}`);
    else if (p.type === "ListNode[]") parts.push(`struct ListNode** ${p.name}`, `int ${p.name}Size`);
    else parts.push(`int ${p.name}`);
  }
  return parts;
}
function cRetParams(ret: string): string[] {
  if (ret === "int[][]") return ["int* returnSize", "int** returnColumnSizes"];
  if (ret === "int[]" || ret === "string[]") return ["int* returnSize"];
  return [];
}
const C_RET: Record<string, string> = {
  int: "int", bool: "bool", string: "char*", "int[]": "int*", "int[][]": "int**", "string[]": "char**",
  TreeNode: "struct TreeNode*", ListNode: "struct ListNode*", void: "void",
};
const C_DEFAULT: Record<string, string> = {
  int: "return 0;", bool: "return false;", string: 'return "";', "int[]": "*returnSize = 0;\n    return NULL;", "int[][]": "*returnSize = 0;\n    return NULL;",
  "string[]": "*returnSize = 0;\n    return NULL;", TreeNode: "return NULL;", ListNode: "return NULL;", void: "",
};
const cPrefix = (cls: string) => lowerFirst(cls);

function cStub(sig: StructSignature): string {
  if (isClass(sig)) {
    const pre = cPrefix(sig.funcName);
    const out = ["typedef struct {", "    ", `} ${sig.funcName};`, "", "", `${sig.funcName}* ${pre}Create(${cParams(sig.params).join(", ")}) {`, "    return NULL;", "}"];
    for (const m of sig.methods!) {
      const ps = [`${sig.funcName}* obj`, ...cParams(m.params), ...cRetParams(m.returns)];
      out.push("", `${C_RET[m.returns]} ${pre}${cap(m.name)}(${ps.join(", ")}) {`, m.returns === "void" ? "    " : `    ${C_DEFAULT[m.returns]}`, "}");
    }
    out.push("", `void ${pre}Free(${sig.funcName}* obj) {`, "    ", "}");
    return out.join("\n");
  }
  const out: string[] = [];
  if (uses(sig, "tree")) out.push("/**", " * Definition for a binary tree node (provided by the judge — do not redefine it):", " * struct TreeNode {", " *     int val;", " *     struct TreeNode *left;", " *     struct TreeNode *right;", " * };", " */");
  if (uses(sig, "list")) out.push("/**", " * Definition for singly-linked list (provided by the judge — do not redefine it):", " * struct ListNode {", " *     int val;", " *     struct ListNode *next;", " * };", " */");
  out.push(`${C_RET[sig.returns]} ${sig.funcName}(${[...cParams(sig.params), ...cRetParams(sig.returns)].join(", ")}) {`, "    // Write your code here", `    ${C_DEFAULT[sig.returns]}`, "}");
  return out.join("\n");
}

const C_NODES = `struct TreeNode {
    int val;
    struct TreeNode *left;
    struct TreeNode *right;
};
struct ListNode {
    int val;
    struct ListNode *next;
};`;

const C_HELPERS = `// ---- driver (do not edit below) ----
static char* __obuf = NULL;
static size_t __olen = 0, __ocap = 0;
static void __emit(const char* fmt, ...) {
    va_list ap, ap2;
    va_start(ap, fmt);
    va_copy(ap2, ap);
    int need = vsnprintf(NULL, 0, fmt, ap);
    va_end(ap);
    if (need < 0) { va_end(ap2); return; }
    if (__olen + (size_t)need + 1 > __ocap) {
        if (__ocap == 0) __ocap = 65536;
        while (__olen + (size_t)need + 1 > __ocap) __ocap *= 2;
        __obuf = (char*)realloc(__obuf, __ocap);
    }
    vsnprintf(__obuf + __olen, __ocap - __olen, fmt, ap2);
    va_end(ap2);
    __olen += (size_t)need;
}
static char* ck_dup(const char* s, int len) {
    char* r = (char*)malloc((size_t)len + 1);
    memcpy(r, s, (size_t)len);
    r[len] = '\\0';
    return r;
}
static char* ck_trim(const char* s) {
    int b = 0, e = (int)strlen(s);
    while (b < e && (s[b] == ' ' || s[b] == '\\t' || s[b] == '\\r' || s[b] == '\\n')) b++;
    while (e > b && (s[e - 1] == ' ' || s[e - 1] == '\\t' || s[e - 1] == '\\r' || s[e - 1] == '\\n')) e--;
    return ck_dup(s + b, e - b);
}
static int ck_split(const char* s0, char*** out) {
    char* s = ck_trim(s0);
    int n = (int)strlen(s), cap = 8, cnt = 0;
    char** arr = (char**)malloc((size_t)cap * sizeof(char*));
    if (n >= 2) {
        int depth = 0, q = 0, start = 1;
        for (int i = 1; i < n - 1; i++) {
            char c = s[i];
            if (q) { if (c == '"') q = 0; continue; }
            if (c == '"') q = 1;
            else if (c == '[') depth++;
            else if (c == ']') depth--;
            else if (c == ',' && depth == 0) {
                if (cnt == cap) { cap *= 2; arr = (char**)realloc(arr, (size_t)cap * sizeof(char*)); }
                char* piece = ck_dup(s + start, i - start);
                arr[cnt++] = ck_trim(piece);
                free(piece);
                start = i + 1;
            }
        }
        char* piece = ck_dup(s + start, n - 1 - start);
        char* last = ck_trim(piece);
        free(piece);
        if (last[0] != '\\0' || cnt > 0) {
            if (cnt == cap) { cap *= 2; arr = (char**)realloc(arr, (size_t)cap * sizeof(char*)); }
            arr[cnt++] = last;
        } else {
            free(last);
        }
    }
    free(s);
    *out = arr;
    return cnt;
}
static void ck_free_parts(char** p, int n) { for (int i = 0; i < n; i++) free(p[i]); free(p); }
static int ck_int(const char* t) { return atoi(t); }
static char* ck_str(const char* t) {
    char* s = ck_trim(t);
    int n = (int)strlen(s);
    if (n >= 2 && s[0] == '"' && s[n - 1] == '"') { char* r = ck_dup(s + 1, n - 2); free(s); return r; }
    return s;
}
static int ck_int_arr(const char* t, int** out) {
    char** p;
    int n = ck_split(t, &p);
    int* a = (int*)malloc((size_t)(n > 0 ? n : 1) * sizeof(int));
    for (int i = 0; i < n; i++) a[i] = ck_int(p[i]);
    ck_free_parts(p, n);
    *out = a;
    return n;
}
static int ck_int_mat(const char* t, int*** out, int** cols) {
    char** p;
    int n = ck_split(t, &p);
    int** m = (int**)malloc((size_t)(n > 0 ? n : 1) * sizeof(int*));
    int* c = (int*)malloc((size_t)(n > 0 ? n : 1) * sizeof(int));
    for (int i = 0; i < n; i++) c[i] = ck_int_arr(p[i], &m[i]);
    ck_free_parts(p, n);
    *out = m;
    *cols = c;
    return n;
}
static int ck_str_arr(const char* t, char*** out) {
    char** p;
    int n = ck_split(t, &p);
    for (int i = 0; i < n; i++) { char* s = ck_str(p[i]); free(p[i]); p[i] = s; }
    *out = p;
    return n;
}
static void ck_emit_int_arr(const int* a, int n) {
    __emit("[");
    for (int i = 0; i < n; i++) { if (i) __emit(","); __emit("%d", a[i]); }
    __emit("]");
}
static void ck_emit_int_mat(int** m, int n, const int* cols) {
    __emit("[");
    for (int i = 0; i < n; i++) { if (i) __emit(","); ck_emit_int_arr(m[i], cols ? cols[i] : 0); }
    __emit("]");
}
static void ck_emit_str_arr(char** a, int n) {
    __emit("[");
    for (int i = 0; i < n; i++) { if (i) __emit(","); __emit("\\"%s\\"", a[i] ? a[i] : ""); }
    __emit("]");
}`;

const C_TREE_HELPERS = `static struct TreeNode* ck_new_tree(int v) {
    struct TreeNode* x = (struct TreeNode*)malloc(sizeof(struct TreeNode));
    x->val = v;
    x->left = NULL;
    x->right = NULL;
    return x;
}
static struct TreeNode* ck_tree(const char* t) {
    char** p;
    int n = ck_split(t, &p);
    struct TreeNode* root = NULL;
    if (n > 0 && strcmp(p[0], "null") != 0) {
        struct TreeNode** q = (struct TreeNode**)malloc((size_t)n * sizeof(struct TreeNode*));
        int h = 0, tl = 0, i = 1;
        root = ck_new_tree(ck_int(p[0]));
        q[tl++] = root;
        while (i < n && h < tl) {
            struct TreeNode* nd = q[h++];
            if (i < n && strcmp(p[i], "null") != 0) { nd->left = ck_new_tree(ck_int(p[i])); q[tl++] = nd->left; }
            i++;
            if (i < n && strcmp(p[i], "null") != 0) { nd->right = ck_new_tree(ck_int(p[i])); q[tl++] = nd->right; }
            i++;
        }
        free(q);
    }
    ck_free_parts(p, n);
    return root;
}
static void ck_emit_tree(struct TreeNode* root) {
    int cap = 64, tl = 0, h = 0, outN = 0, lastReal = 0;
    struct TreeNode** q = (struct TreeNode**)malloc((size_t)cap * sizeof(struct TreeNode*));
    q[tl++] = root;
    __emit("[");
    // Values are emitted as they come; nulls are held back until a real value
    // follows them, which drops the trailing ones without a second pass.
    int pendingNulls = 0;
    while (h < tl) {
        struct TreeNode* n = q[h++];
        if (n == NULL) { pendingNulls++; continue; }
        for (; pendingNulls > 0; pendingNulls--) { if (outN++) __emit(","); __emit("null"); }
        if (outN++) __emit(",");
        __emit("%d", n->val);
        lastReal = outN;
        if (tl + 2 > cap) { cap *= 2; q = (struct TreeNode**)realloc(q, (size_t)cap * sizeof(struct TreeNode*)); }
        q[tl++] = n->left;
        q[tl++] = n->right;
        if (outN > ${NODE_CAP}) break;
    }
    (void)lastReal;
    free(q);
    __emit("]");
}`;

const C_LIST_HELPERS = `static struct ListNode* ck_list(const char* t) {
    int* a;
    int n = ck_int_arr(t, &a);
    struct ListNode* head = NULL;
    for (int i = n - 1; i >= 0; i--) {
        struct ListNode* x = (struct ListNode*)malloc(sizeof(struct ListNode));
        x->val = a[i];
        x->next = head;
        head = x;
    }
    free(a);
    return head;
}
static int ck_lists(const char* t, struct ListNode*** out) {
    char** p;
    int n = ck_split(t, &p);
    struct ListNode** r = (struct ListNode**)malloc((size_t)(n > 0 ? n : 1) * sizeof(struct ListNode*));
    for (int i = 0; i < n; i++) r[i] = ck_list(p[i]);
    ck_free_parts(p, n);
    *out = r;
    return n;
}
static void ck_emit_list(struct ListNode* h) {
    int n = 0;
    __emit("[");
    while (h != NULL && n <= ${NODE_CAP}) {
        if (n++) __emit(",");
        __emit("%d", h->val);
        h = h->next;
    }
    __emit("]");
}`;

/** Declarations + call arguments for one value read from the text expression `src`. */
function cRead(p: SParam, src: string, id: string): { decl: string[]; args: string[] } {
  switch (p.type) {
    case "int[][]": return { decl: [`int** ${id}; int* ${id}Col; int ${id}N = ck_int_mat(${src}, &${id}, &${id}Col);`], args: [id, `${id}N`, `${id}Col`] };
    case "int[]": return { decl: [`int* ${id}; int ${id}N = ck_int_arr(${src}, &${id});`], args: [id, `${id}N`] };
    case "string[]": return { decl: [`char** ${id}; int ${id}N = ck_str_arr(${src}, &${id});`], args: [id, `${id}N`] };
    case "string": return { decl: [`char* ${id} = ck_str(${src});`], args: [id] };
    case "TreeNode": return { decl: [`struct TreeNode* ${id} = ck_tree(${src});`], args: [id] };
    case "ListNode": return { decl: [`struct ListNode* ${id} = ck_list(${src});`], args: [id] };
    case "ListNode[]": return { decl: [`struct ListNode** ${id}; int ${id}N = ck_lists(${src}, &${id});`], args: [id, `${id}N`] };
    default: return { decl: [`int ${id} = ck_int(${src});`], args: [id] };
  }
}
/** Statements that call `fn(args…)` and emit its result (no newline). */
function cCallEmit(ret: string, fn: string, args: string[], quoteStrings: boolean): string[] {
  const call = (extra: string[]) => `${fn}(${[...args, ...extra].join(", ")})`;
  switch (ret) {
    case "int[][]": return ["{ int __rs = 0; int* __rc = NULL; int** __r = " + call(["&__rs", "&__rc"]) + "; ck_emit_int_mat(__r, __rs, __rc); }"];
    case "int[]": return ["{ int __rs = 0; int* __r = " + call(["&__rs"]) + "; ck_emit_int_arr(__r, __rs); }"];
    case "string[]": return ["{ int __rs = 0; char** __r = " + call(["&__rs"]) + "; ck_emit_str_arr(__r, __rs); }"];
    case "string": return [`{ char* __r = ${call([])}; __emit(${quoteStrings ? '"\\"%s\\""' : '"%s"'}, __r ? __r : ""); }`];
    case "bool": return [`__emit(${call([])} ? "true" : "false");`];
    case "TreeNode": return [`ck_emit_tree(${call([])});`];
    case "ListNode": return [`ck_emit_list(${call([])});`];
    case "void": return [`${call([])};`, '__emit("null");'];
    default: return [`__emit("%d", ${call([])});`];
  }
}

function cFile(sig: StructSignature, fn: string): string {
  let body: string[];
  if (isClass(sig)) {
    const pre = cPrefix(sig.funcName);
    const ctor = sig.params.map((p, j) => cRead(p, `__a0[${j}]`, `__c${j}`));
    const branches = sig.methods!.flatMap((m, i) => {
      const reads = m.params.map((p, j) => cRead(p, `__a[${j}]`, `__p${j}`));
      return [
        `${i === 0 ? "if" : "else if"} (strcmp(__m, ${JSON.stringify(m.name)}) == 0) {`,
        ...reads.flatMap((r) => r.decl).map((l) => "    " + l),
        ...cCallEmit(m.returns, `${pre}${cap(m.name)}`, ["__obj", ...reads.flatMap((r) => r.args)], true).map((l) => "    " + l),
        "}",
      ];
    });
    body = [
      "char** __ops; int __opN = ck_str_arr(lines[0], &__ops);",
      "char** __all; int __allN = ck_split(lines[1], &__all);",
      "char** __a0; int __a0N = ck_split(__allN > 0 ? __all[0] : \"[]\", &__a0);",
      ...ctor.flatMap((r) => r.decl),
      `${sig.funcName}* __obj = ${pre}Create(${ctor.flatMap((r) => r.args).join(", ")});`,
      '__emit("[null");',
      "for (int __k = 1; __k < __opN && __k < __allN; __k++) {",
      "    char* __m = __ops[__k];",
      "    char** __a; int __aN = ck_split(__all[__k], &__a);",
      '    __emit(",");',
      ...branches.map((b) => "    " + b),
      "    ck_free_parts(__a, __aN);",
      "}",
      '__emit("]\\n");',
      `${pre}Free(__obj);`,
      "ck_free_parts(__a0, __a0N);",
    ];
  } else {
    const reads = sig.params.map((p, i) => cRead(p, `lines[${i}]`, p.name));
    // The function's own parameter names are reused for the locals so a
    // compile error points at a name the solver recognises (an array's size
    // local is `<name>N`; it is passed positionally as `<name>Size`).
    body = [
      ...reads.flatMap((r) => r.decl),
      ...cCallEmit(sig.returns, sig.funcName, reads.flatMap((r) => r.args), false),
      '__emit("\\n");',
    ];
  }
  const nodes = uses(sig, "tree") || uses(sig, "list") ? C_NODES : "";
  return [
    "#include <stdio.h>",
    "#include <stdlib.h>",
    "#include <string.h>",
    "#include <stdbool.h>",
    "#include <stdarg.h>",
    "#include <sys/resource.h>",
    "",
    nodes,
    "",
    fn,
    "",
    C_HELPERS,
    uses(sig, "tree") ? C_TREE_HELPERS : "",
    uses(sig, "list") ? C_LIST_HELPERS : "",
    "",
    "int main(void) {",
    "    size_t cap = 1 << 20, len = 0;",
    "    char* buf = (char*)malloc(cap);",
    "    size_t got;",
    "    while ((got = fread(buf + len, 1, cap - len - 1, stdin)) > 0) {",
    "        len += got;",
    "        if (len + 1 >= cap) { cap *= 2; buf = (char*)realloc(buf, cap); }",
    "    }",
    "    buf[len] = '\\0';",
    "    int lineCap = 1024, lineCount = 0;",
    "    char** allLines = (char**)malloc((size_t)lineCap * sizeof(char*));",
    "    char* cur = buf;",
    "    while (cur != NULL && *cur != '\\0') {",
    "        char* nl = strchr(cur, '\\n');",
    "        if (nl != NULL) *nl = '\\0';",
    "        char* tok = cur;",
    "        size_t tl = strlen(tok);",
    "        while (tl > 0 && (tok[tl - 1] == '\\r' || tok[tl - 1] == ' ')) tok[--tl] = '\\0';",
    "        while (*tok == ' ') tok++;",
    "        if (*tok != '\\0') {",
    "            if (lineCount == lineCap) { lineCap *= 2; allLines = (char**)realloc(allLines, (size_t)lineCap * sizeof(char*)); }",
    "            allLines[lineCount++] = tok;",
    "        }",
    "        cur = (nl != NULL) ? nl + 1 : NULL;",
    "    }",
    "    int start = 0;",
    "    for (int idx = 0; idx <= lineCount; idx++) {",
    `        if (idx == lineCount || strcmp(allLines[idx], "${SENTINEL}") == 0) {`,
    "            if (idx > start) {",
    "                char** lines = &allLines[start];",
    ...indent(body, "                "),
    `                __emit("${SENTINEL}\\n");`,
    "            }",
    "            start = idx + 1;",
    "        }",
    "    }",
    "    struct rusage __ru;",
    "    getrusage(RUSAGE_SELF, &__ru);",
    "    long __cpu_ms = (__ru.ru_utime.tv_sec + __ru.ru_stime.tv_sec) * 1000 + (__ru.ru_utime.tv_usec + __ru.ru_stime.tv_usec) / 1000;",
    '    __emit("__CODEKAIRO_STATS__ %ld %ld\\n", __cpu_ms, __ru.ru_maxrss);',
    "    fflush(stdout);",
    `    fputs("${BEGIN}\\n", stdout);`,
    "    if (__obuf != NULL) fwrite(__obuf, 1, __olen, stdout);",
    "    fflush(stdout);",
    "    return 0;",
    "}",
  ].join("\n");
}

// ═══════════════════════════════════════════════════════════════════
// C# (Mono 6.6) — LeetCode's C#: PascalCase methods.
// ═══════════════════════════════════════════════════════════════════
const CS_T: Record<string, string> = {
  int: "int", bool: "bool", string: "string", "int[]": "int[]", "int[][]": "int[][]", "string[]": "string[]",
  TreeNode: "TreeNode", ListNode: "ListNode", "ListNode[]": "ListNode[]", void: "void",
};
const CS_DEFAULT: Record<string, string> = {
  int: "return 0;", bool: "return false;", string: 'return "";', "int[]": "return new int[0];", "int[][]": "return new int[0][];", "string[]": "return new string[0];",
  TreeNode: "return null;", ListNode: "return null;", void: "",
};

function csStub(sig: StructSignature): string {
  if (isClass(sig)) {
    const out = [`public class ${sig.funcName} {`, "", `    public ${sig.funcName}(${sig.params.map((p) => `${CS_T[p.type]} ${p.name}`).join(", ")}) {`, "", "    }"];
    for (const m of sig.methods!) out.push("", `    public ${CS_T[m.returns]} ${cap(m.name)}(${m.params.map((p) => `${CS_T[p.type]} ${p.name}`).join(", ")}) {`, m.returns === "void" ? "" : `        ${CS_DEFAULT[m.returns]}`, "    }");
    out.push("}");
    return out.join("\n");
  }
  const out: string[] = [];
  if (uses(sig, "tree")) out.push("    /**", "     * TreeNode is provided by the judge (do not redefine it):", "     * public class TreeNode {", "     *     public int val; public TreeNode left; public TreeNode right;", "     *     public TreeNode(int val=0, TreeNode left=null, TreeNode right=null) {...}", "     * }", "     */");
  if (uses(sig, "list")) out.push("    /**", "     * ListNode is provided by the judge (do not redefine it):", "     * public class ListNode {", "     *     public int val; public ListNode next;", "     *     public ListNode(int val=0, ListNode next=null) {...}", "     * }", "     */");
  out.push(`    public static ${CS_T[sig.returns]} ${cap(sig.funcName)}(${sig.params.map((p) => `${CS_T[p.type]} ${p.name}`).join(", ")})`, "    {", "        // Write your code here", `        ${CS_DEFAULT[sig.returns]}`, "    }");
  return out.join("\n");
}

const CS_NODES = `public class TreeNode {
    public int val;
    public TreeNode left;
    public TreeNode right;
    public TreeNode(int val = 0, TreeNode left = null, TreeNode right = null) { this.val = val; this.left = left; this.right = right; }
}
public class ListNode {
    public int val;
    public ListNode next;
    public ListNode(int val = 0, ListNode next = null) { this.val = val; this.next = next; }
}`;

const CS_HELPERS = `    // ---- driver (do not edit below) ----
    static List<string> CkSplit(string s)
    {
        var outp = new List<string>();
        s = s.Trim();
        if (s.Length < 2) return outp;
        int depth = 0, start = 1;
        bool q = false;
        for (int i = 1; i < s.Length - 1; i++)
        {
            char c = s[i];
            if (q) { if (c == '"') q = false; continue; }
            if (c == '"') q = true;
            else if (c == '[') depth++;
            else if (c == ']') depth--;
            else if (c == ',' && depth == 0) { outp.Add(s.Substring(start, i - start).Trim()); start = i + 1; }
        }
        string last = s.Substring(start, s.Length - 1 - start).Trim();
        if (last.Length > 0 || outp.Count > 0) outp.Add(last);
        return outp;
    }
    static int CkInt(string t) { return int.Parse(t.Trim()); }
    static string CkStr(string t)
    {
        t = t.Trim();
        if (t.Length >= 2 && t[0] == '"' && t[t.Length - 1] == '"') return t.Substring(1, t.Length - 2);
        return t;
    }
    static int[] CkIntArr(string t) { return CkSplit(t).Select(CkInt).ToArray(); }
    static int[][] CkIntMat(string t) { return CkSplit(t).Select(CkIntArr).ToArray(); }
    static string[] CkStrArr(string t) { return CkSplit(t).Select(CkStr).ToArray(); }
    static string CkQ(string s) { return "\\"" + s + "\\""; }
    static string CkB(bool b) { return b ? "true" : "false"; }
    static string CkFmtIntArr(int[] a) { return "[" + string.Join(",", a) + "]"; }
    static string CkFmtIntMat(int[][] m) { return "[" + string.Join(",", m.Select(CkFmtIntArr)) + "]"; }
    static string CkFmtStrArr(string[] a) { return "[" + string.Join(",", a.Select(CkQ)) + "]"; }`;

const CS_TREE_HELPERS = `    static TreeNode CkTree(string t)
    {
        var p = CkSplit(t);
        if (p.Count == 0 || p[0] == "null") return null;
        var root = new TreeNode(CkInt(p[0]));
        var q = new List<TreeNode> { root };
        int h = 0, i = 1;
        while (i < p.Count && h < q.Count)
        {
            var n = q[h++];
            if (i < p.Count && p[i] != "null") { n.left = new TreeNode(CkInt(p[i])); q.Add(n.left); }
            i++;
            if (i < p.Count && p[i] != "null") { n.right = new TreeNode(CkInt(p[i])); q.Add(n.right); }
            i++;
        }
        return root;
    }
    static string CkFmtTree(TreeNode root)
    {
        var q = new List<TreeNode> { root };
        var outp = new List<string>();
        int h = 0;
        while (h < q.Count)
        {
            var n = q[h++];
            if (n == null) { outp.Add("null"); continue; }
            outp.Add(n.val.ToString());
            q.Add(n.left);
            q.Add(n.right);
            if (outp.Count > ${NODE_CAP}) throw new Exception("the returned tree is too large (or has a cycle)");
        }
        int end = outp.Count;
        while (end > 0 && outp[end - 1] == "null") end--;
        return "[" + string.Join(",", outp.Take(end)) + "]";
    }`;

const CS_LIST_HELPERS = `    static ListNode CkList(string t)
    {
        var d = new ListNode(0);
        var tail = d;
        foreach (var x in CkSplit(t)) { tail.next = new ListNode(CkInt(x)); tail = tail.next; }
        return d.next;
    }
    static ListNode[] CkLists(string t) { return CkSplit(t).Select(CkList).ToArray(); }
    static string CkFmtList(ListNode h)
    {
        var outp = new List<string>();
        while (h != null)
        {
            outp.Add(h.val.ToString());
            h = h.next;
            if (outp.Count > ${NODE_CAP}) throw new Exception("the returned list is too long (or has a cycle)");
        }
        return "[" + string.Join(",", outp) + "]";
    }`;

const csParse = (t: string, v: string) =>
  ({ int: `CkInt(${v})`, string: `CkStr(${v})`, "int[]": `CkIntArr(${v})`, "int[][]": `CkIntMat(${v})`, "string[]": `CkStrArr(${v})`, TreeNode: `CkTree(${v})`, ListNode: `CkList(${v})`, "ListNode[]": `CkLists(${v})` } as Record<string, string>)[t];
const csFmt = (t: string, v: string, inArray: boolean) =>
  ({ int: `(${v}).ToString()`, bool: `CkB(${v})`, string: inArray ? `CkQ(${v})` : `(${v})`, "int[]": `CkFmtIntArr(${v})`, "int[][]": `CkFmtIntMat(${v})`, "string[]": `CkFmtStrArr(${v})`, TreeNode: `CkFmtTree(${v})`, ListNode: `CkFmtList(${v})` } as Record<string, string>)[t];

function csFile(sig: StructSignature, fn: string): string {
  const helpers = [CS_HELPERS, uses(sig, "tree") ? CS_TREE_HELPERS : "", uses(sig, "list") ? CS_LIST_HELPERS : ""].filter(Boolean).join("\n");
  let body: string[];
  if (isClass(sig)) {
    const branches = sig.methods!.map((m, i) => {
      const call = `__obj.${cap(m.name)}(${m.params.map((p, j) => csParse(p.type, `__a[${j}]`)).join(", ")})`;
      return `${i === 0 ? "if" : "else if"} (__m == ${JSON.stringify(m.name)}) ${m.returns === "void" ? `{ ${call}; __res.Add("null"); }` : `{ __res.Add(${csFmt(m.returns, call, true)}); }`}`;
    });
    body = [
      "var __ops = CkStrArr(lines[0]);",
      "var __all = CkSplit(lines[1]);",
      "var __a0 = CkSplit(__all[0]);",
      `var __obj = new ${sig.funcName}(${sig.params.map((p, j) => csParse(p.type, `__a0[${j}]`)).join(", ")});`,
      'var __res = new List<string> { "null" };',
      "for (int __k = 1; __k < __ops.Length; __k++)",
      "{",
      "    var __m = __ops[__k];",
      "    var __a = CkSplit(__all[__k]);",
      ...branches.map((b) => "    " + b),
      '    else throw new Exception("unknown operation " + __m);',
      "}",
      'OUT.Append("[" + string.Join(",", __res) + "]").Append(\'\\n\');',
    ];
  } else {
    body = [
      ...sig.params.map((p, i) => `${CS_T[p.type]} ${p.name} = ${csParse(p.type, `lines[${i}]`)};`),
      `OUT.Append(${csFmt(sig.returns, `${cap(sig.funcName)}(${sig.params.map((p) => p.name).join(", ")})`, false)}).Append('\\n');`,
    ];
  }
  const main = [
    "    public static void Main()",
    "    {",
    "        string raw = Console.In.ReadToEnd();",
    `        if (raw.StartsWith("${GZIN}"))`,
    "        {",
    `            var b64 = raw.Substring(${GZIN.length});`,
    "            using (var msIn = new System.IO.MemoryStream(Convert.FromBase64String(b64)))",
    "            using (var gzIn = new System.IO.Compression.GZipStream(msIn, System.IO.Compression.CompressionMode.Decompress))",
    "            using (var reader = new System.IO.StreamReader(gzIn))",
    "            {",
    "                raw = reader.ReadToEnd();",
    "            }",
    "        }",
    "        var cases = new List<List<string>>();",
    "        var cur = new List<string>();",
    "        foreach (var line0 in raw.Split('\\n'))",
    "        {",
    "            var line = line0.Trim();",
    `            if (line == "${SENTINEL}")`,
    "            {",
    "                if (cur.Count > 0) { cases.Add(cur); cur = new List<string>(); }",
    "            }",
    "            else if (line.Length > 0)",
    "            {",
    "                cur.Add(line);",
    "            }",
    "        }",
    "        if (cur.Count > 0) cases.Add(cur);",
    "        int __t0 = Environment.TickCount;",
    "        var OUT = new System.Text.StringBuilder();",
    "        foreach (var lines in cases)",
    "        {",
    "            try",
    "            {",
    ...indent(body, "                "),
    "            }",
    "            catch (Exception e)",
    "            {",
    `                OUT.Append("${ERR} " + e.Message).Append('\\n');`,
    "            }",
    `            OUT.Append("${SENTINEL}\\n");`,
    "        }",
    '        OUT.Append("__CODEKAIRO_STATS__ " + (Environment.TickCount - __t0) + " " + (GC.GetTotalMemory(false) / 1024) + "\\n");',
    "        string joined = OUT.ToString();",
    `        Console.WriteLine("${BEGIN}");`,
    `        if (joined.Length > ${GZ_THRESHOLD})`,
    "        {",
    "            using (var ms = new System.IO.MemoryStream())",
    "            {",
    "                using (var gz = new System.IO.Compression.GZipStream(ms, System.IO.Compression.CompressionMode.Compress))",
    "                {",
    "                    var bytes = System.Text.Encoding.UTF8.GetBytes(joined);",
    "                    gz.Write(bytes, 0, bytes.Length);",
    "                }",
    `                Console.WriteLine("${GZ}");`,
    "                Console.WriteLine(Convert.ToBase64String(ms.ToArray()));",
    "            }",
    "        }",
    "        else",
    "        {",
    "            Console.Write(joined);",
    "        }",
    "    }",
  ];
  const head = ["using System;", "using System.Collections.Generic;", "using System.Linq;", ""];
  const nodes = uses(sig, "tree") || uses(sig, "list") ? CS_NODES : "";
  if (isClass(sig)) return [...head, fn, "", "public class Program", "{", helpers, "", ...main, "}"].join("\n");
  return [...head, nodes, "", "public class Program", "{", fn, "", helpers, "", ...main, "}"].join("\n");
}

// ═══════════════════════════════════════════════════════════════════
// Go 1.13 — LeetCode's Go: `Constructor`, PascalCase methods on a pointer.
// ═══════════════════════════════════════════════════════════════════
const GO_T: Record<string, string> = {
  int: "int", bool: "bool", string: "string", "int[]": "[]int", "int[][]": "[][]int", "string[]": "[]string",
  TreeNode: "*TreeNode", ListNode: "*ListNode", "ListNode[]": "[]*ListNode", void: "",
};
const GO_DEFAULT: Record<string, string> = {
  int: "return 0", bool: "return false", string: 'return ""', "int[]": "return []int{}", "int[][]": "return [][]int{}", "string[]": "return []string{}",
  TreeNode: "return nil", ListNode: "return nil", void: "",
};
const goRet = (t: string) => (t === "void" ? "" : ` ${GO_T[t]}`);

function goStub(sig: StructSignature): string {
  if (isClass(sig)) {
    const out = [`type ${sig.funcName} struct {`, "", "}", "", "", `func Constructor(${sig.params.map((p) => `${p.name} ${GO_T[p.type]}`).join(", ")}) ${sig.funcName} {`, `\treturn ${sig.funcName}{}`, "}"];
    for (const m of sig.methods!) out.push("", "", `func (this *${sig.funcName}) ${cap(m.name)}(${m.params.map((p) => `${p.name} ${GO_T[p.type]}`).join(", ")})${goRet(m.returns)} {`, m.returns === "void" ? "\t" : `\t${GO_DEFAULT[m.returns]}`, "}");
    return out.join("\n");
  }
  const out: string[] = [];
  if (uses(sig, "tree")) out.push("/**", " * Definition for a binary tree node (provided by the judge — do not redefine it):", " * type TreeNode struct {", " *     Val int", " *     Left *TreeNode", " *     Right *TreeNode", " * }", " */");
  if (uses(sig, "list")) out.push("/**", " * Definition for singly-linked list (provided by the judge — do not redefine it):", " * type ListNode struct {", " *     Val int", " *     Next *ListNode", " * }", " */");
  out.push(`func ${sig.funcName}(${sig.params.map((p) => `${p.name} ${GO_T[p.type]}`).join(", ")})${goRet(sig.returns)} {`, "\t// Write your code here", `\t${GO_DEFAULT[sig.returns]}`, "}");
  return out.join("\n");
}

const GO_NODES = `type TreeNode struct {
	Val   int
	Left  *TreeNode
	Right *TreeNode
}

type ListNode struct {
	Val  int
	Next *ListNode
}`;

const GO_HELPERS = `// ---- driver (do not edit below) ----
func ckJSON(v interface{}) string {
	buf := new(bytes.Buffer)
	enc := json.NewEncoder(buf)
	enc.SetEscapeHTML(false)
	enc.Encode(v)
	return strings.TrimRight(buf.String(), "\\n")
}

func ckTree(a []*int) *TreeNode {
	if len(a) == 0 || a[0] == nil {
		return nil
	}
	root := &TreeNode{Val: *a[0]}
	q := []*TreeNode{root}
	h, i := 0, 1
	for i < len(a) && h < len(q) {
		n := q[h]
		h++
		if i < len(a) && a[i] != nil {
			n.Left = &TreeNode{Val: *a[i]}
			q = append(q, n.Left)
		}
		i++
		if i < len(a) && a[i] != nil {
			n.Right = &TreeNode{Val: *a[i]}
			q = append(q, n.Right)
		}
		i++
	}
	return root
}

func ckTreeOut(root *TreeNode) string {
	q := []*TreeNode{root}
	out := []string{}
	for h := 0; h < len(q); h++ {
		n := q[h]
		if n == nil {
			out = append(out, "null")
			continue
		}
		out = append(out, fmt.Sprint(n.Val))
		q = append(q, n.Left, n.Right)
		if len(out) > ${NODE_CAP} {
			panic("the returned tree is too large (or has a cycle)")
		}
	}
	for len(out) > 0 && out[len(out)-1] == "null" {
		out = out[:len(out)-1]
	}
	return "[" + strings.Join(out, ",") + "]"
}

func ckList(a []int) *ListNode {
	d := &ListNode{}
	t := d
	for _, v := range a {
		t.Next = &ListNode{Val: v}
		t = t.Next
	}
	return d.Next
}

func ckListOut(h *ListNode) string {
	out := []string{}
	for h != nil {
		out = append(out, fmt.Sprint(h.Val))
		h = h.Next
		if len(out) > ${NODE_CAP} {
			panic("the returned list is too long (or has a cycle)")
		}
	}
	return "[" + strings.Join(out, ",") + "]"
}`;

/** Go statements that read `src` (a []byte expression) into a new variable `id`. */
function goRead(t: string, src: string, id: string): string[] {
  if (t === "TreeNode") return [`var ${id}Raw []*int`, `json.Unmarshal(${src}, &${id}Raw)`, `${id} := ckTree(${id}Raw)`];
  if (t === "ListNode") return [`var ${id}Raw []int`, `json.Unmarshal(${src}, &${id}Raw)`, `${id} := ckList(${id}Raw)`];
  if (t === "ListNode[]") return [`var ${id}Raw [][]int`, `json.Unmarshal(${src}, &${id}Raw)`, `${id} := make([]*ListNode, len(${id}Raw))`, `for __i := range ${id}Raw {`, `\t${id}[__i] = ckList(${id}Raw[__i])`, "}"];
  return [`var ${id} ${GO_T[t]}`, `json.Unmarshal(${src}, &${id})`];
}
/** Go expression formatting a value; arrays never print `null`. */
function goFmt(t: string, v: string, inArray: boolean): string {
  if (t === "int" || t === "bool") return `fmt.Sprint(${v})`;
  if (t === "string") return inArray ? `ckJSON(${v})` : v;
  if (t === "TreeNode") return `ckTreeOut(${v})`;
  if (t === "ListNode") return `ckListOut(${v})`;
  return `func() string { __x := ${v}; if __x == nil { __x = ${GO_T[t]}{} }; return ckJSON(__x) }()`;
}

const GO_OPTIONAL = ["sort", "math", "math/bits", "container/heap", "container/list", "unicode", "strconv"];

function goFile(sig: StructSignature, fn: string): string {
  const imports = ["bytes", "compress/gzip", "encoding/base64", "encoding/json", "fmt", "io/ioutil", "os", "runtime", "strings", "time"];
  for (const pkg of GO_OPTIONAL) {
    const leaf = pkg.slice(pkg.lastIndexOf("/") + 1);
    if (!imports.includes(pkg) && new RegExp(`\\b${leaf}\\.[A-Z]`).test(fn)) imports.push(pkg);
  }
  imports.sort();
  let body: string[];
  if (isClass(sig)) {
    const branches = sig.methods!.flatMap((m, i) => {
      const reads = m.params.flatMap((p, j) => goRead(p.type, `__a[${j}]`, `__p${j}`));
      const call = `__obj.${cap(m.name)}(${m.params.map((_, j) => `__p${j}`).join(", ")})`;
      return [
        `${i === 0 ? "if" : "} else if"} __m == ${JSON.stringify(m.name)} {`,
        ...reads.map((l) => "\t" + l),
        ...(m.returns === "void" ? [`\t${call}`, '\t__res = append(__res, "null")'] : [`\t__res = append(__res, ${goFmt(m.returns, call, true)})`]),
      ];
    });
    body = [
      "var __ops []string",
      "json.Unmarshal([]byte(lines[0]), &__ops)",
      "var __all [][]json.RawMessage",
      "json.Unmarshal([]byte(lines[1]), &__all)",
      "__a0 := __all[0]",
      "_ = __a0",
      ...sig.params.flatMap((p, j) => goRead(p.type, `__a0[${j}]`, `__c${j}`)),
      `__obj := Constructor(${sig.params.map((_, j) => `__c${j}`).join(", ")})`,
      '__res := []string{"null"}',
      "for __k := 1; __k < len(__ops); __k++ {",
      "\t__m := __ops[__k]",
      "\t__a := __all[__k]",
      "\t_ = __a",
      ...branches.map((l) => "\t" + l),
      "\t} else {",
      '\t\tpanic("unknown operation " + __m)',
      "\t}",
      "}",
      'out = append(out, "["+strings.Join(__res, ",")+"]")',
    ];
  } else {
    body = [
      ...sig.params.flatMap((p, i) => goRead(p.type, `[]byte(lines[${i}])`, p.name)),
      `out = append(out, ${goFmt(sig.returns, `${sig.funcName}(${sig.params.map((p) => p.name).join(", ")})`, false)})`,
    ];
  }
  const nodes = uses(sig, "tree") || uses(sig, "list");
  // ckTree/ckList reference the node types, so they ship only with them.
  const helpers = nodes ? GO_HELPERS : GO_HELPERS.slice(0, GO_HELPERS.indexOf("func ckTree"));
  return [
    "package main",
    "",
    "import (",
    ...imports.map((p) => `\t"${p}"`),
    ")",
    "",
    nodes ? GO_NODES : "",
    "",
    fn,
    "",
    helpers,
    "",
    "func main() {",
    "\t__t0 := time.Now()",
    "\trawBytes, _ := ioutil.ReadAll(os.Stdin)",
    "\traw := string(rawBytes)",
    `\tif strings.HasPrefix(raw, "${GZIN}") {`,
    `\t\tb64 := strings.Join(strings.Fields(raw[${GZIN.length}:]), "")`,
    "\t\tdecoded, _ := base64.StdEncoding.DecodeString(b64)",
    "\t\tzr, _ := gzip.NewReader(bytes.NewReader(decoded))",
    "\t\tunzipped, _ := ioutil.ReadAll(zr)",
    "\t\traw = string(unzipped)",
    "\t}",
    "\tvar cases [][]string",
    "\tvar cur []string",
    '\tfor _, l := range strings.Split(raw, "\\n") {',
    "\t\tt := strings.TrimSpace(l)",
    `\t\tif t == "${SENTINEL}" {`,
    "\t\t\tif len(cur) > 0 {",
    "\t\t\t\tcases = append(cases, cur)",
    "\t\t\t\tcur = nil",
    "\t\t\t}",
    '\t\t} else if t != "" {',
    "\t\t\tcur = append(cur, t)",
    "\t\t}",
    "\t}",
    "\tif len(cur) > 0 {",
    "\t\tcases = append(cases, cur)",
    "\t}",
    "\tvar out []string",
    "\tfor _, lines := range cases {",
    "\t\tfunc() {",
    "\t\t\tdefer func() {",
    "\t\t\t\tif e := recover(); e != nil {",
    `\t\t\t\t\tout = append(out, fmt.Sprint("${ERR} ", e))`,
    "\t\t\t\t}",
    "\t\t\t}()",
    ...indent(body, "\t\t\t"),
    "\t\t}()",
    `\t\tout = append(out, "${SENTINEL}")`,
    "\t}",
    "\tvar __ms runtime.MemStats",
    "\truntime.ReadMemStats(&__ms)",
    '\tout = append(out, fmt.Sprintf("__CODEKAIRO_STATS__ %d %d", time.Since(__t0).Milliseconds(), __ms.Sys/1024))',
    '\tjoined := strings.Join(out, "\\n") + "\\n"',
    `\tfmt.Println("${BEGIN}")`,
    `\tif len(joined) > ${GZ_THRESHOLD} {`,
    "\t\tvar buf bytes.Buffer",
    "\t\tzw := gzip.NewWriter(&buf)",
    "\t\tzw.Write([]byte(joined))",
    "\t\tzw.Close()",
    `\t\tfmt.Println("${GZ}")`,
    "\t\tfmt.Println(base64.StdEncoding.EncodeToString(buf.Bytes()))",
    "\t} else {",
    "\t\tfmt.Print(joined)",
    "\t}",
    "}",
  ].join("\n");
}

// ═══════════════════════════════════════════════════════════════════
// Kotlin 1.3
// ═══════════════════════════════════════════════════════════════════
const KT_T: Record<string, string> = {
  int: "Int", bool: "Boolean", string: "String", "int[]": "IntArray", "int[][]": "Array<IntArray>", "string[]": "Array<String>",
  TreeNode: "TreeNode?", ListNode: "ListNode?", "ListNode[]": "Array<ListNode?>", void: "Unit",
};
const KT_DEFAULT: Record<string, string> = {
  int: "return 0", bool: "return false", string: 'return ""', "int[]": "return intArrayOf()", "int[][]": "return arrayOf<IntArray>()", "string[]": "return arrayOf<String>()",
  TreeNode: "return null", ListNode: "return null", void: "",
};
const BT = "`";

function ktStub(sig: StructSignature): string {
  if (isClass(sig)) {
    const out = [`class ${sig.funcName}(${sig.params.map((p) => `${p.name}: ${KT_T[p.type]}`).join(", ")}) {`];
    for (const m of sig.methods!) out.push("", `    fun ${m.name}(${m.params.map((p) => `${p.name}: ${KT_T[p.type]}`).join(", ")})${m.returns === "void" ? "" : `: ${KT_T[m.returns]}`} {`, m.returns === "void" ? "" : `        ${KT_DEFAULT[m.returns]}`, "    }");
    out.push("", "}");
    return out.join("\n");
  }
  const out: string[] = [];
  if (uses(sig, "tree")) out.push("/**", " * TreeNode is provided by the judge (do not redefine it):", ` * class TreeNode(var ${BT}val${BT}: Int) {`, " *     var left: TreeNode? = null", " *     var right: TreeNode? = null", " * }", " */");
  if (uses(sig, "list")) out.push("/**", " * ListNode is provided by the judge (do not redefine it):", ` * class ListNode(var ${BT}val${BT}: Int) {`, " *     var next: ListNode? = null", " * }", " */");
  out.push(`fun ${sig.funcName}(${sig.params.map((p) => `${p.name}: ${KT_T[p.type]}`).join(", ")}): ${KT_T[sig.returns]} {`, "    // Write your code here", `    ${KT_DEFAULT[sig.returns]}`, "}");
  return out.join("\n");
}

const KT_NODES = `class TreeNode(var ${BT}val${BT}: Int) {
    var left: TreeNode? = null
    var right: TreeNode? = null
}
class ListNode(var ${BT}val${BT}: Int) {
    var next: ListNode? = null
}`;

const KT_HELPERS = `// ---- driver (do not edit below) ----
fun ckSplit(s0: String): List<String> {
    val out = ArrayList<String>()
    val s = s0.trim()
    if (s.length < 2) return out
    var depth = 0
    var q = false
    var start = 1
    for (i in 1 until s.length - 1) {
        val c = s[i]
        if (q) { if (c == '"') q = false; continue }
        if (c == '"') q = true
        else if (c == '[') depth++
        else if (c == ']') depth--
        else if (c == ',' && depth == 0) { out.add(s.substring(start, i).trim()); start = i + 1 }
    }
    val last = s.substring(start, s.length - 1).trim()
    if (last.isNotEmpty() || out.isNotEmpty()) out.add(last)
    return out
}
fun ckInt(t: String): Int = t.trim().toInt()
fun ckStr(t0: String): String {
    val t = t0.trim()
    return if (t.length >= 2 && t[0] == '"' && t[t.length - 1] == '"') t.substring(1, t.length - 1) else t
}
fun ckIntArr(t: String): IntArray = ckSplit(t).map { ckInt(it) }.toIntArray()
fun ckIntMat(t: String): Array<IntArray> = ckSplit(t).map { ckIntArr(it) }.toTypedArray()
fun ckStrArr(t: String): Array<String> = ckSplit(t).map { ckStr(it) }.toTypedArray()
fun ckQ(s: String): String = "\\"" + s + "\\""
fun ckFmtIntArr(a: IntArray): String = a.joinToString(",", "[", "]")
fun ckFmtIntMat(m: Array<IntArray>): String = m.joinToString(",", "[", "]") { ckFmtIntArr(it) }
fun ckFmtStrArr(a: Array<String>): String = a.joinToString(",", "[", "]") { ckQ(it) }`;

const KT_TREE_HELPERS = `fun ckTree(t: String): TreeNode? {
    val p = ckSplit(t)
    if (p.isEmpty() || p[0] == "null") return null
    val root = TreeNode(ckInt(p[0]))
    val q = ArrayList<TreeNode>()
    q.add(root)
    var h = 0
    var i = 1
    while (i < p.size && h < q.size) {
        val n = q[h++]
        if (i < p.size && p[i] != "null") { val c = TreeNode(ckInt(p[i])); n.left = c; q.add(c) }
        i++
        if (i < p.size && p[i] != "null") { val c = TreeNode(ckInt(p[i])); n.right = c; q.add(c) }
        i++
    }
    return root
}
fun ckFmtTree(root: TreeNode?): String {
    val q = ArrayList<TreeNode?>()
    val out = ArrayList<String>()
    q.add(root)
    var h = 0
    while (h < q.size) {
        val n = q[h++]
        if (n == null) { out.add("null"); continue }
        out.add(n.${BT}val${BT}.toString())
        q.add(n.left)
        q.add(n.right)
        if (out.size > ${NODE_CAP}) throw RuntimeException("the returned tree is too large (or has a cycle)")
    }
    var end = out.size
    while (end > 0 && out[end - 1] == "null") end--
    return out.subList(0, end).joinToString(",", "[", "]")
}`;

const KT_LIST_HELPERS = `fun ckList(t: String): ListNode? {
    val d = ListNode(0)
    var tail = d
    for (x in ckSplit(t)) { val c = ListNode(ckInt(x)); tail.next = c; tail = c }
    return d.next
}
fun ckLists(t: String): Array<ListNode?> = ckSplit(t).map { ckList(it) }.toTypedArray()
fun ckFmtList(h0: ListNode?): String {
    val out = ArrayList<String>()
    var h = h0
    while (h != null) {
        out.add(h.${BT}val${BT}.toString())
        h = h.next
        if (out.size > ${NODE_CAP}) throw RuntimeException("the returned list is too long (or has a cycle)")
    }
    return out.joinToString(",", "[", "]")
}`;

const ktParse = (t: string, v: string) =>
  ({ int: `ckInt(${v})`, string: `ckStr(${v})`, "int[]": `ckIntArr(${v})`, "int[][]": `ckIntMat(${v})`, "string[]": `ckStrArr(${v})`, TreeNode: `ckTree(${v})`, ListNode: `ckList(${v})`, "ListNode[]": `ckLists(${v})` } as Record<string, string>)[t];
const ktFmt = (t: string, v: string, inArray: boolean) =>
  ({ int: `(${v}).toString()`, bool: `(${v}).toString()`, string: inArray ? `ckQ(${v})` : `(${v})`, "int[]": `ckFmtIntArr(${v})`, "int[][]": `ckFmtIntMat(${v})`, "string[]": `ckFmtStrArr(${v})`, TreeNode: `ckFmtTree(${v})`, ListNode: `ckFmtList(${v})` } as Record<string, string>)[t];

function ktFile(sig: StructSignature, fn: string): string {
  let body: string[];
  if (isClass(sig)) {
    const branches = sig.methods!.map((m) => {
      const call = `__obj.${m.name}(${m.params.map((p, j) => ktParse(p.type, `__a[${j}]`)).join(", ")})`;
      return `${JSON.stringify(m.name)} -> ${m.returns === "void" ? `{ ${call}; __res.add("null") }` : `__res.add(${ktFmt(m.returns, call, true)})`}`;
    });
    body = [
      "val __ops = ckStrArr(lines[0])",
      "val __all = ckSplit(lines[1])",
      "val __a0 = ckSplit(__all[0])",
      `val __obj = ${sig.funcName}(${sig.params.map((p, j) => ktParse(p.type, `__a0[${j}]`)).join(", ")})`,
      'val __res = ArrayList<String>()',
      '__res.add("null")',
      "for (__k in 1 until __ops.size) {",
      "    val __a = ckSplit(__all[__k])",
      "    when (__ops[__k]) {",
      ...branches.map((b) => "        " + b),
      '        else -> throw RuntimeException("unknown operation " + __ops[__k])',
      "    }",
      "}",
      'OUT.append(__res.joinToString(",", "[", "]")).append("\\n")',
    ];
  } else {
    body = [
      ...sig.params.map((p, i) => `val ${p.name} = ${ktParse(p.type, `lines[${i}]`)}`),
      `OUT.append(${ktFmt(sig.returns, `${sig.funcName}(${sig.params.map((p) => p.name).join(", ")})`, false)}).append("\\n")`,
    ];
  }
  const nodes = uses(sig, "tree") || uses(sig, "list") ? KT_NODES : "";
  return [
    nodes,
    "",
    fn,
    "",
    KT_HELPERS,
    uses(sig, "tree") ? KT_TREE_HELPERS : "",
    uses(sig, "list") ? KT_LIST_HELPERS : "",
    "",
    "fun main() {",
    '    var raw = generateSequence(::readLine).joinToString("\\n")',
    `    if (raw.startsWith("${GZIN}")) {`,
    `        val b64 = raw.substring(${GZIN.length}).replace(Regex("\\\\s"), "")`,
    "        val gzin = java.util.zip.GZIPInputStream(java.io.ByteArrayInputStream(java.util.Base64.getDecoder().decode(b64)))",
    "        raw = gzin.readBytes().toString(Charsets.UTF_8)",
    "    }",
    "    val cases = ArrayList<List<String>>()",
    "    var cur = ArrayList<String>()",
    '    for (l0 in raw.split("\\n")) {',
    "        val l = l0.trim()",
    `        if (l == "${SENTINEL}") {`,
    "            if (cur.isNotEmpty()) { cases.add(cur); cur = ArrayList() }",
    "        } else if (l.isNotEmpty()) {",
    "            cur.add(l)",
    "        }",
    "    }",
    "    if (cur.isNotEmpty()) cases.add(cur)",
    "    val __t0 = System.currentTimeMillis()",
    "    val OUT = StringBuilder()",
    "    for (lines in cases) {",
    "        try {",
    ...indent(body, "            "),
    "        } catch (e: Throwable) {",
    `            OUT.append("${ERR} " + e).append("\\n")`,
    "        }",
    `        OUT.append("${SENTINEL}\\n")`,
    "    }",
    "    val __mem = (Runtime.getRuntime().totalMemory() - Runtime.getRuntime().freeMemory()) / 1024",
    '    OUT.append("__CODEKAIRO_STATS__ " + (System.currentTimeMillis() - __t0) + " " + __mem + "\\n")',
    "    val joined = OUT.toString()",
    `    println("${BEGIN}")`,
    `    if (joined.length > ${GZ_THRESHOLD}) {`,
    "        val bos = java.io.ByteArrayOutputStream()",
    "        val gz = java.util.zip.GZIPOutputStream(bos)",
    "        gz.write(joined.toByteArray(Charsets.UTF_8))",
    "        gz.close()",
    `        println("${GZ}")`,
    "        println(java.util.Base64.getEncoder().encodeToString(bos.toByteArray()))",
    "    } else {",
    "        print(joined)",
    "    }",
    "}",
  ].join("\n");
}

// ═══════════════════════════════════════════════════════════════════
// Swift 5.2
// ═══════════════════════════════════════════════════════════════════
const SW_T: Record<string, string> = {
  int: "Int", bool: "Bool", string: "String", "int[]": "[Int]", "int[][]": "[[Int]]", "string[]": "[String]",
  TreeNode: "TreeNode?", ListNode: "ListNode?", "ListNode[]": "[ListNode?]", void: "",
};
const SW_DEFAULT: Record<string, string> = {
  int: "return 0", bool: "return false", string: 'return ""', "int[]": "return []", "int[][]": "return []", "string[]": "return []",
  TreeNode: "return nil", ListNode: "return nil", void: "",
};
const swRet = (t: string) => (t === "void" ? "" : ` -> ${SW_T[t]}`);

function swStub(sig: StructSignature): string {
  if (isClass(sig)) {
    const out = [`class ${sig.funcName} {`, "", `    init(${sig.params.map((p) => `_ ${p.name}: ${SW_T[p.type]}`).join(", ")}) {`, "", "    }"];
    for (const m of sig.methods!) out.push("", `    func ${m.name}(${m.params.map((p) => `_ ${p.name}: ${SW_T[p.type]}`).join(", ")})${swRet(m.returns)} {`, m.returns === "void" ? "" : `        ${SW_DEFAULT[m.returns]}`, "    }");
    out.push("}");
    return out.join("\n");
  }
  const out: string[] = [];
  if (uses(sig, "tree")) out.push("/**", " * Definition for a binary tree node (provided by the judge — do not redefine it):", " * public class TreeNode {", " *     public var val: Int", " *     public var left: TreeNode?", " *     public var right: TreeNode?", " *     public init(_ val: Int) / init(_ val: Int, _ left: TreeNode?, _ right: TreeNode?)", " * }", " */");
  if (uses(sig, "list")) out.push("/**", " * Definition for singly-linked list (provided by the judge — do not redefine it):", " * public class ListNode {", " *     public var val: Int", " *     public var next: ListNode?", " *     public init(_ val: Int) / init(_ val: Int, _ next: ListNode?)", " * }", " */");
  out.push(`func ${sig.funcName}(${sig.params.map((p) => `_ ${p.name}: ${SW_T[p.type]}`).join(", ")})${swRet(sig.returns)} {`, "    // Write your code here", `    ${SW_DEFAULT[sig.returns]}`, "}");
  return out.join("\n");
}

const SW_NODES = `public class TreeNode {
    public var val: Int
    public var left: TreeNode?
    public var right: TreeNode?
    public init() { self.val = 0; self.left = nil; self.right = nil }
    public init(_ val: Int) { self.val = val; self.left = nil; self.right = nil }
    public init(_ val: Int, _ left: TreeNode?, _ right: TreeNode?) { self.val = val; self.left = left; self.right = right }
}
public class ListNode {
    public var val: Int
    public var next: ListNode?
    public init() { self.val = 0; self.next = nil }
    public init(_ val: Int) { self.val = val; self.next = nil }
    public init(_ val: Int, _ next: ListNode?) { self.val = val; self.next = next }
}`;

const SW_HELPERS = `// ---- driver (do not edit below) ----
func ckSplit(_ s0: String) -> [String] {
    let s = Array(s0.trimmingCharacters(in: .whitespaces))
    var out: [String] = []
    if s.count < 2 { return out }
    var depth = 0
    var q = false
    var cur = ""
    for i in 1..<(s.count - 1) {
        let c = s[i]
        if q { if c == "\\"" { q = false }; cur.append(c); continue }
        if c == "\\"" { q = true; cur.append(c) }
        else if c == "[" { depth += 1; cur.append(c) }
        else if c == "]" { depth -= 1; cur.append(c) }
        else if c == "," && depth == 0 { out.append(cur.trimmingCharacters(in: .whitespaces)); cur = "" }
        else { cur.append(c) }
    }
    let last = cur.trimmingCharacters(in: .whitespaces)
    if !last.isEmpty || !out.isEmpty { out.append(last) }
    return out
}
func ckInt(_ t: String) -> Int { return Int(t.trimmingCharacters(in: .whitespaces)) ?? 0 }
func ckStr(_ t0: String) -> String {
    var t = t0.trimmingCharacters(in: .whitespaces)
    if t.count >= 2 && t.hasPrefix("\\"") && t.hasSuffix("\\"") { t.removeFirst(); t.removeLast() }
    return t
}
func ckIntArr(_ t: String) -> [Int] { return ckSplit(t).map { ckInt($0) } }
func ckIntMat(_ t: String) -> [[Int]] { return ckSplit(t).map { ckIntArr($0) } }
func ckStrArr(_ t: String) -> [String] { return ckSplit(t).map { ckStr($0) } }
func ckQ(_ s: String) -> String { return "\\"" + s + "\\"" }
func ckFmtIntArr(_ a: [Int]) -> String { return "[" + a.map { String($0) }.joined(separator: ",") + "]" }
func ckFmtIntMat(_ m: [[Int]]) -> String { return "[" + m.map { ckFmtIntArr($0) }.joined(separator: ",") + "]" }
func ckFmtStrArr(_ a: [String]) -> String { return "[" + a.map { ckQ($0) }.joined(separator: ",") + "]" }`;

const SW_TREE_HELPERS = `func ckTree(_ t: String) -> TreeNode? {
    let p = ckSplit(t)
    if p.isEmpty || p[0] == "null" { return nil }
    let root = TreeNode(ckInt(p[0]))
    var q: [TreeNode] = [root]
    var h = 0
    var i = 1
    while i < p.count && h < q.count {
        let n = q[h]
        h += 1
        if i < p.count && p[i] != "null" { let c = TreeNode(ckInt(p[i])); n.left = c; q.append(c) }
        i += 1
        if i < p.count && p[i] != "null" { let c = TreeNode(ckInt(p[i])); n.right = c; q.append(c) }
        i += 1
    }
    return root
}
func ckFmtTree(_ root: TreeNode?) -> String {
    var q: [TreeNode?] = [root]
    var out: [String] = []
    var h = 0
    while h < q.count {
        let item = q[h]
        h += 1
        guard let n = item else { out.append("null"); continue }
        out.append(String(n.val))
        q.append(n.left)
        q.append(n.right)
        if out.count > ${NODE_CAP} { break }
    }
    while let last = out.last, last == "null" { out.removeLast() }
    return "[" + out.joined(separator: ",") + "]"
}`;

const SW_LIST_HELPERS = `func ckList(_ t: String) -> ListNode? {
    let d = ListNode(0)
    var tail = d
    for x in ckSplit(t) { let c = ListNode(ckInt(x)); tail.next = c; tail = c }
    return d.next
}
func ckLists(_ t: String) -> [ListNode?] { return ckSplit(t).map { ckList($0) } }
func ckFmtList(_ h0: ListNode?) -> String {
    var out: [String] = []
    var h = h0
    while let n = h {
        out.append(String(n.val))
        h = n.next
        if out.count > ${NODE_CAP} { break }
    }
    return "[" + out.joined(separator: ",") + "]"
}`;

const swParse = (t: string, v: string) =>
  ({ int: `ckInt(${v})`, string: `ckStr(${v})`, "int[]": `ckIntArr(${v})`, "int[][]": `ckIntMat(${v})`, "string[]": `ckStrArr(${v})`, TreeNode: `ckTree(${v})`, ListNode: `ckList(${v})`, "ListNode[]": `ckLists(${v})` } as Record<string, string>)[t];
const swFmt = (t: string, v: string, inArray: boolean) =>
  ({ int: `String(${v})`, bool: `((${v}) ? "true" : "false")`, string: inArray ? `ckQ(${v})` : `(${v})`, "int[]": `ckFmtIntArr(${v})`, "int[][]": `ckFmtIntMat(${v})`, "string[]": `ckFmtStrArr(${v})`, TreeNode: `ckFmtTree(${v})`, ListNode: `ckFmtList(${v})` } as Record<string, string>)[t];

function swFile(sig: StructSignature, fn: string): string {
  let body: string[];
  if (isClass(sig)) {
    const branches = sig.methods!.map((m) => {
      const call = `__obj.${m.name}(${m.params.map((p, j) => swParse(p.type, `__a[${j}]`)).join(", ")})`;
      return `case ${JSON.stringify(m.name)}: ${m.returns === "void" ? `${call}; __res.append("null")` : `__res.append(${swFmt(m.returns, call, true)})`}`;
    });
    body = [
      "let __ops = ckStrArr(lines[0])",
      "let __all = ckSplit(lines[1])",
      "let __a0 = ckSplit(__all[0])",
      `let __obj = ${sig.funcName}(${sig.params.map((p, j) => swParse(p.type, `__a0[${j}]`)).join(", ")})`,
      'var __res: [String] = ["null"]',
      "for __k in 1..<max(__ops.count, 1) {",
      "    let __a = ckSplit(__all[__k])",
      "    switch __ops[__k] {",
      ...branches.map((b) => "    " + b),
      '    default: __res.append("null")',
      "    }",
      "}",
      '__out += "[" + __res.joined(separator: ",") + "]\\n"',
    ];
  } else {
    body = [
      ...sig.params.map((p, i) => `let ${p.name} = ${swParse(p.type, `lines[${i}]`)}`),
      `__out += ${swFmt(sig.returns, `${sig.funcName}(${sig.params.map((p) => p.name).join(", ")})`, false)} + "\\n"`,
    ];
  }
  const nodes = uses(sig, "tree") || uses(sig, "list") ? SW_NODES : "";
  return [
    "import Foundation",
    "",
    nodes,
    "",
    fn,
    "",
    SW_HELPERS,
    uses(sig, "tree") ? SW_TREE_HELPERS : "",
    uses(sig, "list") ? SW_LIST_HELPERS : "",
    "",
    "let __t0 = Date()",
    'var __out = ""',
    "var __cases: [[String]] = []",
    "var __cur: [String] = []",
    "while let __line = readLine() {",
    "    let l = __line.trimmingCharacters(in: .whitespaces)",
    `    if l == "${SENTINEL}" {`,
    "        if !__cur.isEmpty { __cases.append(__cur); __cur = [] }",
    "    } else if !l.isEmpty {",
    "        __cur.append(l)",
    "    }",
    "}",
    "if !__cur.isEmpty { __cases.append(__cur) }",
    "for lines in __cases {",
    ...indent(body, "    "),
    `    __out += "${SENTINEL}\\n"`,
    "}",
    '__out += "__CODEKAIRO_STATS__ \\(Int(Date().timeIntervalSince(__t0) * 1000)) 0\\n"',
    `print("${BEGIN}")`,
    'print(__out, terminator: "")',
    "fflush(stdout)",
  ].join("\n");
}

// ═══════════════════════════════════════════════════════════════════
// Rust 1.40 — LeetCode's Rust: Option<Rc<RefCell<TreeNode>>>, Option<Box<ListNode>>.
// ═══════════════════════════════════════════════════════════════════
const RS_T: Record<string, string> = {
  int: "i32", bool: "bool", string: "String", "int[]": "Vec<i32>", "int[][]": "Vec<Vec<i32>>", "string[]": "Vec<String>",
  TreeNode: "Option<Rc<RefCell<TreeNode>>>", ListNode: "Option<Box<ListNode>>", "ListNode[]": "Vec<Option<Box<ListNode>>>", void: "",
};
const RS_DEFAULT: Record<string, string> = {
  int: "0", bool: "false", string: "String::new()", "int[]": "vec![]", "int[][]": "vec![]", "string[]": "vec![]",
  TreeNode: "None", ListNode: "None", void: "",
};
const rsRet = (t: string) => (t === "void" ? "" : ` -> ${RS_T[t]}`);

function rsStub(sig: StructSignature): string {
  if (isClass(sig)) {
    const out = [`struct ${sig.funcName} {`, "", "}", "", "", `impl ${sig.funcName} {`, "", `    fn new(${sig.params.map((p) => `${p.name}: ${RS_T[p.type]}`).join(", ")}) -> Self {`, `        ${sig.funcName} {}`, "    }"];
    for (const m of sig.methods!) out.push("", `    fn ${m.name}(${["&mut self", ...m.params.map((p) => `${p.name}: ${RS_T[p.type]}`)].join(", ")})${rsRet(m.returns)} {`, m.returns === "void" ? "" : `        ${RS_DEFAULT[m.returns]}`, "    }");
    out.push("}");
    return out.join("\n");
  }
  const out: string[] = [];
  if (uses(sig, "tree")) out.push("// Definition for a binary tree node (provided by the judge — do not redefine it):", "// pub struct TreeNode {", "//     pub val: i32,", "//     pub left: Option<Rc<RefCell<TreeNode>>>,", "//     pub right: Option<Rc<RefCell<TreeNode>>>,", "// }", "// impl TreeNode { pub fn new(val: i32) -> Self }", "use std::rc::Rc;", "use std::cell::RefCell;", "");
  if (uses(sig, "list")) out.push("// Definition for singly-linked list (provided by the judge — do not redefine it):", "// pub struct ListNode {", "//     pub val: i32,", "//     pub next: Option<Box<ListNode>>,", "// }", "// impl ListNode { fn new(val: i32) -> Self }", "");
  out.push(`fn ${sig.funcName}(${sig.params.map((p) => `${p.name}: ${RS_T[p.type]}`).join(", ")})${rsRet(sig.returns)} {`, "    // Write your code here", `    ${RS_DEFAULT[sig.returns]}`, "}");
  return out.join("\n");
}

const RS_NODES = `#[derive(Debug, PartialEq, Eq)]
pub struct TreeNode {
    pub val: i32,
    pub left: Option<std::rc::Rc<std::cell::RefCell<TreeNode>>>,
    pub right: Option<std::rc::Rc<std::cell::RefCell<TreeNode>>>,
}
impl TreeNode {
    #[inline]
    pub fn new(val: i32) -> Self {
        TreeNode { val, left: None, right: None }
    }
}
#[derive(PartialEq, Eq, Clone, Debug)]
pub struct ListNode {
    pub val: i32,
    pub next: Option<Box<ListNode>>,
}
impl ListNode {
    #[inline]
    fn new(val: i32) -> Self {
        ListNode { next: None, val }
    }
}`;

const RS_HELPERS = `// ---- driver (do not edit below) ----
fn ck_split(s0: &str) -> Vec<String> {
    let s: Vec<char> = s0.trim().chars().collect();
    let mut out: Vec<String> = Vec::new();
    if s.len() < 2 { return out; }
    let mut depth = 0i32;
    let mut q = false;
    let mut cur = String::new();
    for i in 1..s.len() - 1 {
        let c = s[i];
        if q {
            if c == '"' { q = false; }
            cur.push(c);
            continue;
        }
        if c == '"' { q = true; cur.push(c); }
        else if c == '[' { depth += 1; cur.push(c); }
        else if c == ']' { depth -= 1; cur.push(c); }
        else if c == ',' && depth == 0 { out.push(cur.trim().to_string()); cur = String::new(); }
        else { cur.push(c); }
    }
    let last = cur.trim().to_string();
    if !last.is_empty() || !out.is_empty() { out.push(last); }
    out
}
fn ck_int(t: &str) -> i32 { t.trim().parse::<i32>().unwrap() }
fn ck_str(t: &str) -> String {
    let s = t.trim();
    if s.len() >= 2 && s.starts_with('"') && s.ends_with('"') { s[1..s.len() - 1].to_string() } else { s.to_string() }
}
fn ck_int_arr(t: &str) -> Vec<i32> { ck_split(t).iter().map(|x| ck_int(x)).collect() }
fn ck_int_mat(t: &str) -> Vec<Vec<i32>> { ck_split(t).iter().map(|x| ck_int_arr(x)).collect() }
fn ck_str_arr(t: &str) -> Vec<String> { ck_split(t).iter().map(|x| ck_str(x)).collect() }
fn ck_q(s: &str) -> String { format!("\\"{}\\"", s) }
fn ck_fmt_int_arr(a: &Vec<i32>) -> String {
    let v: Vec<String> = a.iter().map(|x| x.to_string()).collect();
    format!("[{}]", v.join(","))
}
fn ck_fmt_int_mat(m: &Vec<Vec<i32>>) -> String {
    let v: Vec<String> = m.iter().map(|r| ck_fmt_int_arr(r)).collect();
    format!("[{}]", v.join(","))
}
fn ck_fmt_str_arr(a: &Vec<String>) -> String {
    let v: Vec<String> = a.iter().map(|x| ck_q(x)).collect();
    format!("[{}]", v.join(","))
}`;

const RS_TREE_HELPERS = `fn ck_tree(t: &str) -> Option<std::rc::Rc<std::cell::RefCell<TreeNode>>> {
    let p = ck_split(t);
    if p.is_empty() || p[0] == "null" { return None; }
    let root = std::rc::Rc::new(std::cell::RefCell::new(TreeNode::new(ck_int(&p[0]))));
    let mut q: std::collections::VecDeque<std::rc::Rc<std::cell::RefCell<TreeNode>>> = std::collections::VecDeque::new();
    q.push_back(root.clone());
    let mut i = 1;
    while i < p.len() {
        let node = match q.pop_front() { Some(n) => n, None => break };
        if i < p.len() && p[i] != "null" {
            let c = std::rc::Rc::new(std::cell::RefCell::new(TreeNode::new(ck_int(&p[i]))));
            node.borrow_mut().left = Some(c.clone());
            q.push_back(c);
        }
        i += 1;
        if i < p.len() && p[i] != "null" {
            let c = std::rc::Rc::new(std::cell::RefCell::new(TreeNode::new(ck_int(&p[i]))));
            node.borrow_mut().right = Some(c.clone());
            q.push_back(c);
        }
        i += 1;
    }
    Some(root)
}
fn ck_fmt_tree(root: &Option<std::rc::Rc<std::cell::RefCell<TreeNode>>>) -> String {
    let mut out: Vec<String> = Vec::new();
    let mut q: std::collections::VecDeque<Option<std::rc::Rc<std::cell::RefCell<TreeNode>>>> = std::collections::VecDeque::new();
    q.push_back(root.clone());
    while let Some(item) = q.pop_front() {
        match item {
            None => out.push("null".to_string()),
            Some(n) => {
                let b = n.borrow();
                out.push(b.val.to_string());
                q.push_back(b.left.clone());
                q.push_back(b.right.clone());
                if out.len() > ${NODE_CAP} { panic!("the returned tree is too large (or has a cycle)"); }
            }
        }
    }
    while out.last().map(|s| s == "null").unwrap_or(false) { out.pop(); }
    format!("[{}]", out.join(","))
}`;

const RS_LIST_HELPERS = `fn ck_list(t: &str) -> Option<Box<ListNode>> {
    let vals = ck_int_arr(t);
    let mut head: Option<Box<ListNode>> = None;
    for v in vals.iter().rev() {
        let mut n = ListNode::new(*v);
        n.next = head;
        head = Some(Box::new(n));
    }
    head
}
fn ck_lists(t: &str) -> Vec<Option<Box<ListNode>>> { ck_split(t).iter().map(|x| ck_list(x)).collect() }
fn ck_fmt_list(h: &Option<Box<ListNode>>) -> String {
    let mut out: Vec<String> = Vec::new();
    let mut cur = h;
    while let Some(n) = cur {
        out.push(n.val.to_string());
        cur = &n.next;
        if out.len() > ${NODE_CAP} { break; }
    }
    format!("[{}]", out.join(","))
}`;

const rsParse = (t: string, v: string) =>
  ({ int: `ck_int(&${v})`, string: `ck_str(&${v})`, "int[]": `ck_int_arr(&${v})`, "int[][]": `ck_int_mat(&${v})`, "string[]": `ck_str_arr(&${v})`, TreeNode: `ck_tree(&${v})`, ListNode: `ck_list(&${v})`, "ListNode[]": `ck_lists(&${v})` } as Record<string, string>)[t];
const rsFmt = (t: string, v: string, inArray: boolean) =>
  ({ int: `(${v}).to_string()`, bool: `(${v}).to_string()`, string: inArray ? `ck_q(&${v})` : `(${v}).to_string()`, "int[]": `ck_fmt_int_arr(&${v})`, "int[][]": `ck_fmt_int_mat(&${v})`, "string[]": `ck_fmt_str_arr(&${v})`, TreeNode: `ck_fmt_tree(&${v})`, ListNode: `ck_fmt_list(&${v})` } as Record<string, string>)[t];

function rsFile(sig: StructSignature, fn: string): string {
  let body: string[];
  if (isClass(sig)) {
    const branches = sig.methods!.map((m) => {
      const call = `__obj.${m.name}(${m.params.map((p, j) => rsParse(p.type, `__a[${j}]`)).join(", ")})`;
      return `${JSON.stringify(m.name)} => { ${m.returns === "void" ? `${call}; __res.push("null".to_string());` : `let __r = ${call}; __res.push(${rsFmt(m.returns, "__r", true)});`} }`;
    });
    body = [
      "let __ops = ck_str_arr(&lines[0]);",
      "let __all = ck_split(&lines[1]);",
      "let __a0 = ck_split(&__all[0]);",
      `let mut __obj = ${sig.funcName}::new(${sig.params.map((p, j) => rsParse(p.type, `__a0[${j}]`)).join(", ")});`,
      'let mut __res: Vec<String> = vec!["null".to_string()];',
      "for __k in 1..__ops.len() {",
      "    let __a = ck_split(&__all[__k]);",
      "    match __ops[__k].as_str() {",
      ...branches.map((b) => "        " + b + ","),
      '        _ => panic!("unknown operation"),',
      "    }",
      "}",
      '__out.push_str(&format!("[{}]\\n", __res.join(",")));',
    ];
  } else {
    body = [
      ...sig.params.map((p, i) => `let ${p.name} = ${rsParse(p.type, `lines[${i}]`)};`),
      `let __r = ${sig.funcName}(${sig.params.map((p) => p.name).join(", ")});`,
      `__out.push_str(&${rsFmt(sig.returns, "__r", false)});`,
      '__out.push_str("\\n");',
    ];
  }
  const nodes = uses(sig, "tree") || uses(sig, "list") ? RS_NODES : "";
  return [
    "#![allow(non_snake_case, dead_code, unused_variables, unused_mut, unused_imports)]",
    "use std::io::Read;",
    "use std::io::Write;",
    "",
    nodes,
    "",
    fn,
    "",
    RS_HELPERS,
    uses(sig, "tree") ? RS_TREE_HELPERS : "",
    uses(sig, "list") ? RS_LIST_HELPERS : "",
    "",
    "fn main() {",
    "    let __t0 = std::time::Instant::now();",
    "    let mut __out = String::new();",
    "    let mut input = String::new();",
    "    std::io::stdin().read_to_string(&mut input).unwrap();",
    "    let mut cases: Vec<Vec<String>> = Vec::new();",
    "    let mut cur: Vec<String> = Vec::new();",
    "    for l in input.lines() {",
    "        let t = l.trim();",
    `        if t == "${SENTINEL}" {`,
    "            if !cur.is_empty() { cases.push(cur); cur = Vec::new(); }",
    "        } else if !t.is_empty() {",
    "            cur.push(t.to_string());",
    "        }",
    "    }",
    "    if !cur.is_empty() { cases.push(cur); }",
    "    for lines in &cases {",
    ...indent(body, "        "),
    `        __out.push_str("${SENTINEL}\\n");`,
    "    }",
    '    let __mem: i64 = std::fs::read_to_string("/proc/self/status").ok().and_then(|s| s.lines().find(|l| l.starts_with("VmHWM:")).and_then(|l| l.split_whitespace().nth(1).and_then(|v| v.parse().ok()))).unwrap_or(0);',
    '    __out.push_str(&format!("__CODEKAIRO_STATS__ {} {}\\n", __t0.elapsed().as_millis(), __mem));',
    "    let __stdout = std::io::stdout();",
    "    let mut __lock = __stdout.lock();",
    `    let _ = __lock.write_all(b"${BEGIN}\\n");`,
    "    let _ = __lock.write_all(__out.as_bytes());",
    "    let _ = __lock.flush();",
    "}",
  ].join("\n");
}

// ═══════════════════════════════════════════════════════════════════
// PHP 7.4
// ═══════════════════════════════════════════════════════════════════
const PHP_DOC: Record<string, string> = {
  int: "Integer", bool: "Boolean", string: "String", "int[]": "Integer[]", "int[][]": "Integer[][]", "string[]": "String[]",
  TreeNode: "TreeNode", ListNode: "ListNode", "ListNode[]": "ListNode[]", void: "NULL",
};
const PHP_DEFAULT: Record<string, string> = {
  int: "return 0;", bool: "return false;", string: 'return "";', "int[]": "return [];", "int[][]": "return [];", "string[]": "return [];",
  TreeNode: "return null;", ListNode: "return null;", void: "",
};

function phpStub(sig: StructSignature): string {
  if (isClass(sig)) {
    const out = [`class ${sig.funcName} {`, "    /**", ...sig.params.map((p) => `     * @param ${PHP_DOC[p.type]} $${p.name}`), "     */", `    function __construct(${sig.params.map((p) => `$${p.name}`).join(", ")}) {`, "", "    }"];
    for (const m of sig.methods!) out.push("", "    /**", ...m.params.map((p) => `     * @param ${PHP_DOC[p.type]} $${p.name}`), `     * @return ${PHP_DOC[m.returns]}`, "     */", `    function ${m.name}(${m.params.map((p) => `$${p.name}`).join(", ")}) {`, m.returns === "void" ? "" : `        ${PHP_DEFAULT[m.returns]}`, "    }");
    out.push("}");
    return out.join("\n");
  }
  const out: string[] = [];
  if (uses(sig, "tree")) out.push("/**", " * TreeNode is provided by the judge (do not redefine it):", " * class TreeNode {", " *     public $val = null; public $left = null; public $right = null;", " *     function __construct($val = 0, $left = null, $right = null) {...}", " * }", " */");
  if (uses(sig, "list")) out.push("/**", " * ListNode is provided by the judge (do not redefine it):", " * class ListNode {", " *     public $val = 0; public $next = null;", " *     function __construct($val = 0, $next = null) {...}", " * }", " */");
  out.push("/**", ...sig.params.map((p) => ` * @param ${PHP_DOC[p.type]} $${p.name}`), ` * @return ${PHP_DOC[sig.returns]}`, " */");
  out.push(`function ${sig.funcName}(${sig.params.map((p) => `$${p.name}`).join(", ")}) {`, "    // Write your code here", `    ${PHP_DEFAULT[sig.returns]}`, "}");
  return out.join("\n");
}

const PHP_NODES = `class TreeNode {
    public $val = null;
    public $left = null;
    public $right = null;
    function __construct($val = 0, $left = null, $right = null) { $this->val = $val; $this->left = $left; $this->right = $right; }
}
class ListNode {
    public $val = 0;
    public $next = null;
    function __construct($val = 0, $next = null) { $this->val = $val; $this->next = $next; }
}`;

const PHP_HELPERS = `function __ck_tree($a) {
    if (!is_array($a) || count($a) === 0 || $a[0] === null) return null;
    $root = new TreeNode($a[0]);
    $q = [$root];
    $h = 0;
    $i = 1;
    $n = count($a);
    while ($i < $n && $h < count($q)) {
        $nd = $q[$h++];
        if ($i < $n && $a[$i] !== null) { $nd->left = new TreeNode($a[$i]); $q[] = $nd->left; }
        $i++;
        if ($i < $n && $a[$i] !== null) { $nd->right = new TreeNode($a[$i]); $q[] = $nd->right; }
        $i++;
    }
    return $root;
}
function __ck_tree_out($root) {
    $out = [];
    $q = [$root];
    $h = 0;
    while ($h < count($q)) {
        $nd = $q[$h++];
        if ($nd === null) { $out[] = null; continue; }
        $out[] = $nd->val;
        $q[] = $nd->left;
        $q[] = $nd->right;
        if (count($out) > ${NODE_CAP}) throw new \\Exception("the returned tree is too large (or has a cycle)");
    }
    while (count($out) > 0 && end($out) === null) array_pop($out);
    return $out;
}
function __ck_list($a) {
    $d = new ListNode(0);
    $t = $d;
    foreach ($a as $v) { $t->next = new ListNode($v); $t = $t->next; }
    return $d->next;
}
function __ck_list_out($h) {
    $out = [];
    while ($h !== null) {
        $out[] = $h->val;
        $h = $h->next;
        if (count($out) > ${NODE_CAP}) throw new \\Exception("the returned list is too long (or has a cycle)");
    }
    return $out;
}`;

const phpIn = (t: string, v: string) => (t === "TreeNode" ? `__ck_tree(${v})` : t === "ListNode" ? `__ck_list(${v})` : t === "ListNode[]" ? `array_map(function ($x) { return __ck_list($x); }, ${v})` : v);
const phpOut = (t: string, v: string) =>
  t === "TreeNode" ? `json_encode(__ck_tree_out(${v}), JSON_UNESCAPED_SLASHES)`
  : t === "ListNode" ? `json_encode(__ck_list_out(${v}), JSON_UNESCAPED_SLASHES)`
  : t === "bool" ? `(${v} ? "true" : "false")`
  : t === "int" || t === "string" ? `strval(${v})`
  : `json_encode(${v}, JSON_UNESCAPED_SLASHES)`;

function phpFile(sig: StructSignature, fn: string): string {
  let body: string[];
  if (isClass(sig)) {
    const branches = sig.methods!.map((m, i) => {
      const call = `$__obj->${m.name}(${m.params.map((_, j) => `$__a[${j}]`).join(", ")})`;
      return `${i === 0 ? "if" : "elseif"} ($__m === ${JSON.stringify(m.name)}) { ${m.returns === "void" ? `${call}; $__res[] = null;` : `$__res[] = ${call};`} }`;
    });
    body = [
      "$__ops = json_decode($lines[0], true);",
      "$__all = json_decode($lines[1], true);",
      `$__obj = new ${sig.funcName}(${sig.params.map((_, j) => `$__all[0][${j}]`).join(", ")});`,
      "$__res = [null];",
      "for ($__k = 1; $__k < count($__ops); $__k++) {",
      "    $__m = $__ops[$__k];",
      "    $__a = $__all[$__k];",
      ...branches.map((b) => "    " + b),
      '    else throw new \\Exception("unknown operation " . $__m);',
      "}",
      "$out[] = json_encode($__res, JSON_UNESCAPED_SLASHES);",
    ];
  } else {
    body = [
      ...sig.params.map((p, i) => `$${p.name} = ${phpIn(p.type, `json_decode($lines[${i}], true)`)};`),
      `$__r = ${sig.funcName}(${sig.params.map((p) => `$${p.name}`).join(", ")});`,
      `$out[] = ${phpOut(sig.returns, "$__r")};`,
    ];
  }
  const nodes = uses(sig, "tree") || uses(sig, "list");
  return [
    "<?php",
    "namespace Solution;",
    nodes ? PHP_NODES : "",
    fn,
    "",
    "// ---- driver (do not edit below) ----",
    nodes ? PHP_HELPERS : "",
    "$__t0 = microtime(true);",
    "$raw = stream_get_contents(STDIN);",
    "$cases = [];",
    "$cur = [];",
    'foreach (explode("\\n", $raw) as $l) {',
    "    $t = trim($l);",
    `    if ($t === "${SENTINEL}") {`,
    "        if (count($cur) > 0) { $cases[] = $cur; $cur = []; }",
    '    } elseif ($t !== "") {',
    "        $cur[] = $t;",
    "    }",
    "}",
    "if (count($cur) > 0) $cases[] = $cur;",
    "$out = [];",
    "foreach ($cases as $lines) {",
    "    try {",
    ...indent(body, "        "),
    "    } catch (\\Throwable $e) {",
    `        $out[] = "${ERR} " . $e->getMessage();`,
    "    }",
    `    $out[] = "${SENTINEL}";`,
    "}",
    '$out[] = "__CODEKAIRO_STATS__ " . intval((microtime(true) - $__t0) * 1000) . " " . intval(memory_get_peak_usage(true) / 1024);',
    '$joined = implode("\\n", $out) . "\\n";',
    `echo "${BEGIN}\\n";`,
    `if (strlen($joined) > ${GZ_THRESHOLD} && function_exists("gzencode")) {`,
    `    echo "${GZ}\\n" . base64_encode(gzencode($joined)) . "\\n";`,
    "} else {",
    "    echo $joined;",
    "}",
  ].join("\n");
}

// ═══════════════════════════════════════════════════════════════════
// Ruby 2.7
// ═══════════════════════════════════════════════════════════════════
const RB_DOC: Record<string, string> = {
  int: "Integer", bool: "Boolean", string: "String", "int[]": "Integer[]", "int[][]": "Integer[][]", "string[]": "String[]",
  TreeNode: "TreeNode", ListNode: "ListNode", "ListNode[]": "ListNode[]", void: "Void",
};
const RB_DEFAULT: Record<string, string> = {
  int: "0", bool: "false", string: '""', "int[]": "[]", "int[][]": "[]", "string[]": "[]", TreeNode: "nil", ListNode: "nil", void: "",
};

function rbStub(sig: StructSignature): string {
  if (isClass(sig)) {
    const out = [`class ${sig.funcName}`, "", ...sig.params.map((p) => `  # @param {${RB_DOC[p.type]}} ${p.name}`), `  def initialize(${sig.params.map((p) => p.name).join(", ")})`, "", "  end"];
    for (const m of sig.methods!) out.push("", ...m.params.map((p) => `  # @param {${RB_DOC[p.type]}} ${p.name}`), `  # @return {${RB_DOC[m.returns]}}`, `  def ${m.name}(${m.params.map((p) => p.name).join(", ")})`, m.returns === "void" ? "" : `    ${RB_DEFAULT[m.returns]}`, "  end");
    out.push("", "end");
    return out.join("\n");
  }
  const out: string[] = [];
  if (uses(sig, "tree")) out.push("# TreeNode is provided by the judge (do not redefine it):", "# class TreeNode", "#     attr_accessor :val, :left, :right", "#     def initialize(val = 0, left = nil, right = nil)", "# end");
  if (uses(sig, "list")) out.push("# ListNode is provided by the judge (do not redefine it):", "# class ListNode", "#     attr_accessor :val, :next", "#     def initialize(val = 0, _next = nil)", "# end");
  out.push(...sig.params.map((p) => `# @param {${RB_DOC[p.type]}} ${p.name}`), `# @return {${RB_DOC[sig.returns]}}`);
  out.push(`def ${sig.funcName}(${sig.params.map((p) => p.name).join(", ")})`, "  # Write your code here", `  ${RB_DEFAULT[sig.returns]}`, "end");
  return out.join("\n");
}

const RB_NODES = `class TreeNode
  attr_accessor :val, :left, :right
  def initialize(val = 0, left = nil, right = nil)
    @val = val
    @left = left
    @right = right
  end
end
class ListNode
  attr_accessor :val, :next
  def initialize(val = 0, _next = nil)
    @val = val
    @next = _next
  end
end`;

const RB_HELPERS = `def __ck_tree(a)
  return nil if a.nil? || a.empty? || a[0].nil?
  root = TreeNode.new(a[0])
  q = [root]
  h = 0
  i = 1
  while i < a.length && h < q.length
    n = q[h]
    h += 1
    if i < a.length && !a[i].nil?
      n.left = TreeNode.new(a[i])
      q << n.left
    end
    i += 1
    if i < a.length && !a[i].nil?
      n.right = TreeNode.new(a[i])
      q << n.right
    end
    i += 1
  end
  root
end
def __ck_tree_out(root)
  out = []
  q = [root]
  h = 0
  while h < q.length
    n = q[h]
    h += 1
    if n.nil?
      out << nil
      next
    end
    out << n.val
    q << n.left
    q << n.right
    raise "the returned tree is too large (or has a cycle)" if out.length > ${NODE_CAP}
  end
  out.pop while !out.empty? && out[-1].nil?
  out
end
def __ck_list(a)
  d = ListNode.new(0)
  t = d
  a.each do |v|
    t.next = ListNode.new(v)
    t = t.next
  end
  d.next
end
def __ck_list_out(h)
  out = []
  until h.nil?
    out << h.val
    h = h.next
    raise "the returned list is too long (or has a cycle)" if out.length > ${NODE_CAP}
  end
  out
end`;

const rbIn = (t: string, v: string) => (t === "TreeNode" ? `__ck_tree(${v})` : t === "ListNode" ? `__ck_list(${v})` : t === "ListNode[]" ? `${v}.map { |x| __ck_list(x) }` : v);
const rbOut = (t: string, v: string) =>
  t === "TreeNode" ? `__ck_tree_out(${v}).to_json`
  : t === "ListNode" ? `__ck_list_out(${v}).to_json`
  : t === "int" || t === "string" || t === "bool" ? `${v}.to_s`
  : `${v}.to_json`;

function rbFile(sig: StructSignature, fn: string): string {
  let body: string[];
  if (isClass(sig)) {
    const branches = sig.methods!.flatMap((m) => {
      const call = `__obj.${m.name}(${m.params.map((_, j) => `__a[${j}]`).join(", ")})`;
      return [`when ${JSON.stringify(m.name)}`, m.returns === "void" ? `  ${call}` : `  __res << ${call}`, ...(m.returns === "void" ? ["  __res << nil"] : [])];
    });
    body = [
      "__ops = JSON.parse(lines[0])",
      "__all = JSON.parse(lines[1])",
      `__obj = ${sig.funcName}.new(${sig.params.map((_, j) => `__all[0][${j}]`).join(", ")})`,
      "__res = [nil]",
      "(1...__ops.length).each do |__k|",
      "  __a = __all[__k]",
      "  case __ops[__k]",
      ...branches.map((l) => "  " + l),
      "  else",
      '    raise "unknown operation #{__ops[__k]}"',
      "  end",
      "end",
      "out_lines << __res.to_json",
    ];
  } else {
    body = [
      ...sig.params.map((p, i) => `${p.name} = ${rbIn(p.type, `JSON.parse(lines[${i}])`)}`),
      `__r = ${sig.funcName}(${sig.params.map((p) => p.name).join(", ")})`,
      `out_lines << ${rbOut(sig.returns, "__r")}`,
    ];
  }
  const nodes = uses(sig, "tree") || uses(sig, "list");
  return [
    "require 'json'",
    "require 'zlib'",
    "",
    nodes ? RB_NODES : "",
    "",
    fn,
    "",
    "# ---- driver (do not edit below) ----",
    nodes ? RB_HELPERS : "",
    "raw = STDIN.read",
    `if raw.start_with?("${GZIN}")`,
    `  b64 = raw[${GZIN.length}..].delete("\\n\\r ")`,
    '  raw = Zlib.gunzip(b64.unpack1("m0"))',
    "end",
    "cases = []",
    "cur = []",
    'raw.split("\\n").each do |l|',
    "  t = l.strip",
    `  if t == "${SENTINEL}"`,
    "    unless cur.empty?",
    "      cases << cur",
    "      cur = []",
    "    end",
    "  elsif !t.empty?",
    "    cur << t",
    "  end",
    "end",
    "cases << cur unless cur.empty?",
    "__t0 = Process.clock_gettime(Process::CLOCK_MONOTONIC)",
    "out_lines = []",
    "cases.each do |lines|",
    "  begin",
    ...indent(body, "    "),
    "  rescue StandardError, SystemStackError => e",
    `    out_lines << "${ERR} " + e.message`,
    "  end",
    `  out_lines << "${SENTINEL}"`,
    "end",
    "__mem = begin",
    '  File.read("/proc/self/status")[/VmHWM:\\s+(\\d+)/, 1].to_i',
    "rescue",
    "  0",
    "end",
    'out_lines << "__CODEKAIRO_STATS__ #{((Process.clock_gettime(Process::CLOCK_MONOTONIC) - __t0) * 1000).to_i} #{__mem}"',
    'joined = out_lines.join("\\n") + "\\n"',
    `puts "${BEGIN}"`,
    `if joined.length > ${GZ_THRESHOLD}`,
    `  puts "${GZ}"`,
    '  puts [Zlib.gzip(joined)].pack("m0")',
    "else",
    "  print joined",
    "end",
  ].join("\n");
}

// ═══════════════════════════════════════════════════════════════════
// Dispatch
// ═══════════════════════════════════════════════════════════════════
export function structuredStub(lang: Language, sig: StructSignature): string {
  checkStructSignature(sig);
  const dedent = (s: string) => s.split("\n").map((l) => l.replace(/^    /, "")).join("\n");
  switch (lang) {
    case "javascript": return jsStub(sig);
    case "python": return pyStub(sig);
    case "typescript": return tsStub(sig);
    // Function stubs sit inside the driver's class and are indented for it;
    // the editor shows them flush left, as renderStub does for the plain ones.
    case "java": return isClass(sig) ? javaStub(sig) : dedent(javaStub(sig));
    case "cpp": return cppStub(sig);
    case "c": return cStub(sig);
    case "csharp": return isClass(sig) ? csStub(sig) : dedent(csStub(sig));
    case "go": return goStub(sig);
    case "kotlin": return ktStub(sig);
    case "swift": return swStub(sig);
    case "rust": return rsStub(sig);
    case "php": return phpStub(sig);
    case "ruby": return rbStub(sig);
  }
}

/** The complete file for `lang`; `fn` null gives the stub wrapped in its driver. */
export function structuredFile(lang: Language, sig: StructSignature, fn: string | null): string {
  checkStructSignature(sig);
  switch (lang) {
    case "javascript": return jsFile(sig, fn ?? jsStub(sig));
    case "python": return pyFile(sig, fn ?? pyStub(sig));
    case "typescript": return tsFile(sig, fn ?? tsStub(sig));
    case "java": return javaFile(sig, fn ?? javaStub(sig));
    case "cpp": return cppFile(sig, fn ?? cppStub(sig));
    case "c": return cFile(sig, fn ?? cStub(sig));
    case "csharp": return csFile(sig, fn ?? csStub(sig));
    case "go": return goFile(sig, fn ?? goStub(sig));
    case "kotlin": return ktFile(sig, fn ?? ktStub(sig));
    case "swift": return swFile(sig, fn ?? swStub(sig));
    case "rust": return rsFile(sig, fn ?? rsStub(sig));
    case "php": return phpFile(sig, fn ?? phpStub(sig));
    case "ruby": return rbFile(sig, fn ?? rbStub(sig));
  }
}

/**
 * Starter-code generator for all 13 supported languages.
 *
 * javascript / python emit a bare, typed function stub — the wrapCode harness
 * in src/lib/judge0.ts supplies stdin parsing + result printing for those two.
 *
 * Every other language emits a self-contained file: the function stub for the
 * user plus a "driver" section implementing the batch protocol from
 * src/lib/batch.ts — ALL test cases arrive in one stdin separated by
 * __CODEXA_CASE__ lines; the driver loops cases, parses each one's lines
 * positionally, calls the function, prints the result in the exact
 * expectedOutput format ("[0,1]", "true", '["o","l"]', 42), then prints the
 * sentinel. A case that throws prints __CODEXA_ERROR__: + message instead
 * (where the language can catch), so one bad case doesn't hide the rest.
 *
 * renderFile(lang, sig, fnCode) — fnCode null gives the starter stub; passing
 * a full solution function yields a runnable solution file (used to validate
 * that every language actually executes).
 */

export type ParamType = "int" | "int[]" | "int[][]" | "string" | "string[]";
export type ReturnKind = "int" | "bool" | "string" | "int[]" | "int[][]" | "string[]";

export interface Param {
  name: string;
  type: ParamType;
}

export interface Signature {
  funcName: string;
  params: Param[];
  returns: ReturnKind;
}

// Kept in sync with src/lib/batch.ts
const SENTINEL = "__CODEXA_CASE__";
const ERR = "__CODEXA_ERROR__:";
const GZ = "__CODEXA_GZ__";
const GZIN = "__CODEXA_GZIN__"; // length 15; large stdin arrives as marker + base64(gzip)
// Buffered output beyond this size is gzip+base64'd so any suite fits the
// engine's stdout cap in one run (languages with stdlib gzip only).
const GZ_THRESHOLD = 65536;

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

// ── javascript (harness-driven) ────────────────────────────────────
const JS_TYPES: Record<ParamType | ReturnKind, string> = {
  int: "number", bool: "boolean", string: "string",
  "int[]": "number[]", "int[][]": "number[][]", "string[]": "string[]",
};

function jsStub(sig: Signature): string {
  const doc = [
    "/**",
    ...sig.params.map((p) => ` * @param {${JS_TYPES[p.type]}} ${p.name}`),
    ` * @return {${JS_TYPES[sig.returns]}}`,
    " */",
  ];
  const args = sig.params.map((p) => p.name).join(", ");
  return [...doc, `var ${sig.funcName} = function(${args}) {`, "    // Write your code here", "    ", "};"].join("\n");
}

// ── python (harness-driven) ────────────────────────────────────────
const PY_TYPES: Record<ParamType | ReturnKind, string> = {
  int: "int", bool: "bool", string: "str",
  "int[]": "List[int]", "int[][]": "List[List[int]]", "string[]": "List[str]",
};

function pyStub(sig: Signature): string {
  const needsList = sig.params.some((p) => p.type.endsWith("[]")) || sig.returns.endsWith("[]");
  const args = sig.params.map((p) => `${p.name}: ${PY_TYPES[p.type]}`).join(", ");
  const lines = [];
  if (needsList) lines.push("from typing import List", "");
  lines.push(`def ${sig.funcName}(${args}) -> ${PY_TYPES[sig.returns]}:`, "    # Write your code here", "    pass");
  return lines.join("\n");
}

// ── typescript (self-contained) ────────────────────────────────────
function tsStub(sig: Signature): string {
  const args = sig.params.map((p) => `${p.name}: ${JS_TYPES[p.type]}`).join(", ");
  const dflt = { int: "return 0;", bool: "return false;", string: 'return "";', "int[]": "return [];", "int[][]": "return [];", "string[]": "return [];" }[sig.returns];
  return [`function ${sig.funcName}(${args}): ${JS_TYPES[sig.returns]} {`, "    // Write your code here", `    ${dflt}`, "}"].join("\n");
}

function tsDriver(sig: Signature): string {
  const parse = sig.params.map((p, i) => `        const ${p.name}: ${JS_TYPES[p.type]} = JSON.parse(_lines[${i}]);`);
  return [
    "// ---- driver (do not edit below) ----",
    "declare const require: (m: string) => any;",
    "declare const Buffer: any;",
    "declare const process: any;",
    'let _raw: string = require("fs").readFileSync(0, "utf8");',
    `if (_raw.slice(0, 15) === "${GZIN}") {`,
    '    const _zlibIn = require("zlib");',
    '    const _b64 = _raw.slice(15).replace(/\\s+/g, "");',
    '    _raw = _zlibIn.gunzipSync(Buffer.from(_b64, "base64")).toString("utf8");',
    "}",
    "const _cases: string[][] = [];",
    "{",
    "    let _cur: string[] = [];",
    '    for (const _l of _raw.split("\\n")) {',
    "        const _t = _l.trim();",
    `        if (_t === "${SENTINEL}") {`,
    "            if (_cur.length > 0) { _cases.push(_cur); _cur = []; }",
    '        } else if (_t !== "") {',
    "            _cur.push(_t);",
    "        }",
    "    }",
    "    if (_cur.length > 0) _cases.push(_cur);",
    "}",
    "const _t0: number = Date.now();",
    "const _out: string[] = [];",
    "for (const _lines of _cases) {",
    "    try {",
    ...parse,
    `        const _result = ${sig.funcName}(${sig.params.map((p) => p.name).join(", ")});`,
    '        _out.push(typeof _result === "string" ? _result : JSON.stringify(_result));',
    "    } catch (_e) {",
    `        _out.push("${ERR} " + _e);`,
    "    }",
    `    _out.push("${SENTINEL}");`,
    "}",
    '_out.push("__CODEXA_STATS__ " + (Date.now() - _t0) + " " + Math.round(process.memoryUsage().rss / 1024));',
    'const _joined = _out.join("\\n") + "\\n";',
    `if (_joined.length > ${GZ_THRESHOLD}) {`,
    '    const _zlib = require("zlib");',
    `    process.stdout.write("${GZ}\\n" + _zlib.gzipSync(Buffer.from(_joined)).toString("base64") + "\\n");`,
    "} else {",
    "    process.stdout.write(_joined);",
    "}",
  ].join("\n");
}

// ── java (self-contained) ──────────────────────────────────────────
const JAVA_TYPES: Record<ParamType | ReturnKind, string> = {
  int: "int", bool: "boolean", string: "String",
  "int[]": "int[]", "int[][]": "int[][]", "string[]": "String[]",
};

const JAVA_HELPERS = `    // ---- driver (do not edit below) ----
    static int[] parseIntArray(String s) {
        s = s.trim();
        s = s.substring(1, s.length() - 1).trim();
        if (s.isEmpty()) return new int[0];
        String[] parts = s.split(",");
        int[] out = new int[parts.length];
        for (int i = 0; i < parts.length; i++) out[i] = Integer.parseInt(parts[i].trim());
        return out;
    }
    static String[] parseStringArray(String s) {
        java.util.List<String> out = new java.util.ArrayList<>();
        int i = 0;
        while (i < s.length()) {
            if (s.charAt(i) == '"') {
                int j = s.indexOf('"', i + 1);
                out.add(s.substring(i + 1, j));
                i = j + 1;
            } else i++;
        }
        return out.toArray(new String[0]);
    }
    static String parseString(String s) {
        s = s.trim();
        if (s.length() >= 2 && s.charAt(0) == '"' && s.charAt(s.length() - 1) == '"') return s.substring(1, s.length() - 1);
        return s;
    }
    static String fmtIntArray(int[] a) {
        StringBuilder sb = new StringBuilder("[");
        for (int i = 0; i < a.length; i++) { if (i > 0) sb.append(","); sb.append(a[i]); }
        return sb.append("]").toString();
    }
    static String fmtStringArray(String[] a) {
        StringBuilder sb = new StringBuilder("[");
        for (int i = 0; i < a.length; i++) { if (i > 0) sb.append(","); sb.append('"').append(a[i]).append('"'); }
        return sb.append("]").toString();
    }
    static int[][] parseIntMatrix(String s) {
        java.util.List<int[]> rows = new java.util.ArrayList<>();
        int depth = 0, start = 0;
        for (int i = 0; i < s.length(); i++) {
            char c = s.charAt(i);
            if (c == '[') { depth++; if (depth == 2) start = i; }
            else if (c == ']') { if (depth == 2) rows.add(parseIntArray(s.substring(start, i + 1))); depth--; }
        }
        return rows.toArray(new int[0][]);
    }
    static String fmtIntMatrix(int[][] m) {
        StringBuilder sb = new StringBuilder("[");
        for (int i = 0; i < m.length; i++) { if (i > 0) sb.append(","); sb.append(fmtIntArray(m[i])); }
        return sb.append("]").toString();
    }`;

function javaStub(sig: Signature): string {
  const args = sig.params.map((p) => `${JAVA_TYPES[p.type]} ${p.name}`).join(", ");
  const dflt = { int: "return 0;", bool: "return false;", string: 'return "";', "int[]": "return new int[0];", "int[][]": "return new int[0][];", "string[]": "return new String[0];" }[sig.returns];
  return [
    `    public static ${JAVA_TYPES[sig.returns]} ${sig.funcName}(${args}) {`,
    "        // Write your code here",
    `        ${dflt}`,
    "    }",
  ].join("\n");
}

function javaFile(sig: Signature, fn: string): string {
  const parse = sig.params.map((p, i) => {
    if (p.type === "int[][]") return `                int[][] ${p.name} = parseIntMatrix(lines.get(${i}));`;
    if (p.type === "int[]") return `                int[] ${p.name} = parseIntArray(lines.get(${i}));`;
    if (p.type === "string[]") return `                String[] ${p.name} = parseStringArray(lines.get(${i}));`;
    if (p.type === "string") return `                String ${p.name} = parseString(lines.get(${i}));`;
    return `                int ${p.name} = Integer.parseInt(lines.get(${i}).trim());`;
  });
  const call = `${sig.funcName}(${sig.params.map((p) => p.name).join(", ")})`;
  const print =
    sig.returns === "int[]" ? `OUT.append(fmtIntArray(${call})).append("\\n");`
    : sig.returns === "int[][]" ? `OUT.append(fmtIntMatrix(${call})).append("\\n");`
    : sig.returns === "string[]" ? `OUT.append(fmtStringArray(${call})).append("\\n");`
    : `OUT.append(String.valueOf(${call})).append("\\n");`;
  return [
    "import java.util.*;",
    "",
    "public class Main {",
    fn,
    "",
    JAVA_HELPERS,
    "",
    "    public static void main(String[] args) throws Exception {",
    '        Scanner scin = new Scanner(System.in).useDelimiter("\\\\A");',
    '        String raw = scin.hasNext() ? scin.next() : "";',
    `        if (raw.startsWith("${GZIN}")) {`,
    '            String b64 = raw.substring(15).replaceAll("\\\\s", "");',
    "            java.util.zip.GZIPInputStream gzin = new java.util.zip.GZIPInputStream(new java.io.ByteArrayInputStream(Base64.getDecoder().decode(b64)));",
    '            raw = new String(gzin.readAllBytes(), "UTF-8");',
    "        }",
    "        List<List<String>> cases = new ArrayList<>();",
    "        List<String> cur = new ArrayList<>();",
    '        for (String l0 : raw.split("\\n")) {',
    "            String l = l0.trim();",
    `            if (l.equals("${SENTINEL}")) {`,
    "                if (!cur.isEmpty()) { cases.add(cur); cur = new ArrayList<>(); }",
    "            } else if (!l.isEmpty()) {",
    "                cur.add(l);",
    "            }",
    "        }",
    "        if (!cur.isEmpty()) cases.add(cur);",
    "        long __t0 = System.currentTimeMillis();",
    "        StringBuilder OUT = new StringBuilder();",
    "        for (List<String> lines : cases) {",
    "            try {",
    ...parse,
    `                ${print}`,
    "            } catch (Exception e) {",
    `                OUT.append("${ERR} " + e).append("\\n");`,
    "            }",
    `            OUT.append("${SENTINEL}\\n");`,
    "        }",
    "        long __mem = (Runtime.getRuntime().totalMemory() - Runtime.getRuntime().freeMemory()) / 1024;",
    '        OUT.append("__CODEXA_STATS__ " + (System.currentTimeMillis() - __t0) + " " + __mem + "\\n");',
    "        String joined = OUT.toString();",
    `        if (joined.length() > ${GZ_THRESHOLD}) {`,
    "            try {",
    "                java.io.ByteArrayOutputStream bos = new java.io.ByteArrayOutputStream();",
    "                java.util.zip.GZIPOutputStream gz = new java.util.zip.GZIPOutputStream(bos);",
    '                gz.write(joined.getBytes("UTF-8"));',
    "                gz.close();",
    `                System.out.println("${GZ}");`,
    "                System.out.println(Base64.getEncoder().encodeToString(bos.toByteArray()));",
    "            } catch (Exception e) {",
    "                System.out.print(joined);",
    "            }",
    "        } else {",
    "            System.out.print(joined);",
    "        }",
    "    }",
    "}",
  ].join("\n");
}

// ── c++ (self-contained) ───────────────────────────────────────────
const CPP_TYPES: Record<ParamType | ReturnKind, string> = {
  int: "int", bool: "bool", string: "string",
  "int[]": "vector<int>", "int[][]": "vector<vector<int>>", "string[]": "vector<string>",
};

const CPP_HELPERS = `// ---- driver (do not edit below) ----
static vector<int> parseIntArray(const string& s) {
    vector<int> out; string cur;
    for (char c : s) {
        if (isdigit((unsigned char)c) || c == '-') cur += c;
        else if (!cur.empty()) { out.push_back(stoi(cur)); cur.clear(); }
    }
    if (!cur.empty()) out.push_back(stoi(cur));
    return out;
}
static vector<string> parseStringArray(const string& s) {
    vector<string> out; size_t i = 0;
    while (i < s.size()) {
        if (s[i] == '"') { size_t j = s.find('"', i + 1); out.push_back(s.substr(i + 1, j - i - 1)); i = j + 1; }
        else i++;
    }
    return out;
}
static string parseStringValue(string s) {
    size_t b = s.find_first_not_of(" \\t\\r\\n");
    size_t e = s.find_last_not_of(" \\t\\r\\n");
    s = (b == string::npos) ? "" : s.substr(b, e - b + 1);
    if (s.size() >= 2 && s.front() == '"' && s.back() == '"') return s.substr(1, s.size() - 2);
    return s;
}
static string fmtIntArray(const vector<int>& a) {
    string r = "[";
    for (size_t i = 0; i < a.size(); i++) { if (i) r += ","; r += to_string(a[i]); }
    return r + "]";
}
static string fmtStringArray(const vector<string>& a) {
    string r = "[";
    for (size_t i = 0; i < a.size(); i++) { if (i) r += ","; r += '"' + a[i] + '"'; }
    return r + "]";
}
static vector<vector<int>> parseIntMatrix(const string& s) {
    vector<vector<int>> rows;
    int depth = 0; size_t start = 0;
    for (size_t i = 0; i < s.size(); i++) {
        if (s[i] == '[') { depth++; if (depth == 2) start = i; }
        else if (s[i] == ']') { if (depth == 2) rows.push_back(parseIntArray(s.substr(start, i - start + 1))); depth--; }
    }
    return rows;
}
static string fmtIntMatrix(const vector<vector<int>>& m) {
    string r = "[";
    for (size_t i = 0; i < m.size(); i++) { if (i) r += ","; r += fmtIntArray(m[i]); }
    return r + "]";
}`;

function cppStub(sig: Signature): string {
  const args = sig.params
    .map((p) => (p.type.endsWith("[]") ? `${CPP_TYPES[p.type]}& ${p.name}` : `${CPP_TYPES[p.type]} ${p.name}`))
    .join(", ");
  const dflt = { int: "return 0;", bool: "return false;", string: 'return "";', "int[]": "return {};", "int[][]": "return {};", "string[]": "return {};" }[sig.returns];
  return [`${CPP_TYPES[sig.returns]} ${sig.funcName}(${args}) {`, "    // Write your code here", `    ${dflt}`, "}"].join("\n");
}

function cppFile(sig: Signature, fn: string): string {
  const parse = sig.params.map((p, i) => {
    if (p.type === "int[][]") return `            vector<vector<int>> ${p.name} = parseIntMatrix(lines[${i}]);`;
    if (p.type === "int[]") return `            vector<int> ${p.name} = parseIntArray(lines[${i}]);`;
    if (p.type === "string[]") return `            vector<string> ${p.name} = parseStringArray(lines[${i}]);`;
    if (p.type === "string") return `            string ${p.name} = parseStringValue(lines[${i}]);`;
    return `            int ${p.name} = stoi(lines[${i}]);`;
  });
  const call = `${sig.funcName}(${sig.params.map((p) => p.name).join(", ")})`;
  const print =
    sig.returns === "int[]" ? `cout << fmtIntArray(${call}) << endl;`
    : sig.returns === "int[][]" ? `cout << fmtIntMatrix(${call}) << endl;`
    : sig.returns === "string[]" ? `cout << fmtStringArray(${call}) << endl;`
    : sig.returns === "bool" ? `cout << (${call} ? "true" : "false") << endl;`
    : `cout << ${call} << endl;`;
  return [
    "#include <bits/stdc++.h>",
    "#include <sys/resource.h>",
    "using namespace std;",
    "",
    fn,
    "",
    CPP_HELPERS,
    "",
    "int main() {",
    "    vector<vector<string>> cases;",
    "    vector<string> cur;",
    "    string line;",
    "    while (getline(cin, line)) {",
    '        size_t b = line.find_first_not_of(" \\t\\r\\n");',
    '        size_t e = line.find_last_not_of(" \\t\\r\\n");',
    '        string t = (b == string::npos) ? "" : line.substr(b, e - b + 1);',
    `        if (t == "${SENTINEL}") {`,
    "            if (!cur.empty()) { cases.push_back(cur); cur.clear(); }",
    "        } else if (!t.empty()) {",
    "            cur.push_back(t);",
    "        }",
    "    }",
    "    if (!cur.empty()) cases.push_back(cur);",
    "    for (auto& lines : cases) {",
    "        try {",
    ...parse,
    `            ${print}`,
    "        } catch (...) {",
    `            cout << "${ERR} runtime error" << endl;`,
    "        }",
    `        cout << "${SENTINEL}" << endl;`,
    "    }",
    "    struct rusage __ru;",
    "    getrusage(RUSAGE_SELF, &__ru);",
    "    long __cpu_ms = (__ru.ru_utime.tv_sec + __ru.ru_stime.tv_sec) * 1000 + (__ru.ru_utime.tv_usec + __ru.ru_stime.tv_usec) / 1000;",
    '    printf("__CODEXA_STATS__ %ld %ld\\n", __cpu_ms, __ru.ru_maxrss);',
    "    return 0;",
    "}",
  ].join("\n");
}

// ── c (self-contained, LeetCode-style signatures) ──────────────────
const C_HELPERS = `// ---- driver (do not edit below) ----
static int parse_int_array(const char* s, int** out) {
    int cap = 8, n = 0;
    int* arr = (int*)malloc(cap * sizeof(int));
    const char* p = s;
    while (*p) {
        if (*p == '-' || (*p >= '0' && *p <= '9')) {
            char* end;
            long v = strtol(p, &end, 10);
            if (n == cap) { cap *= 2; arr = (int*)realloc(arr, cap * sizeof(int)); }
            arr[n++] = (int)v;
            p = end;
        } else p++;
    }
    *out = arr;
    return n;
}
static int parse_string_array(const char* s, char*** out) {
    int cap = 8, n = 0;
    char** arr = (char**)malloc(cap * sizeof(char*));
    const char* p = s;
    while (*p) {
        if (*p == '"') {
            const char* q = strchr(p + 1, '"');
            int len = (int)(q - p - 1);
            char* item = (char*)malloc(len + 1);
            memcpy(item, p + 1, len);
            item[len] = '\\0';
            if (n == cap) { cap *= 2; arr = (char**)realloc(arr, cap * sizeof(char*)); }
            arr[n++] = item;
            p = q + 1;
        } else p++;
    }
    *out = arr;
    return n;
}
static void strip_string(char* s) {
    size_t len = strlen(s);
    while (len > 0 && (s[len - 1] == '\\n' || s[len - 1] == '\\r' || s[len - 1] == ' ')) s[--len] = '\\0';
    char* start = s;
    while (*start == ' ') start++;
    len = strlen(start);
    if (len >= 2 && start[0] == '"' && start[len - 1] == '"') {
        start[len - 1] = '\\0';
        start++;
    }
    memmove(s, start, strlen(start) + 1);
}
static void print_int_array(const int* a, int n) {
    printf("[");
    for (int i = 0; i < n; i++) { if (i) printf(","); printf("%d", a[i]); }
    printf("]\\n");
}
static void print_string_array(char** a, int n) {
    printf("[");
    for (int i = 0; i < n; i++) { if (i) printf(","); printf("\\"%s\\"", a[i]); }
    printf("]\\n");
}
static int parse_int_matrix(const char* s, int*** out, int** colSizes) {
    int cap = 8, n = 0;
    int** rows = (int**)malloc(cap * sizeof(int*));
    int* cols = (int*)malloc(cap * sizeof(int));
    int depth = 0;
    const char* start = NULL;
    for (const char* p = s; *p; p++) {
        if (*p == '[') { depth++; if (depth == 2) start = p; }
        else if (*p == ']') {
            if (depth == 2 && start) {
                int len = (int)(p - start + 1);
                char* row = (char*)malloc(len + 1);
                memcpy(row, start, len);
                row[len] = '\\0';
                if (n == cap) { cap *= 2; rows = (int**)realloc(rows, cap * sizeof(int*)); cols = (int*)realloc(cols, cap * sizeof(int)); }
                cols[n] = parse_int_array(row, &rows[n]);
                free(row);
                n++;
            }
            depth--;
        }
    }
    *out = rows;
    *colSizes = cols;
    return n;
}
static void print_int_matrix(int** m, int n, const int* colSizes) {
    printf("[");
    for (int i = 0; i < n; i++) {
        if (i) printf(",");
        printf("[");
        for (int j = 0; j < colSizes[i]; j++) { if (j) printf(","); printf("%d", m[i][j]); }
        printf("]");
    }
    printf("]\\n");
}`;

/** LeetCode-style C parameter list: arrays carry a size, array returns carry returnSize. */
function cParamList(sig: Signature): string {
  const parts: string[] = [];
  for (const p of sig.params) {
    if (p.type === "int[][]") parts.push(`int** ${p.name}, int ${p.name}Size, int* ${p.name}ColSize`);
    else if (p.type === "int[]") parts.push(`int* ${p.name}, int ${p.name}Size`);
    else if (p.type === "string[]") parts.push(`char** ${p.name}, int ${p.name}Size`);
    else if (p.type === "string") parts.push(`const char* ${p.name}`);
    else parts.push(`int ${p.name}`);
  }
  if (sig.returns === "int[][]") parts.push("int* returnSize", "int** returnColumnSizes");
  else if (sig.returns === "int[]" || sig.returns === "string[]") parts.push("int* returnSize");
  return parts.join(", ");
}

function cStub(sig: Signature): string {
  const ret = { int: "int", bool: "bool", string: "char*", "int[]": "int*", "int[][]": "int**", "string[]": "char**" }[sig.returns];
  const dflt = {
    int: "return 0;",
    bool: "return false;",
    string: 'return "";',
    "int[]": "*returnSize = 0;\n    return NULL;",
    "int[][]": "*returnSize = 0;\n    return NULL;",
    "string[]": "*returnSize = 0;\n    return NULL;",
  }[sig.returns];
  return [`${ret} ${sig.funcName}(${cParamList(sig)}) {`, "    // Write your code here", `    ${dflt}`, "}"].join("\n");
}

function cFile(sig: Signature, fn: string): string {
  const parse: string[] = [];
  const callArgs: string[] = [];
  sig.params.forEach((p, i) => {
    if (p.type === "int[][]") {
      parse.push(
        `            int** ${p.name};`,
        `            int* ${p.name}ColSize;`,
        `            int ${p.name}Size = parse_int_matrix(lines[${i}], &${p.name}, &${p.name}ColSize);`
      );
      callArgs.push(p.name, `${p.name}Size`, `${p.name}ColSize`);
    } else if (p.type === "int[]") {
      parse.push(`            int* ${p.name};`, `            int ${p.name}Size = parse_int_array(lines[${i}], &${p.name});`);
      callArgs.push(p.name, `${p.name}Size`);
    } else if (p.type === "string[]") {
      parse.push(`            char** ${p.name};`, `            int ${p.name}Size = parse_string_array(lines[${i}], &${p.name});`);
      callArgs.push(p.name, `${p.name}Size`);
    } else if (p.type === "string") {
      parse.push(`            strip_string(lines[${i}]);`, `            const char* ${p.name} = lines[${i}];`);
      callArgs.push(p.name);
    } else {
      parse.push(`            int ${p.name} = atoi(lines[${i}]);`);
      callArgs.push(p.name);
    }
  });
  const callBody: string[] = [];
  if (sig.returns === "int[][]") {
    callArgs.push("&returnSize", "&returnColumnSizes");
    callBody.push(
      "            int returnSize = 0;",
      "            int* returnColumnSizes = NULL;",
      `            int** result = ${sig.funcName}(${callArgs.join(", ")});`,
      "            print_int_matrix(result, returnSize, returnColumnSizes);"
    );
  } else if (sig.returns === "int[]") {
    callArgs.push("&returnSize");
    callBody.push("            int returnSize = 0;", `            int* result = ${sig.funcName}(${callArgs.join(", ")});`, "            print_int_array(result, returnSize);");
  } else if (sig.returns === "string[]") {
    callArgs.push("&returnSize");
    callBody.push("            int returnSize = 0;", `            char** result = ${sig.funcName}(${callArgs.join(", ")});`, "            print_string_array(result, returnSize);");
  } else if (sig.returns === "bool") {
    callBody.push(`            printf(${sig.funcName}(${callArgs.join(", ")}) ? "true\\n" : "false\\n");`);
  } else if (sig.returns === "string") {
    callBody.push(`            printf("%s\\n", ${sig.funcName}(${callArgs.join(", ")}));`);
  } else {
    callBody.push(`            printf("%d\\n", ${sig.funcName}(${callArgs.join(", ")}));`);
  }
  return [
    "#include <stdio.h>",
    "#include <stdlib.h>",
    "#include <string.h>",
    "#include <stdbool.h>",
    "#include <sys/resource.h>",
    "",
    fn,
    "",
    C_HELPERS,
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
    "    char** allLines = (char**)malloc(lineCap * sizeof(char*));",
    "    char* save = NULL;",
    '    for (char* tok = strtok_r(buf, "\\n", &save); tok; tok = strtok_r(NULL, "\\n", &save)) {',
    "        size_t tl = strlen(tok);",
    "        while (tl > 0 && (tok[tl - 1] == '\\r' || tok[tl - 1] == ' ')) tok[--tl] = '\\0';",
    "        while (*tok == ' ') tok++;",
    "        if (*tok == '\\0') continue;",
    "        if (lineCount == lineCap) { lineCap *= 2; allLines = (char**)realloc(allLines, lineCap * sizeof(char*)); }",
    "        allLines[lineCount++] = tok;",
    "    }",
    "    int start = 0;",
    "    for (int idx = 0; idx <= lineCount; idx++) {",
    `        if (idx == lineCount || strcmp(allLines[idx], "${SENTINEL}") == 0) {`,
    "            if (idx > start) {",
    "                char** lines = &allLines[start];",
    ...parse,
    ...callBody,
    `                printf("${SENTINEL}\\n");`,
    "            }",
    "            start = idx + 1;",
    "        }",
    "    }",
    "    struct rusage __ru;",
    "    getrusage(RUSAGE_SELF, &__ru);",
    "    long __cpu_ms = (__ru.ru_utime.tv_sec + __ru.ru_stime.tv_sec) * 1000 + (__ru.ru_utime.tv_usec + __ru.ru_stime.tv_usec) / 1000;",
    '    printf("__CODEXA_STATS__ %ld %ld\\n", __cpu_ms, __ru.ru_maxrss);',
    "    return 0;",
    "}",
  ].join("\n");
}

// ── c# (self-contained) ────────────────────────────────────────────
const CS_TYPES: Record<ParamType | ReturnKind, string> = {
  int: "int", bool: "bool", string: "string",
  "int[]": "int[]", "int[][]": "int[][]", "string[]": "string[]",
};

const CS_HELPERS = `    // ---- driver (do not edit below) ----
    static int[] ParseIntArray(string s)
    {
        s = s.Trim().TrimStart('[').TrimEnd(']').Trim();
        if (s.Length == 0) return new int[0];
        return s.Split(',').Select(x => int.Parse(x.Trim())).ToArray();
    }
    static string[] ParseStringArray(string s)
    {
        var items = new List<string>();
        int i = 0;
        while (i < s.Length)
        {
            if (s[i] == '"') { int j = s.IndexOf('"', i + 1); items.Add(s.Substring(i + 1, j - i - 1)); i = j + 1; }
            else i++;
        }
        return items.ToArray();
    }
    static string ParseString(string s)
    {
        s = s.Trim();
        if (s.Length >= 2 && s[0] == '"' && s[s.Length - 1] == '"') return s.Substring(1, s.Length - 2);
        return s;
    }
    static string FmtIntArray(int[] a) { return "[" + string.Join(",", a) + "]"; }
    static string FmtStringArray(string[] a) { return "[" + string.Join(",", a.Select(x => "\\"" + x + "\\"")) + "]"; }
    static int[][] ParseIntMatrix(string s)
    {
        var rows = new List<int[]>();
        int depth = 0, start = 0;
        for (int i = 0; i < s.Length; i++)
        {
            if (s[i] == '[') { depth++; if (depth == 2) start = i; }
            else if (s[i] == ']') { if (depth == 2) rows.Add(ParseIntArray(s.Substring(start, i - start + 1))); depth--; }
        }
        return rows.ToArray();
    }
    static string FmtIntMatrix(int[][] m) { return "[" + string.Join(",", m.Select(FmtIntArray)) + "]"; }`;

function csFuncName(sig: Signature): string {
  return capitalize(sig.funcName);
}

function csStub(sig: Signature): string {
  const args = sig.params.map((p) => `${CS_TYPES[p.type]} ${p.name}`).join(", ");
  const dflt = { int: "return 0;", bool: "return false;", string: 'return "";', "int[]": "return new int[0];", "int[][]": "return new int[0][];", "string[]": "return new string[0];" }[sig.returns];
  return [
    `    public static ${CS_TYPES[sig.returns]} ${csFuncName(sig)}(${args})`,
    "    {",
    "        // Write your code here",
    `        ${dflt}`,
    "    }",
  ].join("\n");
}

function csFile(sig: Signature, fn: string): string {
  const parse = sig.params.map((p, i) => {
    if (p.type === "int[][]") return `                int[][] ${p.name} = ParseIntMatrix(lines[${i}]);`;
    if (p.type === "int[]") return `                int[] ${p.name} = ParseIntArray(lines[${i}]);`;
    if (p.type === "string[]") return `                string[] ${p.name} = ParseStringArray(lines[${i}]);`;
    if (p.type === "string") return `                string ${p.name} = ParseString(lines[${i}]);`;
    return `                int ${p.name} = int.Parse(lines[${i}].Trim());`;
  });
  const call = `${csFuncName(sig)}(${sig.params.map((p) => p.name).join(", ")})`;
  const print =
    sig.returns === "int[]" ? `OUT.Append(FmtIntArray(${call})).Append('\\n');`
    : sig.returns === "int[][]" ? `OUT.Append(FmtIntMatrix(${call})).Append('\\n');`
    : sig.returns === "string[]" ? `OUT.Append(FmtStringArray(${call})).Append('\\n');`
    : sig.returns === "bool" ? `OUT.Append(${call} ? "true" : "false").Append('\\n');`
    : `OUT.Append(${call}).Append('\\n');`;
  return [
    "using System;",
    "using System.Collections.Generic;",
    "using System.Linq;",
    "",
    "public class Program",
    "{",
    fn,
    "",
    CS_HELPERS,
    "",
    "    public static void Main()",
    "    {",
    "        string raw = Console.In.ReadToEnd();",
    `        if (raw.StartsWith("${GZIN}"))`,
    "        {",
    "            var b64 = raw.Substring(15);",
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
    ...parse,
    `                ${print}`,
    "            }",
    "            catch (Exception e)",
    "            {",
    `                OUT.Append("${ERR} " + e.Message).Append('\\n');`,
    "            }",
    `            OUT.Append("${SENTINEL}\\n");`,
    "        }",
    '        OUT.Append("__CODEXA_STATS__ " + (Environment.TickCount - __t0) + " " + (GC.GetTotalMemory(false) / 1024) + "\\n");',
    "        string joined = OUT.ToString();",
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
    "}",
  ].join("\n");
}

// ── go (self-contained) ────────────────────────────────────────────
const GO_TYPES: Record<ParamType | ReturnKind, string> = {
  int: "int", bool: "bool", string: "string",
  "int[]": "[]int", "int[][]": "[][]int", "string[]": "[]string",
};

function goStub(sig: Signature): string {
  const args = sig.params.map((p) => `${p.name} ${GO_TYPES[p.type]}`).join(", ");
  const dflt = { int: "return 0", bool: "return false", string: 'return ""', "int[]": "return []int{}", "int[][]": "return [][]int{}", "string[]": "return []string{}" }[sig.returns];
  return [`func ${sig.funcName}(${args}) ${GO_TYPES[sig.returns]} {`, "\t// Write your code here", `\t${dflt}`, "}"].join("\n");
}

function goFile(sig: Signature, fn: string): string {
  const needsJSON = sig.params.some((p) => p.type !== "int") || sig.returns.endsWith("[]");
  const needsStrconv = sig.params.some((p) => p.type === "int");
  const imports = ["\t\"bytes\"", "\t\"compress/gzip\"", "\t\"encoding/base64\"", "\t\"fmt\"", "\t\"io/ioutil\"", "\t\"os\"", "\t\"runtime\"", "\t\"strings\"", "\t\"time\""];
  if (needsJSON) imports.push("\t\"encoding/json\"");
  if (needsStrconv) imports.push("\t\"strconv\"");
  imports.sort();
  const parse: string[] = [];
  sig.params.forEach((p, i) => {
    if (p.type === "int") {
      parse.push(`\t\t${p.name}, _ := strconv.Atoi(lines[${i}])`);
    } else {
      parse.push(`\t\tvar ${p.name} ${GO_TYPES[p.type]}`, `\t\tjson.Unmarshal([]byte(lines[${i}]), &${p.name})`);
    }
  });
  const call = `${sig.funcName}(${sig.params.map((p) => p.name).join(", ")})`;
  const print = sig.returns.endsWith("[]")
    ? [
        `\t\t_result := ${call}`,
        "\t\tif _result == nil {",
        `\t\t\t_result = ${GO_TYPES[sig.returns]}{}`,
        "\t\t}",
        "\t\t_encoded, _ := json.Marshal(_result)",
        "\t\tout = append(out, string(_encoded))",
      ]
    : [`\t\tout = append(out, fmt.Sprint(${call}))`];
  return [
    "package main",
    "",
    "import (",
    ...imports,
    ")",
    "",
    fn,
    "",
    "// ---- driver (do not edit below) ----",
    "func main() {",
    "\t__t0 := time.Now()",
    "\trawBytes, _ := ioutil.ReadAll(os.Stdin)",
    "\traw := string(rawBytes)",
    `\tif strings.HasPrefix(raw, "${GZIN}") {`,
    "\t\tb64 := raw[15:]",
    '\t\tb64 = strings.ReplaceAll(b64, "\\n", "")',
    '\t\tb64 = strings.ReplaceAll(b64, "\\r", "")',
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
    ...parse,
    ...print,
    `\t\tout = append(out, "${SENTINEL}")`,
    "\t}",
    "\tvar __ms runtime.MemStats",
    "\truntime.ReadMemStats(&__ms)",
    '\tout = append(out, fmt.Sprintf("__CODEXA_STATS__ %d %d", time.Since(__t0).Milliseconds(), __ms.Sys/1024))',
    '\tjoined := strings.Join(out, "\\n") + "\\n"',
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

// ── kotlin (self-contained) ────────────────────────────────────────
const KT_TYPES: Record<ParamType | ReturnKind, string> = {
  int: "Int", bool: "Boolean", string: "String",
  "int[]": "IntArray", "int[][]": "Array<IntArray>", "string[]": "Array<String>",
};

const KT_HELPERS = `// ---- driver (do not edit below) ----
fun parseIntArray(s: String): IntArray {
    val t = s.trim().removePrefix("[").removeSuffix("]").trim()
    if (t.isEmpty()) return intArrayOf()
    return t.split(",").map { it.trim().toInt() }.toIntArray()
}
fun parseStringArray(s: String): Array<String> {
    val out = ArrayList<String>()
    var i = 0
    while (i < s.length) {
        if (s[i] == '"') {
            val j = s.indexOf('"', i + 1)
            out.add(s.substring(i + 1, j))
            i = j + 1
        } else i++
    }
    return out.toTypedArray()
}
fun parseStringValue(s: String): String {
    val t = s.trim()
    return if (t.length >= 2 && t.first() == '"' && t.last() == '"') t.substring(1, t.length - 1) else t
}
fun fmtIntArray(a: IntArray): String = a.joinToString(",", "[", "]")
fun fmtStringArray(a: Array<String>): String = a.joinToString(",", "[", "]") { "\\"" + it + "\\"" }
fun parseIntMatrix(s: String): Array<IntArray> {
    val rows = ArrayList<IntArray>()
    var depth = 0
    var start = 0
    for (i in s.indices) {
        val c = s[i]
        if (c == '[') { depth++; if (depth == 2) start = i }
        else if (c == ']') { if (depth == 2) rows.add(parseIntArray(s.substring(start, i + 1))); depth-- }
    }
    return rows.toTypedArray()
}
fun fmtIntMatrix(m: Array<IntArray>): String = m.joinToString(",", "[", "]") { fmtIntArray(it) }`;

function ktStub(sig: Signature): string {
  const args = sig.params.map((p) => `${p.name}: ${KT_TYPES[p.type]}`).join(", ");
  const dflt = { int: "return 0", bool: "return false", string: 'return ""', "int[]": "return intArrayOf()", "int[][]": "return arrayOf<IntArray>()", "string[]": "return arrayOf<String>()" }[sig.returns];
  return [`fun ${sig.funcName}(${args}): ${KT_TYPES[sig.returns]} {`, "    // Write your code here", `    ${dflt}`, "}"].join("\n");
}

function ktFile(sig: Signature, fn: string): string {
  const parse = sig.params.map((p, i) => {
    if (p.type === "int[][]") return `            val ${p.name} = parseIntMatrix(lines[${i}])`;
    if (p.type === "int[]") return `            val ${p.name} = parseIntArray(lines[${i}])`;
    if (p.type === "string[]") return `            val ${p.name} = parseStringArray(lines[${i}])`;
    if (p.type === "string") return `            val ${p.name} = parseStringValue(lines[${i}])`;
    return `            val ${p.name} = lines[${i}].trim().toInt()`;
  });
  const call = `${sig.funcName}(${sig.params.map((p) => p.name).join(", ")})`;
  const print =
    sig.returns === "int[]" ? `OUT.append(fmtIntArray(${call})).append("\\n")`
    : sig.returns === "int[][]" ? `OUT.append(fmtIntMatrix(${call})).append("\\n")`
    : sig.returns === "string[]" ? `OUT.append(fmtStringArray(${call})).append("\\n")`
    : `OUT.append(${call}.toString()).append("\\n")`;
  return [
    fn,
    "",
    KT_HELPERS,
    "",
    "fun main() {",
    '    var raw = generateSequence(::readLine).joinToString("\\n")',
    `    if (raw.startsWith("${GZIN}")) {`,
    '        val b64 = raw.substring(15).replace(Regex("\\\\s"), "")',
    "        val gzin = java.util.zip.GZIPInputStream(java.io.ByteArrayInputStream(java.util.Base64.getDecoder().decode(b64)))",
    "        raw = gzin.readBytes().toString(Charsets.UTF_8)",
    "    }",
    '    val allLines = raw.split("\\n").map { it.trim() }',
    "    val cases = ArrayList<List<String>>()",
    "    var cur = ArrayList<String>()",
    "    for (l in allLines) {",
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
    ...parse,
    `            ${print}`,
    "        } catch (e: Exception) {",
    `            OUT.append("${ERR} " + e).append("\\n")`,
    "        }",
    `        OUT.append("${SENTINEL}\\n")`,
    "    }",
    "    val __mem = (Runtime.getRuntime().totalMemory() - Runtime.getRuntime().freeMemory()) / 1024",
    '    OUT.append("__CODEXA_STATS__ " + (System.currentTimeMillis() - __t0) + " " + __mem + "\\n")',
    "    val joined = OUT.toString()",
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

// ── swift (self-contained) ─────────────────────────────────────────
const SW_TYPES: Record<ParamType | ReturnKind, string> = {
  int: "Int", bool: "Bool", string: "String",
  "int[]": "[Int]", "int[][]": "[[Int]]", "string[]": "[String]",
};

const SW_HELPERS = `// ---- driver (do not edit below) ----
func parseIntArray(_ s: String) -> [Int] {
    let t = s.trimmingCharacters(in: .whitespaces)
        .trimmingCharacters(in: CharacterSet(charactersIn: "[]"))
    if t.isEmpty { return [] }
    return t.split(separator: ",").compactMap { Int($0.trimmingCharacters(in: .whitespaces)) }
}
func parseStringArray(_ s: String) -> [String] {
    var out: [String] = []
    var current = ""
    var inQuotes = false
    for ch in s {
        if ch == "\\"" {
            if inQuotes { out.append(current); current = "" }
            inQuotes = !inQuotes
        } else if inQuotes {
            current.append(ch)
        }
    }
    return out
}
func parseStringValue(_ s: String) -> String {
    var t = s.trimmingCharacters(in: .whitespaces)
    if t.count >= 2 && t.hasPrefix("\\"") && t.hasSuffix("\\"") {
        t.removeFirst()
        t.removeLast()
    }
    return t
}
func fmtIntArray(_ a: [Int]) -> String { return "[" + a.map(String.init).joined(separator: ",") + "]" }
func fmtStringArray(_ a: [String]) -> String { return "[" + a.map { "\\"" + $0 + "\\"" }.joined(separator: ",") + "]" }
func parseIntMatrix(_ s: String) -> [[Int]] {
    var rows: [[Int]] = []
    var depth = 0
    var cur = ""
    for ch in s {
        if ch == "[" {
            depth += 1
            if depth == 2 { cur = "[" }
        } else if ch == "]" {
            if depth == 2 { cur.append("]"); rows.append(parseIntArray(cur)) }
            depth -= 1
        } else if depth == 2 {
            cur.append(ch)
        }
    }
    return rows
}
func fmtIntMatrix(_ m: [[Int]]) -> String { return "[" + m.map(fmtIntArray).joined(separator: ",") + "]" }`;

function swStub(sig: Signature): string {
  const args = sig.params.map((p) => `_ ${p.name}: ${SW_TYPES[p.type]}`).join(", ");
  const dflt = { int: "return 0", bool: "return false", string: 'return ""', "int[]": "return []", "int[][]": "return []", "string[]": "return []" }[sig.returns];
  return [`func ${sig.funcName}(${args}) -> ${SW_TYPES[sig.returns]} {`, "    // Write your code here", `    ${dflt}`, "}"].join("\n");
}

function swFile(sig: Signature, fn: string): string {
  const parse = sig.params.map((p, i) => {
    if (p.type === "int[][]") return `    let ${p.name} = parseIntMatrix(lines[${i}])`;
    if (p.type === "int[]") return `    let ${p.name} = parseIntArray(lines[${i}])`;
    if (p.type === "string[]") return `    let ${p.name} = parseStringArray(lines[${i}])`;
    if (p.type === "string") return `    let ${p.name} = parseStringValue(lines[${i}])`;
    return `    let ${p.name} = Int(lines[${i}].trimmingCharacters(in: .whitespaces)) ?? 0`;
  });
  const call = `${sig.funcName}(${sig.params.map((p) => p.name).join(", ")})`;
  const print =
    sig.returns === "int[]" ? `print(fmtIntArray(${call}))`
    : sig.returns === "int[][]" ? `print(fmtIntMatrix(${call}))`
    : sig.returns === "string[]" ? `print(fmtStringArray(${call}))`
    : `print(${call})`;
  return [
    "import Foundation",
    "",
    fn,
    "",
    SW_HELPERS,
    "",
    "let __t0 = Date()",
    "var allLines: [String] = []",
    "while let line = readLine() {",
    "    allLines.append(line.trimmingCharacters(in: .whitespaces))",
    "}",
    "var cases: [[String]] = []",
    "var cur: [String] = []",
    "for l in allLines {",
    `    if l == "${SENTINEL}" {`,
    "        if !cur.isEmpty { cases.append(cur); cur = [] }",
    "    } else if !l.isEmpty {",
    "        cur.append(l)",
    "    }",
    "}",
    "if !cur.isEmpty { cases.append(cur) }",
    "for lines in cases {",
    ...parse,
    `    ${print}`,
    `    print("${SENTINEL}")`,
    "}",
    'print("__CODEXA_STATS__ \\(Int(Date().timeIntervalSince(__t0) * 1000)) 0")',
  ].join("\n");
}

// ── rust (self-contained) ──────────────────────────────────────────
const RS_TYPES: Record<ParamType | ReturnKind, string> = {
  int: "i32", bool: "bool", string: "String",
  "int[]": "Vec<i32>", "int[][]": "Vec<Vec<i32>>", "string[]": "Vec<String>",
};

const RS_HELPERS = `// ---- driver (do not edit below) ----
fn parse_int_array(s: &str) -> Vec<i32> {
    let t = s.trim().trim_start_matches('[').trim_end_matches(']').trim().to_string();
    if t.is_empty() { return vec![]; }
    t.split(',').map(|x| x.trim().parse::<i32>().unwrap()).collect()
}
fn parse_string_array(s: &str) -> Vec<String> {
    let mut out = Vec::new();
    let chars: Vec<char> = s.chars().collect();
    let mut i = 0;
    while i < chars.len() {
        if chars[i] == '"' {
            let mut j = i + 1;
            let mut cur = String::new();
            while j < chars.len() && chars[j] != '"' {
                cur.push(chars[j]);
                j += 1;
            }
            out.push(cur);
            i = j + 1;
        } else {
            i += 1;
        }
    }
    out
}
fn parse_string_value(s: &str) -> String {
    let t = s.trim();
    if t.len() >= 2 && t.starts_with('"') && t.ends_with('"') {
        t[1..t.len() - 1].to_string()
    } else {
        t.to_string()
    }
}
fn fmt_int_array(a: &Vec<i32>) -> String {
    let items: Vec<String> = a.iter().map(|x| x.to_string()).collect();
    format!("[{}]", items.join(","))
}
fn fmt_string_array(a: &Vec<String>) -> String {
    let items: Vec<String> = a.iter().map(|x| format!("\\"{}\\"", x)).collect();
    format!("[{}]", items.join(","))
}
fn parse_int_matrix(s: &str) -> Vec<Vec<i32>> {
    let mut rows = Vec::new();
    let bytes = s.as_bytes();
    let mut depth = 0;
    let mut start = 0usize;
    for i in 0..bytes.len() {
        let c = bytes[i] as char;
        if c == '[' {
            depth += 1;
            if depth == 2 { start = i; }
        } else if c == ']' {
            if depth == 2 { rows.push(parse_int_array(&s[start..=i])); }
            depth -= 1;
        }
    }
    rows
}
fn fmt_int_matrix(m: &Vec<Vec<i32>>) -> String {
    let items: Vec<String> = m.iter().map(|r| fmt_int_array(r)).collect();
    format!("[{}]", items.join(","))
}`;

function rsStub(sig: Signature): string {
  const args = sig.params.map((p) => `${p.name}: ${RS_TYPES[p.type]}`).join(", ");
  const dflt = { int: "0", bool: "false", string: "String::new()", "int[]": "vec![]", "int[][]": "vec![]", "string[]": "vec![]" }[sig.returns];
  return [`fn ${sig.funcName}(${args}) -> ${RS_TYPES[sig.returns]} {`, "    // Write your code here", `    ${dflt}`, "}"].join("\n");
}

function rsFile(sig: Signature, fn: string): string {
  const parse = sig.params.map((p, i) => {
    if (p.type === "int[][]") return `        let ${p.name} = parse_int_matrix(&lines[${i}]);`;
    if (p.type === "int[]") return `        let ${p.name} = parse_int_array(&lines[${i}]);`;
    if (p.type === "string[]") return `        let ${p.name} = parse_string_array(&lines[${i}]);`;
    if (p.type === "string") return `        let ${p.name} = parse_string_value(&lines[${i}]);`;
    return `        let ${p.name}: i32 = lines[${i}].trim().parse().unwrap();`;
  });
  const call = `${sig.funcName}(${sig.params.map((p) => p.name).join(", ")})`;
  const print =
    sig.returns === "int[]" ? `println!("{}", fmt_int_array(&${call}));`
    : sig.returns === "int[][]" ? `println!("{}", fmt_int_matrix(&${call}));`
    : sig.returns === "string[]" ? `println!("{}", fmt_string_array(&${call}));`
    : `println!("{}", ${call});`;
  return [
    "#![allow(non_snake_case, dead_code, unused_variables, unused_mut)]",
    "use std::io::Read;",
    "",
    fn,
    "",
    RS_HELPERS,
    "",
    "fn main() {",
    "    let __t0 = std::time::Instant::now();",
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
    ...parse,
    `        ${print}`,
    `        println!("${SENTINEL}");`,
    "    }",
    '    let __mem: i64 = std::fs::read_to_string("/proc/self/status").ok().and_then(|s| s.lines().find(|l| l.starts_with("VmHWM:")).and_then(|l| l.split_whitespace().nth(1).and_then(|v| v.parse().ok()))).unwrap_or(0);',
    '    println!("__CODEXA_STATS__ {} {}", __t0.elapsed().as_millis(), __mem);',
    "}",
  ].join("\n");
}

// ── php (self-contained) ───────────────────────────────────────────
function phpStub(sig: Signature): string {
  const args = sig.params.map((p) => `$${p.name}`).join(", ");
  const dflt = { int: "return 0;", bool: "return false;", string: 'return "";', "int[]": "return [];", "int[][]": "return [];", "string[]": "return [];" }[sig.returns];
  return [`function ${sig.funcName}(${args}) {`, "    // Write your code here", `    ${dflt}`, "}"].join("\n");
}

function phpFile(sig: Signature, fn: string): string {
  const parse = sig.params.map((p, i) => `        $${p.name} = json_decode($lines[${i}]);`);
  const call = `${sig.funcName}(${sig.params.map((p) => `$${p.name}`).join(", ")})`;
  return [
    "<?php",
    fn,
    "",
    "// ---- driver (do not edit below) ----",
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
    ...parse,
    `        $result = ${call};`,
    '        if (is_bool($result)) $out[] = $result ? "true" : "false";',
    "        elseif (is_array($result)) $out[] = json_encode($result);",
    "        else $out[] = strval($result);",
    "    } catch (Throwable $e) {",
    `        $out[] = "${ERR} " . $e->getMessage();`,
    "    }",
    `    $out[] = "${SENTINEL}";`,
    "}",
    '$out[] = "__CODEXA_STATS__ " . intval((microtime(true) - $__t0) * 1000) . " " . intval(memory_get_peak_usage(true) / 1024);',
    '$joined = implode("\\n", $out) . "\\n";',
    `if (strlen($joined) > ${GZ_THRESHOLD} && function_exists("gzencode")) {`,
    `    echo "${GZ}\\n" . base64_encode(gzencode($joined)) . "\\n";`,
    "} else {",
    "    echo $joined;",
    "}",
  ].join("\n");
}

// ── ruby (self-contained) ──────────────────────────────────────────
function rbStub(sig: Signature): string {
  const args = sig.params.map((p) => p.name).join(", ");
  const dflt = { int: "0", bool: "false", string: '""', "int[]": "[]", "int[][]": "[]", "string[]": "[]" }[sig.returns];
  return [`def ${sig.funcName}(${args})`, "  # Write your code here", `  ${dflt}`, "end"].join("\n");
}

function rbFile(sig: Signature, fn: string): string {
  const parse = sig.params.map((p, i) => `    ${p.name} = JSON.parse(lines[${i}])`);
  const call = `${sig.funcName}(${sig.params.map((p) => p.name).join(", ")})`;
  return [
    "require 'json'",
    "require 'zlib'",
    "",
    fn,
    "",
    "# ---- driver (do not edit below) ----",
    "raw = STDIN.read",
    `if raw.start_with?("${GZIN}")`,
    '  b64 = raw[15..].delete("\\n\\r ")',
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
    ...parse,
    `    result = ${call}`,
    "    if result.is_a?(Array)",
    "      out_lines << result.to_json",
    "    else",
    "      out_lines << result.to_s",
    "    end",
    "  rescue => e",
    `    out_lines << "${ERR} " + e.message`,
    "  end",
    `  out_lines << "${SENTINEL}"`,
    "end",
    "__mem = begin",
    '  File.read("/proc/self/status")[/VmHWM:\\s+(\\d+)/, 1].to_i',
    "rescue",
    "  0",
    "end",
    'out_lines << "__CODEXA_STATS__ #{((Process.clock_gettime(Process::CLOCK_MONOTONIC) - __t0) * 1000).to_i} #{__mem}"',
    'joined = out_lines.join("\\n") + "\\n"',
    `if joined.length > ${GZ_THRESHOLD}`,
    `  puts "${GZ}"`,
    '  puts [Zlib.gzip(joined)].pack("m0")',
    "else",
    "  print joined",
    "end",
  ].join("\n");
}

// ── dispatch ───────────────────────────────────────────────────────
export const ALL_LANGUAGES = [
  "javascript", "typescript", "python", "java", "cpp", "c", "csharp",
  "go", "kotlin", "swift", "rust", "php", "ruby",
] as const;

export type Language = (typeof ALL_LANGUAGES)[number];

/**
 * Render the complete editor file for a language.
 * fnCode null → starter stub; a full solution function → runnable solution.
 */
export function renderFile(lang: Language, sig: Signature, fnCode: string | null): string {
  switch (lang) {
    case "javascript": return fnCode ?? jsStub(sig);
    case "python": return fnCode ?? pyStub(sig);
    case "typescript": return [fnCode ?? tsStub(sig), "", tsDriver(sig)].join("\n");
    case "java": return javaFile(sig, fnCode ?? javaStub(sig));
    case "cpp": return cppFile(sig, fnCode ?? cppStub(sig));
    case "c": return cFile(sig, fnCode ?? cStub(sig));
    case "csharp": return csFile(sig, fnCode ?? csStub(sig));
    case "go": return goFile(sig, fnCode ?? goStub(sig));
    case "kotlin": return ktFile(sig, fnCode ?? ktStub(sig));
    case "swift": return swFile(sig, fnCode ?? swStub(sig));
    case "rust": return rsFile(sig, fnCode ?? rsStub(sig));
    case "php": return phpFile(sig, fnCode ?? phpStub(sig));
    case "ruby": return rbFile(sig, fnCode ?? rbStub(sig));
  }
}

// ── Server-side driver application ─────────────────────────────────

/**
 * Editor-facing starter: ONLY the solution stub. The driver (stdin parsing,
 * batching, gzip, stats) is applied server-side at execution time and never
 * appears in the editor.
 */
export function renderStub(lang: Language, sig: Signature): string {
  const dedent = (s: string) => s.split("\n").map((l) => l.replace(/^    /, "")).join("\n");
  switch (lang) {
    case "javascript": return jsStub(sig);
    case "python": return pyStub(sig);
    case "typescript": return tsStub(sig);
    case "java": return dedent(javaStub(sig));
    case "cpp": return cppStub(sig);
    case "c": return cStub(sig);
    case "csharp": return dedent(csStub(sig));
    case "go": return goStub(sig);
    case "kotlin": return ktStub(sig);
    case "swift": return swStub(sig);
    case "rust": return rsStub(sig);
    case "php": return phpStub(sig);
    case "ruby": return rbStub(sig);
  }
}

/**
 * Wraps the user's editor snippet with the full driver for execution.
 * javascript/python pass through untouched (the wrapCode harness handles
 * them). For class-wrapped languages, user import/using lines are hoisted to
 * the top of the file so adding imports in the editor still compiles.
 */
export function applyDriver(lang: Language, sig: Signature, userCode: string): string {
  if (lang === "javascript" || lang === "python") return userCode;
  let code = userCode;
  let hoisted: string[] = [];
  if (lang === "java" || lang === "kotlin" || lang === "csharp") {
    const re = lang === "csharp" ? /^\s*using\s+[\w.]+\s*;\s*$/ : /^\s*import\s+[\w.*\s]+;?\s*$/;
    const lines = code.split("\n");
    hoisted = lines.filter((l) => re.test(l));
    if (hoisted.length > 0) code = lines.filter((l) => !re.test(l)).join("\n");
  }
  let rendered = renderFile(lang, sig, code);
  if (hoisted.length > 0) rendered = hoisted.join("\n") + "\n" + rendered;
  return rendered;
}

/**
 * Starter-code generator for all 13 supported languages.
 *
 * javascript / python emit a bare, typed function stub — the wrapCode harness
 * in src/lib/judge0.ts supplies stdin parsing + result printing for those two.
 *
 * Every other language emits a self-contained file: the function stub for the
 * user plus a "driver" section that reads this problem's stdin format
 * (one JSON value per line), calls the function, and prints the result in the
 * exact expectedOutput format ("[0,1]", "true", '["o","l"]', 42).
 *
 * renderFile(lang, sig, fnCode) — fnCode null gives the starter stub; passing
 * a full solution function yields a runnable solution file (used to validate
 * that every language actually executes).
 */

export type ParamType = "int" | "int[]" | "string" | "string[]";
export type ReturnKind = "int" | "bool" | "int[]" | "string[]";

export interface Param {
  name: string;
  type: ParamType;
}

export interface Signature {
  funcName: string;
  params: Param[];
  returns: ReturnKind;
}

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

// ── javascript (harness-driven) ────────────────────────────────────
const JS_TYPES: Record<ParamType | ReturnKind, string> = {
  int: "number", bool: "boolean", string: "string",
  "int[]": "number[]", "string[]": "string[]",
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
  "int[]": "List[int]", "string[]": "List[str]",
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
  const dflt = { int: "return 0;", bool: "return false;", "int[]": "return [];", "string[]": "return [];" }[sig.returns];
  return [`function ${sig.funcName}(${args}): ${JS_TYPES[sig.returns]} {`, "    // Write your code here", `    ${dflt}`, "}"].join("\n");
}

function tsDriver(sig: Signature): string {
  const lines = [
    "// ---- driver (do not edit below) ----",
    "declare const require: (m: string) => any;",
    'const _lines: string[] = require("fs").readFileSync(0, "utf8").split("\\n").map((l: string) => l.trim()).filter((l: string) => l !== "");',
  ];
  sig.params.forEach((p, i) => {
    lines.push(`const _a${i}: ${JS_TYPES[p.type]} = JSON.parse(_lines[${i}]);`);
  });
  lines.push(`const _result = ${sig.funcName}(${sig.params.map((_, i) => `_a${i}`).join(", ")});`);
  lines.push('console.log(typeof _result === "string" ? _result : JSON.stringify(_result));');
  return lines.join("\n");
}

// ── java (self-contained) ──────────────────────────────────────────
const JAVA_TYPES: Record<ParamType | ReturnKind, string> = {
  int: "int", bool: "boolean", string: "String",
  "int[]": "int[]", "string[]": "String[]",
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
    }`;

function javaStub(sig: Signature): string {
  const args = sig.params.map((p) => `${JAVA_TYPES[p.type]} ${p.name}`).join(", ");
  const dflt = { int: "return 0;", bool: "return false;", "int[]": "return new int[0];", "string[]": "return new String[0];" }[sig.returns];
  return [
    `    public static ${JAVA_TYPES[sig.returns]} ${sig.funcName}(${args}) {`,
    "        // Write your code here",
    `        ${dflt}`,
    "    }",
  ].join("\n");
}

function javaFile(sig: Signature, fn: string): string {
  const parse = sig.params.map((p, i) => {
    if (p.type === "int[]") return `        int[] ${p.name} = parseIntArray(lines.get(${i}));`;
    if (p.type === "string[]") return `        String[] ${p.name} = parseStringArray(lines.get(${i}));`;
    if (p.type === "string") return `        String ${p.name} = parseString(lines.get(${i}));`;
    return `        int ${p.name} = Integer.parseInt(lines.get(${i}).trim());`;
  });
  const call = `${sig.funcName}(${sig.params.map((p) => p.name).join(", ")})`;
  const print =
    sig.returns === "int[]" ? `System.out.println(fmtIntArray(${call}));`
    : sig.returns === "string[]" ? `System.out.println(fmtStringArray(${call}));`
    : `System.out.println(${call});`;
  return [
    "import java.util.*;",
    "",
    "public class Main {",
    fn,
    "",
    JAVA_HELPERS,
    "",
    "    public static void main(String[] args) {",
    "        Scanner sc = new Scanner(System.in);",
    "        List<String> lines = new ArrayList<>();",
    "        while (sc.hasNextLine()) {",
    "            String l = sc.nextLine().trim();",
    '            if (!l.isEmpty()) lines.add(l);',
    "        }",
    ...parse,
    `        ${print}`,
    "    }",
    "}",
  ].join("\n");
}

// ── c++ (self-contained) ───────────────────────────────────────────
const CPP_TYPES: Record<ParamType | ReturnKind, string> = {
  int: "int", bool: "bool", string: "string",
  "int[]": "vector<int>", "string[]": "vector<string>",
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
}`;

function cppStub(sig: Signature): string {
  const args = sig.params
    .map((p) => (p.type.endsWith("[]") ? `${CPP_TYPES[p.type]}& ${p.name}` : `${CPP_TYPES[p.type]} ${p.name}`))
    .join(", ");
  const dflt = { int: "return 0;", bool: "return false;", "int[]": "return {};", "string[]": "return {};" }[sig.returns];
  return [`${CPP_TYPES[sig.returns]} ${sig.funcName}(${args}) {`, "    // Write your code here", `    ${dflt}`, "}"].join("\n");
}

function cppFile(sig: Signature, fn: string): string {
  const parse = sig.params.map((p, i) => {
    if (p.type === "int[]") return `    vector<int> ${p.name} = parseIntArray(lines[${i}]);`;
    if (p.type === "string[]") return `    vector<string> ${p.name} = parseStringArray(lines[${i}]);`;
    if (p.type === "string") return `    string ${p.name} = parseStringValue(lines[${i}]);`;
    return `    int ${p.name} = stoi(lines[${i}]);`;
  });
  const call = `${sig.funcName}(${sig.params.map((p) => p.name).join(", ")})`;
  const print =
    sig.returns === "int[]" ? `cout << fmtIntArray(${call}) << endl;`
    : sig.returns === "string[]" ? `cout << fmtStringArray(${call}) << endl;`
    : sig.returns === "bool" ? `cout << (${call} ? "true" : "false") << endl;`
    : `cout << ${call} << endl;`;
  return [
    "#include <bits/stdc++.h>",
    "using namespace std;",
    "",
    fn,
    "",
    CPP_HELPERS,
    "",
    "int main() {",
    "    vector<string> lines; string line;",
    "    while (getline(cin, line)) {",
    '        while (!line.empty() && (line.back() == \'\\r\' || line.back() == \'\\n\')) line.pop_back();',
    "        if (!line.empty()) lines.push_back(line);",
    "    }",
    ...parse,
    `    ${print}`,
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
}`;

/** LeetCode-style C parameter list: arrays carry a size, array returns carry returnSize. */
function cParamList(sig: Signature): string {
  const parts: string[] = [];
  for (const p of sig.params) {
    if (p.type === "int[]") parts.push(`int* ${p.name}, int ${p.name}Size`);
    else if (p.type === "string[]") parts.push(`char** ${p.name}, int ${p.name}Size`);
    else if (p.type === "string") parts.push(`const char* ${p.name}`);
    else parts.push(`int ${p.name}`);
  }
  if (sig.returns === "int[]" || sig.returns === "string[]") parts.push("int* returnSize");
  return parts.join(", ");
}

function cStub(sig: Signature): string {
  const ret = { int: "int", bool: "bool", "int[]": "int*", "string[]": "char**" }[sig.returns];
  const dflt = {
    int: "return 0;",
    bool: "return false;",
    "int[]": "*returnSize = 0;\n    return NULL;",
    "string[]": "*returnSize = 0;\n    return NULL;",
  }[sig.returns];
  return [`${ret} ${sig.funcName}(${cParamList(sig)}) {`, "    // Write your code here", `    ${dflt}`, "}"].join("\n");
}

function cFile(sig: Signature, fn: string): string {
  const parse: string[] = [];
  const callArgs: string[] = [];
  sig.params.forEach((p, i) => {
    if (p.type === "int[]") {
      parse.push(`    int* ${p.name};`, `    int ${p.name}Size = parse_int_array(lines[${i}], &${p.name});`);
      callArgs.push(p.name, `${p.name}Size`);
    } else if (p.type === "string[]") {
      parse.push(`    char** ${p.name};`, `    int ${p.name}Size = parse_string_array(lines[${i}], &${p.name});`);
      callArgs.push(p.name, `${p.name}Size`);
    } else if (p.type === "string") {
      parse.push(`    strip_string(lines[${i}]);`, `    const char* ${p.name} = lines[${i}];`);
      callArgs.push(p.name);
    } else {
      parse.push(`    int ${p.name} = atoi(lines[${i}]);`);
      callArgs.push(p.name);
    }
  });
  const callBody: string[] = [];
  if (sig.returns === "int[]") {
    callArgs.push("&returnSize");
    callBody.push("    int returnSize = 0;", `    int* result = ${sig.funcName}(${callArgs.join(", ")});`, "    print_int_array(result, returnSize);");
  } else if (sig.returns === "string[]") {
    callArgs.push("&returnSize");
    callBody.push("    int returnSize = 0;", `    char** result = ${sig.funcName}(${callArgs.join(", ")});`, "    print_string_array(result, returnSize);");
  } else if (sig.returns === "bool") {
    callBody.push(`    printf(${sig.funcName}(${callArgs.join(", ")}) ? "true\\n" : "false\\n");`);
  } else {
    callBody.push(`    printf("%d\\n", ${sig.funcName}(${callArgs.join(", ")}));`);
  }
  return [
    "#include <stdio.h>",
    "#include <stdlib.h>",
    "#include <string.h>",
    "#include <stdbool.h>",
    "",
    fn,
    "",
    C_HELPERS,
    "",
    "int main(void) {",
    "    static char lines[8][65536];",
    "    int lineCount = 0;",
    "    while (lineCount < 8 && fgets(lines[lineCount], sizeof(lines[0]), stdin)) lineCount++;",
    ...parse,
    ...callBody,
    "    return 0;",
    "}",
  ].join("\n");
}

// ── c# (self-contained) ────────────────────────────────────────────
const CS_TYPES: Record<ParamType | ReturnKind, string> = {
  int: "int", bool: "bool", string: "string",
  "int[]": "int[]", "string[]": "string[]",
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
    static string FmtStringArray(string[] a) { return "[" + string.Join(",", a.Select(x => "\\"" + x + "\\"")) + "]"; }`;

function csFuncName(sig: Signature): string {
  return capitalize(sig.funcName);
}

function csStub(sig: Signature): string {
  const args = sig.params.map((p) => `${CS_TYPES[p.type]} ${p.name}`).join(", ");
  const dflt = { int: "return 0;", bool: "return false;", "int[]": "return new int[0];", "string[]": "return new string[0];" }[sig.returns];
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
    if (p.type === "int[]") return `        int[] ${p.name} = ParseIntArray(lines[${i}]);`;
    if (p.type === "string[]") return `        string[] ${p.name} = ParseStringArray(lines[${i}]);`;
    if (p.type === "string") return `        string ${p.name} = ParseString(lines[${i}]);`;
    return `        int ${p.name} = int.Parse(lines[${i}].Trim());`;
  });
  const call = `${csFuncName(sig)}(${sig.params.map((p) => p.name).join(", ")})`;
  const print =
    sig.returns === "int[]" ? `Console.WriteLine(FmtIntArray(${call}));`
    : sig.returns === "string[]" ? `Console.WriteLine(FmtStringArray(${call}));`
    : sig.returns === "bool" ? `Console.WriteLine(${call} ? "true" : "false");`
    : `Console.WriteLine(${call});`;
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
    "        var lines = new List<string>();",
    "        string line;",
    "        while ((line = Console.ReadLine()) != null)",
    "        {",
    "            line = line.Trim();",
    '            if (line.Length > 0) lines.Add(line);',
    "        }",
    ...parse,
    `        ${print}`,
    "    }",
    "}",
  ].join("\n");
}

// ── go (self-contained) ────────────────────────────────────────────
const GO_TYPES: Record<ParamType | ReturnKind, string> = {
  int: "int", bool: "bool", string: "string",
  "int[]": "[]int", "string[]": "[]string",
};

function goStub(sig: Signature): string {
  const args = sig.params.map((p) => `${p.name} ${GO_TYPES[p.type]}`).join(", ");
  const dflt = { int: "return 0", bool: "return false", "int[]": "return []int{}", "string[]": "return []string{}" }[sig.returns];
  return [`func ${sig.funcName}(${args}) ${GO_TYPES[sig.returns]} {`, "\t// Write your code here", `\t${dflt}`, "}"].join("\n");
}

function goFile(sig: Signature, fn: string): string {
  const needsJSON = sig.params.some((p) => p.type !== "int") || sig.returns.endsWith("[]");
  const needsStrconv = sig.params.some((p) => p.type === "int");
  const imports = ["\t\"bufio\"", "\t\"fmt\"", "\t\"os\"", "\t\"strings\""];
  if (needsJSON) imports.splice(1, 0, "\t\"encoding/json\"");
  if (needsStrconv) imports.push("\t\"strconv\"");
  imports.sort();
  const parse: string[] = [];
  sig.params.forEach((p, i) => {
    if (p.type === "int") {
      parse.push(`\t${p.name}, _ := strconv.Atoi(lines[${i}])`);
    } else {
      parse.push(`\tvar ${p.name} ${GO_TYPES[p.type]}`, `\tjson.Unmarshal([]byte(lines[${i}]), &${p.name})`);
    }
  });
  const call = `${sig.funcName}(${sig.params.map((p) => p.name).join(", ")})`;
  const print = sig.returns.endsWith("[]")
    ? [`\t_result := ${call}`, "\tif _result == nil {", `\t\t_result = ${GO_TYPES[sig.returns]}{}`, "\t}", "\t_out, _ := json.Marshal(_result)", "\tfmt.Println(string(_out))"]
    : [`\tfmt.Println(${call})`];
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
    "\tsc := bufio.NewScanner(os.Stdin)",
    "\tsc.Buffer(make([]byte, 1024*1024), 1024*1024)",
    "\tvar lines []string",
    "\tfor sc.Scan() {",
    "\t\tt := strings.TrimSpace(sc.Text())",
    '\t\tif t != "" {',
    "\t\t\tlines = append(lines, t)",
    "\t\t}",
    "\t}",
    ...parse,
    ...print,
    "}",
  ].join("\n");
}

// ── kotlin (self-contained) ────────────────────────────────────────
const KT_TYPES: Record<ParamType | ReturnKind, string> = {
  int: "Int", bool: "Boolean", string: "String",
  "int[]": "IntArray", "string[]": "Array<String>",
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
fun fmtStringArray(a: Array<String>): String = a.joinToString(",", "[", "]") { "\\"" + it + "\\"" }`;

function ktStub(sig: Signature): string {
  const args = sig.params.map((p) => `${p.name}: ${KT_TYPES[p.type]}`).join(", ");
  const dflt = { int: "return 0", bool: "return false", "int[]": "return intArrayOf()", "string[]": "return arrayOf<String>()" }[sig.returns];
  return [`fun ${sig.funcName}(${args}): ${KT_TYPES[sig.returns]} {`, "    // Write your code here", `    ${dflt}`, "}"].join("\n");
}

function ktFile(sig: Signature, fn: string): string {
  const parse = sig.params.map((p, i) => {
    if (p.type === "int[]") return `    val ${p.name} = parseIntArray(lines[${i}])`;
    if (p.type === "string[]") return `    val ${p.name} = parseStringArray(lines[${i}])`;
    if (p.type === "string") return `    val ${p.name} = parseStringValue(lines[${i}])`;
    return `    val ${p.name} = lines[${i}].trim().toInt()`;
  });
  const call = `${sig.funcName}(${sig.params.map((p) => p.name).join(", ")})`;
  const print =
    sig.returns === "int[]" ? `println(fmtIntArray(${call}))`
    : sig.returns === "string[]" ? `println(fmtStringArray(${call}))`
    : `println(${call})`;
  return [
    fn,
    "",
    KT_HELPERS,
    "",
    "fun main() {",
    "    val lines = generateSequence(::readLine).map { it.trim() }.filter { it.isNotEmpty() }.toList()",
    ...parse,
    `    ${print}`,
    "}",
  ].join("\n");
}

// ── swift (self-contained) ─────────────────────────────────────────
const SW_TYPES: Record<ParamType | ReturnKind, string> = {
  int: "Int", bool: "Bool", string: "String",
  "int[]": "[Int]", "string[]": "[String]",
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
func fmtStringArray(_ a: [String]) -> String { return "[" + a.map { "\\"" + $0 + "\\"" }.joined(separator: ",") + "]" }`;

function swStub(sig: Signature): string {
  const args = sig.params.map((p) => `_ ${p.name}: ${SW_TYPES[p.type]}`).join(", ");
  const dflt = { int: "return 0", bool: "return false", "int[]": "return []", "string[]": "return []" }[sig.returns];
  return [`func ${sig.funcName}(${args}) -> ${SW_TYPES[sig.returns]} {`, "    // Write your code here", `    ${dflt}`, "}"].join("\n");
}

function swFile(sig: Signature, fn: string): string {
  const parse = sig.params.map((p, i) => {
    if (p.type === "int[]") return `let ${p.name} = parseIntArray(lines[${i}])`;
    if (p.type === "string[]") return `let ${p.name} = parseStringArray(lines[${i}])`;
    if (p.type === "string") return `let ${p.name} = parseStringValue(lines[${i}])`;
    return `let ${p.name} = Int(lines[${i}].trimmingCharacters(in: .whitespaces)) ?? 0`;
  });
  const call = `${sig.funcName}(${sig.params.map((p) => p.name).join(", ")})`;
  const print =
    sig.returns === "int[]" ? `print(fmtIntArray(${call}))`
    : sig.returns === "string[]" ? `print(fmtStringArray(${call}))`
    : `print(${call})`;
  return [
    "import Foundation",
    "",
    fn,
    "",
    SW_HELPERS,
    "",
    "var lines: [String] = []",
    "while let line = readLine() {",
    "    let t = line.trimmingCharacters(in: .whitespaces)",
    "    if !t.isEmpty { lines.append(t) }",
    "}",
    ...parse,
    print,
  ].join("\n");
}

// ── rust (self-contained) ──────────────────────────────────────────
const RS_TYPES: Record<ParamType | ReturnKind, string> = {
  int: "i32", bool: "bool", string: "String",
  "int[]": "Vec<i32>", "string[]": "Vec<String>",
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
}`;

function rsStub(sig: Signature): string {
  const args = sig.params.map((p) => `${p.name}: ${RS_TYPES[p.type]}`).join(", ");
  const dflt = { int: "0", bool: "false", "int[]": "vec![]", "string[]": "vec![]" }[sig.returns];
  return [`fn ${sig.funcName}(${args}) -> ${RS_TYPES[sig.returns]} {`, "    // Write your code here", `    ${dflt}`, "}"].join("\n");
}

function rsFile(sig: Signature, fn: string): string {
  const parse = sig.params.map((p, i) => {
    if (p.type === "int[]") return `    let ${p.name} = parse_int_array(lines[${i}]);`;
    if (p.type === "string[]") return `    let ${p.name} = parse_string_array(lines[${i}]);`;
    if (p.type === "string") return `    let ${p.name} = parse_string_value(lines[${i}]);`;
    return `    let ${p.name}: i32 = lines[${i}].trim().parse().unwrap();`;
  });
  const call = `${sig.funcName}(${sig.params.map((p) => p.name).join(", ")})`;
  const print =
    sig.returns === "int[]" ? `println!("{}", fmt_int_array(&${call}));`
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
    "    let mut input = String::new();",
    "    std::io::stdin().read_to_string(&mut input).unwrap();",
    "    let lines: Vec<&str> = input.lines().filter(|l| !l.trim().is_empty()).collect();",
    ...parse,
    `    ${print}`,
    "}",
  ].join("\n");
}

// ── php (self-contained) ───────────────────────────────────────────
function phpStub(sig: Signature): string {
  const args = sig.params.map((p) => `$${p.name}`).join(", ");
  const dflt = { int: "return 0;", bool: "return false;", "int[]": "return [];", "string[]": "return [];" }[sig.returns];
  return [`function ${sig.funcName}(${args}) {`, "    // Write your code here", `    ${dflt}`, "}"].join("\n");
}

function phpFile(sig: Signature, fn: string): string {
  const parse = sig.params.map((p, i) => `$${p.name} = json_decode($lines[${i}]);`);
  const call = `${sig.funcName}(${sig.params.map((p) => `$${p.name}`).join(", ")})`;
  return [
    "<?php",
    fn,
    "",
    "// ---- driver (do not edit below) ----",
    '$lines = array_values(array_filter(array_map("trim", explode("\\n", stream_get_contents(STDIN))), function ($l) { return $l !== ""; }));',
    ...parse,
    `$result = ${call};`,
    'if (is_bool($result)) echo $result ? "true" : "false";',
    "elseif (is_array($result)) echo json_encode($result);",
    "else echo $result;",
    'echo "\\n";',
  ].join("\n");
}

// ── ruby (self-contained) ──────────────────────────────────────────
function rbStub(sig: Signature): string {
  const args = sig.params.map((p) => p.name).join(", ");
  const dflt = { int: "0", bool: "false", "int[]": "[]", "string[]": "[]" }[sig.returns];
  return [`def ${sig.funcName}(${args})`, "  # Write your code here", `  ${dflt}`, "end"].join("\n");
}

function rbFile(sig: Signature, fn: string): string {
  const parse = sig.params.map((p, i) => `${p.name} = JSON.parse(lines[${i}])`);
  const call = `${sig.funcName}(${sig.params.map((p) => p.name).join(", ")})`;
  return [
    "require 'json'",
    "",
    fn,
    "",
    "# ---- driver (do not edit below) ----",
    'lines = STDIN.read.split("\\n").map(&:strip).reject(&:empty?)',
    ...parse,
    `result = ${call}`,
    "if result.is_a?(Array)",
    "  puts result.to_json",
    "else",
    "  puts result",
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

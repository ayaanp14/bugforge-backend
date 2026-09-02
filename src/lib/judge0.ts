import axios from "axios";

const JUDGE0_BASE_URL = process.env["JUDGE0_URL"] || "http://localhost:2358";
const JUDGE0_REQUEST_TIMEOUT_MS = Math.max(
  1000,
  parseInt(process.env["JUDGE0_REQUEST_TIMEOUT_MS"] ?? "5000", 10) || 5000
);
const JUDGE0_SUBMIT_RETRIES = Math.max(
  1,
  parseInt(process.env["JUDGE0_SUBMIT_RETRIES"] ?? "1", 10) || 1
);
const JUDGE0_POLL_INTERVAL_MS = Math.max(
  50,
  parseInt(process.env["JUDGE0_POLL_INTERVAL_MS"] ?? "200", 10) || 200
);
const JUDGE0_DEBUG_LOGS = process.env["JUDGE0_DEBUG_LOGS"] === "true";
console.log(`[Judge0] Debug logs enabled: ${JUDGE0_DEBUG_LOGS}`);

export const LANGUAGE_MAP: Record<string, number> = {
  javascript: 63, // Node.js 12.14.0
  typescript: 74, // TypeScript 3.7.4
  python: 71,     // Python 3.8.1
  java: 62,       // Java (OpenJDK 13.0.1)
  cpp: 54,        // C++ (GCC 9.2.0)
  c: 50,          // C (GCC 9.2.0)
  go: 60,         // Go 1.13.5
  csharp: 51,     // C# (Mono 6.6.0.161)
  kotlin: 78,     // Kotlin (1.3.70)
  swift: 83,      // Swift (5.2.3)
  rust: 73,       // Rust (1.40.0)
  php: 68,        // PHP (7.4.1)
  ruby: 72,       // Ruby (2.7.0)
};

export interface Judge0Submission {
  source_code: string;
  language_id: number;
  stdin?: string;
  expected_output?: string;
  cpu_time_limit?: number; // in seconds
  memory_limit?: number; // in KB
}

export interface Judge0Result {
  stdout: string | null;
  stderr: string | null;
  compile_output: string | null;
  message: string | null;
  status: {
    id: number;
    description: string;
  };
  time: string; // runtime in seconds
  memory: number; // memory in KB
}

interface Judge0BatchResultResponse {
  submissions: Array<Judge0Result & { token: string }>;
}

function getHeaders() {
  return {
    "Content-Type": "application/json",
  };
}

export async function isJudge0Available(): Promise<boolean> {
  try {
    await axios.get(`${JUDGE0_BASE_URL}/languages`, {
      headers: getHeaders(),
      timeout: Math.min(2000, JUDGE0_REQUEST_TIMEOUT_MS),
      proxy: false,
    });
    return true;
  } catch {
    return false;
  }
}

function stripAssignedInput(rawInput: string): string {
  if (rawInput.includes("=")) {
    const parts = rawInput.split("=");
    if (parts[0].length < 20 && !parts[0].includes("{") && !parts[0].includes("[")) {
      return parts.slice(1).join("=");
    }
  }
  return rawInput;
}

function wrapJavaCode(code: string): string {
  if (/public\s+static\s+void\s+main\s*\(/.test(code) || /class\s+Main\b/.test(code)) {
    return code;
  }

  const methodMatch = code.match(/public\s+([A-Za-z0-9_<>\[\],\s?]+)\s+([A-Za-z_][A-Za-z0-9_]*)\s*\(([^)]*)\)/);
  if (!methodMatch) return code;

  const [, returnTypeRaw, methodName, paramsRaw] = methodMatch;
  const returnType = returnTypeRaw.trim();
  const params = paramsRaw.trim();
  if (!/^String\s+[A-Za-z_][A-Za-z0-9_]*$/.test(params)) {
    return code;
  }

  const hasSolutionClass = /class\s+Solution\b/.test(code);
  const normalizedCode = hasSolutionClass
    ? code.replace(/public\s+class\s+Solution\b/, "class Solution")
    : `class Solution {\n${code}\n}`;
  const printResult = returnType === "boolean"
    ? 'System.out.println(result ? "true" : "false");'
    : "System.out.println(String.valueOf(result));";

  return `
import java.io.*;

${normalizedCode}

public class Main {
    private static String normalizeInput(String input) {
        if (input == null) return "";
        input = input.trim();
        if (input.contains("=")) {
            String[] parts = input.split("=", 2);
            if (parts[0].length() < 20 && !parts[0].contains("{") && !parts[0].contains("[")) {
                input = parts[1];
            }
        }
        if (input.length() >= 2 && input.startsWith("\\"") && input.endsWith("\\"")) {
            input = input.substring(1, input.length() - 1)
                .replace("\\\\\\\\", "\\\\")
                .replace("\\\\\\"", "\\"")
                .replace("\\\\n", "\\n")
                .replace("\\\\t", "\\t");
        }
        return input;
    }

    public static void main(String[] args) throws Exception {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        String input = br.readLine();
        String arg = normalizeInput(input == null ? "" : input);
        Solution solution = new Solution();
        ${returnType} result = solution.${methodName}(arg);
        ${printResult}
    }
}
`;
}

function wrapCppCode(code: string): string {
  if (/\bmain\s*\(/.test(code)) {
    return code;
  }

  const methodMatch = code.match(/(bool|int|long long|double|float|string|std::string)\s+([A-Za-z_][A-Za-z0-9_]*)\s*\(([^)]*)\)\s*(?:const)?\s*\{/);
  if (!methodMatch) return code;

  const [, returnType, methodName, paramsRaw] = methodMatch;
  const params = paramsRaw.trim();
  if (!/^(const\s+)?(std::)?string\s*&?\s+[A-Za-z_][A-Za-z0-9_]*$/.test(params)) {
    return code;
  }

  const callTarget = /class\s+Solution\b/.test(code) ? `Solution solution;\n    auto result = solution.${methodName}(arg);` : `auto result = ${methodName}(arg);`;
  const printResult = returnType === "bool"
    ? 'cout << (result ? "true" : "false") << endl;'
    : "cout << result << endl;";

  return `
#include <iostream>
#include <string>
#include <stack>
#include <vector>
#include <deque>
#include <algorithm>

using namespace std;

${code}

static string normalizeInput(string input) {
    if (input.find('=') != string::npos) {
        size_t pos = input.find('=');
        string lhs = input.substr(0, pos);
        if (lhs.size() < 20 && lhs.find('{') == string::npos && lhs.find('[') == string::npos) {
            input = input.substr(pos + 1);
        }
    }
    if (input.size() >= 2 && input.front() == '"' && input.back() == '"') {
        input = input.substr(1, input.size() - 2);
    }
    return input;
}

int main() {
    string input;
    getline(cin, input);
    string arg = normalizeInput(input);
    ${callTarget}
    ${printResult}
    return 0;
}
`;
}

function wrapCCode(code: string): string {
  if (/\bmain\s*\(/.test(code)) {
    return code;
  }

  const methodMatch = code.match(/(bool|int|char\s*\*)\s+([A-Za-z_][A-Za-z0-9_]*)\s*\(([^)]*)\)\s*\{/);
  if (!methodMatch) return code;

  const [, returnTypeRaw, methodName, paramsRaw] = methodMatch;
  const returnType = returnTypeRaw.replace(/\s+/g, " ").trim();
  const params = paramsRaw.trim();
  if (!/^(const\s+)?char\s*\*\s*[A-Za-z_][A-Za-z0-9_]*$/.test(params)) {
    return code;
  }

  const invocation = returnType === "char *"
    ? `char *result = ${methodName}(arg);\n    if (result != NULL) {\n        printf("%s\\n", result);\n    }`
    : returnType === "bool"
      ? `bool result = ${methodName}(arg);\n    printf("%s\\n", result ? "true" : "false");`
      : `int result = ${methodName}(arg);\n    printf("%d\\n", result);`;

  return `
#include <stdio.h>
#include <string.h>
#include <stdbool.h>

${code}

static void normalize_input(char *input) {
    size_t len = strlen(input);
    while (len > 0 && (input[len - 1] == '\\n' || input[len - 1] == '\\r')) {
        input[--len] = '\\0';
    }
    char *eq = strchr(input, '=');
    if (eq != NULL) {
        size_t lhs_len = (size_t)(eq - input);
        if (lhs_len < 20) {
            int lhs_has_brace = 0;
            int lhs_has_bracket = 0;
            for (size_t i = 0; i < lhs_len; i++) {
                if (input[i] == '{') lhs_has_brace = 1;
                if (input[i] == '[') lhs_has_bracket = 1;
            }
            if (!lhs_has_brace && !lhs_has_bracket) {
            memmove(input, eq + 1, strlen(eq + 1) + 1);
            len = strlen(input);
            }
        }
    }
    if (len >= 2 && input[0] == '"' && input[len - 1] == '"') {
        memmove(input, input + 1, len - 2);
        input[len - 2] = '\\0';
    }
}

int main(void) {
    char input[10000];
    if (!fgets(input, sizeof(input), stdin)) {
        input[0] = '\\0';
    }
    normalize_input(input);
    char *arg = input;
    ${invocation}
    return 0;
}
`;
}

export function wrapCode(code: string, language: string): string {
  if (language === "javascript") {
    const functionMatch = 
      code.match(/function\s+([a-zA-Z0-9_]+)\s*\(/) || 
      code.match(/(?:var|let|const)\s+([a-zA-Z0-9_]+)\s*=\s*(?:function\s*\(|(?:\([^)]*\)|[a-zA-Z0-9_]+)\s*=>)/);
    const functionName = functionMatch ? functionMatch[1] : null;

    if (!functionName) return code;

    // User code occupies wrapped lines 2..userCodeEndLine (the template opens
    // with one newline), letting the harness map stack lines to editor lines.
    const userCodeEndLine = code.split("\n").length + 1;

    return `
${code}

const fs = require('fs');
const input = fs.readFileSync(0, 'utf8').trim();

/**
 * Parses input string into an array of arguments.
 * Handles "var1=val1, var2=val2" format or plain JSON values.
 */
const parseArgs = (rawInput) => {
  const varRegex = /([a-zA-Z_]\\w*)\\s*=/g;
  const matches = [];
  let match;
  while ((match = varRegex.exec(rawInput)) !== null) {
    matches.push(match);
  }
  
  if (matches.length === 0) {
    // If no assignments found, try parsing as a single value or split by newline
    try { return [JSON.parse(rawInput)]; } catch { return [rawInput]; }
  }

  const args = [];
  for (let i = 0; i < matches.length; i++) {
    const start = matches[i].index + matches[i][0].length;
    const end = (i + 1 < matches.length) ? matches[i+1].index : rawInput.length;
    let rawValue = rawInput.substring(start, end).trim();
    if (rawValue.endsWith(',')) rawValue = rawValue.slice(0, -1).trim();
    
    try {
      args.push(JSON.parse(rawValue));
    } catch {
      args.push(rawValue);
    }
  }
  return args;
};

try {
  const args = parseArgs(input);
  const result = ${functionName}(...args);
  if (typeof result === "string") {
    console.log(result);
  } else if (typeof result === "bigint") {
    console.log(result.toString());
  } else {
    console.log(JSON.stringify(result, (key, value) => 
      typeof value === "bigint" ? value.toString() : value
    ));
  }
} catch (err) {
  let lineNote = "";
  const stackText = err && err.stack ? String(err.stack) : "";
  const lineRegex = /:(\\d+):\\d+/g;
  let frame;
  while ((frame = lineRegex.exec(stackText)) !== null) {
    const ln = parseInt(frame[1], 10);
    if (ln >= 2 && ln <= ${userCodeEndLine}) {
      lineNote = " (line " + (ln - 1) + ")";
      break;
    }
  }
  const msg = err && err.message ? err.message : String(err);
  process.stderr.write("Execution error" + lineNote + ": " + msg + "\\n");
  process.exit(1);
}
`;
  }

  if (language === "python") {
    const funcMatch = code.match(/def\s+([a-zA-Z0-9_]+)\s*\(/);
    const funcName = funcMatch ? funcMatch[1] : null;

    if (!funcName) return code;

    // User code occupies wrapped lines 2..userCodeEndLine (the template opens
    // with one newline), letting the harness map traceback lines to editor lines.
    const userCodeEndLine = code.split("\n").length + 1;

    return `
${code}

import sys
import json
import re

def parse_args(input_data):
    var_regex = r'([a-zA-Z_]\\w*)\\s*='
    matches = list(re.finditer(var_regex, input_data))
    
    if not matches:
        # If no assignments found, try parsing as a single value or split by newline
        try:
            return [json.loads(input_data)]
        except:
            return [input_data]
            
    parsed_args = []
    for i, match in enumerate(matches):
        start = match.end()
        end = matches[i+1].start() if i + 1 < len(matches) else len(input_data)
        raw_value = input_data[start:end].strip()
        if raw_value.endswith(','):
            raw_value = raw_value[:-1].strip()
            
        try:
            parsed_args.append(json.loads(raw_value))
        except:
            # Handle unquoted strings
            parsed_args.append(raw_value)
    return parsed_args

input_data = sys.stdin.read().strip()

try:
    args = parse_args(input_data)
    result = ${funcName}(*args)
    if isinstance(result, str):
        print(result)
    elif isinstance(result, bool):
        print(json.dumps(result))
    elif isinstance(result, (int, float)):
        print(result)
    else:
        print(json.dumps(result))
except Exception as e:
    import traceback
    line_note = ""
    for frame in reversed(traceback.extract_tb(sys.exc_info()[2])):
        if 2 <= frame.lineno <= ${userCodeEndLine}:
            line_note = " (line %d)" % (frame.lineno - 1)
            break
    sys.stderr.write("Execution error%s: %s\\n" % (line_note, str(e)))
    sys.exit(1)
`;
  }

  if (language === "java") {
    return wrapJavaCode(code);
  }

  if (language === "cpp") {
    return wrapCppCode(code);
  }

  if (language === "c") {
    return wrapCCode(code);
  }

  return code;
}

export async function submitToJudge0(submission: Judge0Submission, rawLanguage: string): Promise<string> {
  const wrappedCode = wrapCode(submission.source_code, rawLanguage);

  const payload: Record<string, unknown> = {
    source_code: wrappedCode,
    language_id: submission.language_id,
    cpu_time_limit: submission.cpu_time_limit,
    memory_limit: submission.memory_limit,
  };

  if (submission.stdin) {
    payload.stdin = submission.stdin;
  }

  if (typeof submission.expected_output === "string" && submission.expected_output.length > 0) {
    payload.expected_output = submission.expected_output;
  }

  if (JUDGE0_DEBUG_LOGS) {
    console.log(`Submitting to Judge0 at ${JUDGE0_BASE_URL}... (Language: ${rawLanguage}, ID: ${submission.language_id})`);
    console.log("Judge0 Payload:", JSON.stringify({
      ...payload,
      source_code: wrappedCode,
      stdin: submission.stdin ?? "",
      expected_output: submission.expected_output ?? "",
    }, null, 2));
  }

  let lastError: unknown = null;

  for (let attempt = 1; attempt <= JUDGE0_SUBMIT_RETRIES; attempt++) {
    try {
      const response = await axios.post(
        `${JUDGE0_BASE_URL}/submissions?wait=false`,
        payload,
        {
          headers: getHeaders(),
          timeout: JUDGE0_REQUEST_TIMEOUT_MS,
          proxy: false,
        }
      );

      if (!response.data.token) {
        throw new Error("Failed to get token from Judge0");
      }

      if (JUDGE0_DEBUG_LOGS) {
        console.log("Judge0 Submission Response:", JSON.stringify(response.data, null, 2));
      }

      return response.data.token;
    } catch (err: any) {
      lastError = err;
      console.error(`Judge0 submission error (attempt ${attempt}/${JUDGE0_SUBMIT_RETRIES}):`, err.message);
      if (err.response) {
        console.error("Judge0 response error:", err.response.status, err.response.data);
      }
      if (attempt < JUDGE0_SUBMIT_RETRIES) {
        await new Promise((resolve) => setTimeout(resolve, attempt * 500));
      }
    }
  }

  throw lastError;
}

export async function submitBatchToJudge0(
  submissions: Judge0Submission[],
  rawLanguage: string
): Promise<string[]> {
  const payload = {
    submissions: submissions.map((submission) => {
      const wrappedCode = wrapCode(submission.source_code, rawLanguage);
      const item: Record<string, unknown> = {
        source_code: wrappedCode,
        language_id: submission.language_id,
        cpu_time_limit: submission.cpu_time_limit,
        memory_limit: submission.memory_limit,
      };

      if (submission.stdin) {
        item.stdin = submission.stdin;
      }

      if (typeof submission.expected_output === "string" && submission.expected_output.length > 0) {
        item.expected_output = submission.expected_output;
      }

      return item;
    }),
  };

  if (JUDGE0_DEBUG_LOGS) {
    console.log(`Submitting batch to Judge0 at ${JUDGE0_BASE_URL}... (Language: ${rawLanguage})`);
    console.log("Judge0 Batch Payload:", JSON.stringify(payload, null, 2));
  }

  const response = await axios.post(
    `${JUDGE0_BASE_URL}/submissions/batch?wait=false`,
    payload,
    {
      headers: getHeaders(),
      timeout: JUDGE0_REQUEST_TIMEOUT_MS,
      proxy: false,
    }
  );

  if (JUDGE0_DEBUG_LOGS) {
    console.log("Judge0 Batch Submission Response:", JSON.stringify(response.data, null, 2));
  }

  return response.data.map((item: { token: string }) => item.token);
}

export async function getJudge0Result(token: string): Promise<Judge0Result> {
  try {
    const response = await axios.get(`${JUDGE0_BASE_URL}/submissions/${token}`, {
      headers: getHeaders(),
      timeout: JUDGE0_REQUEST_TIMEOUT_MS,
      proxy: false,
    });
    
    const result = response.data;
    
    return response.data;
  } catch (err: any) {
    console.error("Judge0 result error:", err.message);
    throw err;
  }
}

export async function getBatchJudge0Results(tokens: string[]): Promise<Array<Judge0Result & { token: string }>> {
  const response = await axios.get<Judge0BatchResultResponse>(
    `${JUDGE0_BASE_URL}/submissions/batch?tokens=${tokens.join(",")}`,
    {
      headers: getHeaders(),
      timeout: JUDGE0_REQUEST_TIMEOUT_MS,
      proxy: false,
    }
  );

  return response.data.submissions;
}

export async function pollJudge0(token: string, maxAttempts = 30): Promise<Judge0Result> {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const result = await getJudge0Result(token);
      if (result.status.id > 2) {
        if (JUDGE0_DEBUG_LOGS) {
          console.log(`Judge0 Execution Result (Token: ${token}, Status: ${result.status.description}):`);
          console.log(JSON.stringify({
            status: result.status.description,
            stdout: result.stdout,
            stderr: result.stderr,
            compile_output: result.compile_output,
            time: result.time,
            memory: result.memory
          }, null, 2));
        }
        return result;
      }
    } catch (err) {
      if (JUDGE0_DEBUG_LOGS) {
        console.warn(`Polling attempt ${i+1} failed:`, err);
      }
    }
    await new Promise((resolve) => setTimeout(resolve, JUDGE0_POLL_INTERVAL_MS));
  }
  throw new Error("Judge0 execution timed out after polling.");
}

export async function pollBatchJudge0(tokens: string[], maxAttempts = 30): Promise<Array<Judge0Result & { token: string }>> {
  for (let i = 0; i < maxAttempts; i++) {
    const results = await getBatchJudge0Results(tokens);
    if (results.every((result) => result.status.id > 2)) {
      if (JUDGE0_DEBUG_LOGS) {
        console.log(`Judge0 Batch Results Summary (${results.length} submissions):`);
        results.forEach((res, idx) => {
          console.log(`  [${idx}] Token: ${res.token}, Status: ${res.status.description}, Time: ${res.time}s, Memory: ${res.memory}KB`);
          if (res.status.id !== 3) {
            console.log(`      Error: ${res.stderr || res.compile_output || res.message || "Unknown"}`);
          }
        });
      }
      return results;
    }
    await new Promise((resolve) => setTimeout(resolve, JUDGE0_POLL_INTERVAL_MS));
  }

  throw new Error("Judge0 batch execution timed out after polling.");
}

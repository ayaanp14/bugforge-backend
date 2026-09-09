/**
 * The starter code a question opens the editor with.
 *
 * The model is asked for a complete, formatted skeleton — or an empty string
 * when the question is not a coding question — and the presence of a stub is
 * exactly what decides whether the candidate sees Monaco or a text box. So a
 * stub has to be clean before it is stored: models sometimes wrap it in a
 * markdown fence, escape the newlines, indent the whole thing, or stop after
 * the opening line of a signature. Each of those is repaired here; nothing is
 * invented beyond closing what was left open.
 */

const BRACE_LANGUAGES = new Set([
  "javascript",
  "typescript",
  "java",
  "csharp",
  "go",
  "php",
  "dart",
  "kotlin",
  "cpp",
  "c",
  "rust",
  "swift",
  "scala",
]);

const BODY_PLACEHOLDER: Record<string, string> = {
  python: "pass  # your code here",
  yaml: "# your configuration here",
  sql: "-- your query here",
  ruby: "# your code here",
};

function placeholderFor(language: string) {
  return BODY_PLACEHOLDER[language] ?? "// your code here";
}

/** ```lang … ``` → … ; also a bare pair of fences with nothing else. */
function stripFences(text: string) {
  const fenced = text.match(/^\s*```[\w+-]*[ \t]*\r?\n([\s\S]*?)\r?\n?```\s*$/);
  return fenced ? fenced[1] : text;
}

/** A stub with no real newlines but literal "\n" sequences was double-escaped. */
function unescapeNewlines(text: string) {
  if (text.includes("\n") || !text.includes("\\n")) return text;
  return text.replace(/\\r\\n|\\n/g, "\n").replace(/\\t/g, "  ");
}

function dedent(lines: string[]) {
  const indents = lines.filter((line) => line.trim()).map((line) => line.match(/^[ \t]*/)![0].length);
  const common = indents.length ? Math.min(...indents) : 0;
  return common ? lines.map((line) => line.slice(Math.min(common, line.match(/^[ \t]*/)![0].length))) : lines;
}

/**
 * Closes braces the model left open. `function f(nums) {` alone becomes a
 * three-line skeleton with a placeholder body; a stub that is already balanced
 * is left exactly as it was.
 */
function closeBraces(lines: string[], language: string) {
  if (!BRACE_LANGUAGES.has(language)) return lines;
  const text = lines.join("\n");
  // Braces inside strings or comments are rare in a stub; a rough count is enough.
  const open = (text.match(/\{/g) ?? []).length;
  const close = (text.match(/\}/g) ?? []).length;
  if (open <= close) return lines;

  const out = [...lines];
  while (out.length && !out[out.length - 1].trim()) out.pop();
  const last = out[out.length - 1] ?? "";
  const indent = last.match(/^[ \t]*/)?.[0] ?? "";
  if (last.trim().endsWith("{")) out.push(`${indent}  ${placeholderFor(language)}`);
  // Each closing brace sits one level further out than the one before it,
  // starting from the indentation of the line that opened the innermost block.
  let level = indent.length;
  for (let missing = open - close; missing > 0; missing -= 1) {
    out.push(`${" ".repeat(Math.max(0, level))}}`);
    level -= 2;
  }
  return out;
}

/** `def solve(nums):` alone gets a body, since an empty suite is a syntax error. */
function closePythonSuite(lines: string[], language: string) {
  if (language !== "python") return lines;
  const out = [...lines];
  while (out.length && !out[out.length - 1].trim()) out.pop();
  const last = out[out.length - 1] ?? "";
  if (!last.trim().endsWith(":")) return lines;
  const indent = last.match(/^[ \t]*/)?.[0] ?? "";
  out.push(`${indent}    ${placeholderFor(language)}`);
  return out;
}

/**
 * Null when there is nothing worth opening an editor for; otherwise the stub,
 * cleaned, closed and ending in a single newline.
 */
export function normalizeStarterCode(raw: string | null | undefined, language: string): string | null {
  if (!raw) return null;
  let text = unescapeNewlines(stripFences(raw.replace(/\r\n?/g, "\n")));
  text = stripFences(text);
  if (!text.trim()) return null;

  let lines = text.split("\n").map((line) => line.replace(/[ \t]+$/g, ""));
  while (lines.length && !lines[0].trim()) lines.shift();
  while (lines.length && !lines[lines.length - 1].trim()) lines.pop();
  lines = dedent(lines);
  // At most one blank line in a row.
  lines = lines.filter((line, index) => line.trim() || (index > 0 && lines[index - 1].trim()));
  lines = closeBraces(lines, language);
  lines = closePythonSuite(lines, language);

  const result = lines.join("\n").trim();
  return result ? `${result}\n` : null;
}

"use strict";
const input = require("fs").readFileSync(0, "utf8");
const [mode, ...code] = input.split("\n");
const rules = [
  { name: "no-var", re: /\bvar\b/, message: "Unexpected var, use let or const instead", fix: (l) => l.replace(/\bvar\b/g, "let") },
  { name: "eqeqeq", re: /(?<![=!<>])(==|!=)(?!=)/, message: "Expected === or !== instead of == or !=", fix: (l) => l.replace(/(?<![=!<>])(==|!=)(?!=)/g, (op) => `${op}=`) },
  { name: "no-console", re: /\bconsole\.(?!error\b)\w+/, message: "Unexpected console statement" },
  { name: "no-debugger", re: /\bdebugger\b/, message: "Unexpected debugger statement", fix: (l) => l.replace(/\bdebugger;?/g, "").trimEnd() },
  { name: "max-len", re: /^.{81,}$/, message: "Line exceeds the maximum length of 80" },
  { name: "no-trailing-spaces", re: /[ \t]+$/, message: "Trailing spaces not allowed", fix: (l) => l.trimEnd() },
];
function lint(lines) {
  const findings = [];
  lines.forEach((line, i) => {
    for (const rule of rules) {
      const m = rule.re.exec(line);
      if (m) findings.push({ line: i + 1, col: m.index + 1, rule: rule.name, message: rule.message, fixable: Boolean(rule.fix) });
    }
  });
  return findings;
}
const trimmed = code.filter((_, i) => i < code.length - 1 || code[i] !== "");   // drop the trailing newline's empty line
if (mode.trim() === "fix") {
  const fixed = trimmed.map((line) => rules.reduce((l, r) => (r.fix && r.re.test(l) ? r.fix(l) : l), line));
  console.log(fixed.join("\n"));
  const remaining = lint(fixed);
  console.log(`--- ${remaining.length} problem(s) remain${remaining.length ? `: ${remaining.map((f) => f.rule).join(", ")}` : ""}`);
} else {
  const findings = lint(trimmed);
  for (const f of findings) console.log(`${f.line}:${f.col} ${f.rule} ${f.message}${f.fixable ? " (fixable)" : ""}`);
  console.log(`${findings.length} problem(s), ${findings.filter((f) => f.fixable).length} fixable with --fix`);
}

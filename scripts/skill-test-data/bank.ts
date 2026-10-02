/**
 * The skill-test question bank: Markdown files in ./bank, parsed and checked.
 *
 * Markdown and not TypeScript because nearly every question carries code,
 * and code is full of the backticks and `${}` a template literal cannot hold
 * (the JavaScript study plans had to move their code into side files for the
 * same reason). A fenced block in a .md file needs no escaping at all.
 *
 * The format (AUTHORING.md is the long version):
 *
 *   ---
 *   skill: java
 *   level: basic
 *   ---
 *
 *   ## java-basic-001
 *   topic: strings
 *   answer: B
 *   run: java
 *
 *   What does this program print?
 *
 *   ```java
 *   public class Main { … }
 *   ```
 *
 *   - A: `false`
 *   - B: `true`
 *   - C: It does not compile.
 *   - D: `hi`
 *
 *   > Literals are interned, so both references name the same object.
 *
 * `run:` marks an output-prediction question: the first fenced block is a
 * complete program, and `--run` executes it on the study judge and requires
 * its stdout to equal the keyed option. That is the one kind of question a
 * machine can check, so the banks lean on it.
 */
import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { isSkillLevel, skillDef } from "../../src/lib/skill-catalog.js";

export interface BankQuestion {
  key: string;
  skill: string;
  level: string;
  topic: string;
  kind: "single" | "multi";
  prompt: string;
  options: string[];
  /** Indices of the correct options. */
  answer: number[];
  explanation: string;
  /** Output prediction: the judge language the prompt's first fenced block runs in. */
  run?: string;
  file: string;
  line: number;
}

/** Languages a `run:` program may be written in — the study judge's. */
export const RUN_LANGUAGES = ["java", "python", "javascript", "cpp", "c", "go", "typescript"] as const;

const LETTERS = "ABCDEF";
const FENCE = /^\s*(```|~~~)/;
const OPTION = /^- ([A-F]): (.*)$/;
const HEADER = /^(topic|answer|run):\s*(.*)$/;

export const BANK_DIR = join(dirname(fileURLToPath(import.meta.url)), "bank");

/** Parses one bank file. Structural problems come back as messages, never throws. */
export function parseBank(text: string, file: string): { questions: BankQuestion[]; problems: string[] } {
  const problems: string[] = [];
  const lines = text.replace(/\r\n?/g, "\n").split("\n");
  const where = (line: number) => `${file}:${line + 1}`;

  // Front matter: the skill and level every question in the file belongs to.
  let skill = "";
  let level = "";
  let cursor = 0;
  if (lines[0]?.trim() === "---") {
    const end = lines.indexOf("---", 1);
    if (end < 0) return { questions: [], problems: [`${file}: front matter is never closed`] };
    for (const line of lines.slice(1, end)) {
      const m = /^(skill|level):\s*(\S+)\s*$/.exec(line.trim());
      if (m?.[1] === "skill") skill = m[2]!;
      if (m?.[1] === "level") level = m[2]!;
    }
    cursor = end + 1;
  }
  if (!skillDef(skill)) problems.push(`${file}: front matter must name a known skill (got "${skill}")`);
  if (!isSkillLevel(level)) problems.push(`${file}: front matter must name a level (got "${level}")`);
  if (problems.length) return { questions: [], problems };

  // Split into blocks at "## key" headings that sit outside code fences.
  const blocks: Array<{ key: string; start: number; body: string[] }> = [];
  let fenced = false;
  for (let i = cursor; i < lines.length; i += 1) {
    const line = lines[i]!;
    if (FENCE.test(line)) fenced = !fenced;
    const heading = !fenced && /^## (\S+)\s*$/.exec(line);
    if (heading) {
      blocks.push({ key: heading[1]!, start: i, body: [] });
      continue;
    }
    if (blocks.length) blocks[blocks.length - 1]!.body.push(line);
    else if (line.trim() && !fenced) problems.push(`${where(i)}: text before the first question`);
  }

  const questions: BankQuestion[] = [];
  for (const block of blocks) {
    const at = where(block.start);
    const body = block.body;
    let i = 0;
    while (i < body.length && !body[i]!.trim()) i += 1;

    const headers: Record<string, string> = {};
    while (i < body.length && HEADER.test(body[i]!)) {
      const m = HEADER.exec(body[i]!)!;
      headers[m[1]!] = m[2]!.trim();
      i += 1;
    }

    // The options are the first run of "- X: …" lines outside a fence.
    let optionStart = -1;
    let optionEnd = -1;
    let inFence = false;
    for (let j = i; j < body.length; j += 1) {
      if (FENCE.test(body[j]!)) inFence = !inFence;
      if (inFence) continue;
      if (OPTION.test(body[j]!)) {
        optionStart = j;
        optionEnd = j;
        while (optionEnd + 1 < body.length && OPTION.test(body[optionEnd + 1]!)) optionEnd += 1;
        break;
      }
    }
    if (optionStart < 0) {
      problems.push(`${at} ${block.key}: no options ("- A: …" lines)`);
      continue;
    }

    const prompt = body.slice(i, optionStart).join("\n").trim();
    const options: string[] = [];
    for (let j = optionStart; j <= optionEnd; j += 1) {
      const m = OPTION.exec(body[j]!)!;
      if (m[1] !== LETTERS[options.length]) problems.push(`${at} ${block.key}: options must run A, B, C… in order`);
      options.push(m[2]!.trim());
    }

    const explanation: string[] = [];
    for (const line of body.slice(optionEnd + 1)) {
      if (!line.trim()) continue;
      if (line.startsWith(">")) explanation.push(line.replace(/^>\s?/, ""));
      else problems.push(`${at} ${block.key}: only a "> explanation" may follow the options (found "${line.slice(0, 40)}")`);
    }

    const letters = (headers["answer"] ?? "").split(/[\s,]+/).filter(Boolean);
    const answer = letters.map((letter) => LETTERS.indexOf(letter.toUpperCase()));

    questions.push({
      key: block.key,
      skill,
      level,
      topic: headers["topic"] ?? "",
      kind: answer.length > 1 ? "multi" : "single",
      prompt,
      options,
      answer,
      explanation: explanation.join("\n").replace(/^Explanation:\s*/i, "").trim(),
      run: headers["run"] || undefined,
      file,
      line: block.start + 1,
    });
  }

  return { questions, problems };
}

/** The keyed option of a `run:` question, as the program should print it. */
export function expectedOutput(question: BankQuestion): string | null {
  const option = question.options[question.answer[0] ?? -1];
  if (option == null) return null;
  const m = /^`([^`]+)`$/.exec(option.trim()) ?? /^``\s?(.+?)\s?``$/.exec(option.trim());
  return m ? m[1]! : null;
}

/** The program a `run:` question shows: its first fenced block. */
export function programOf(question: BankQuestion): string | null {
  const m = /^\s*(```|~~~)[^\n]*\n([\s\S]*?)\n\s*\1\s*$/m.exec(question.prompt);
  return m ? m[2]! : null;
}

const normalise = (text: string) => text.toLowerCase().replace(/\s+/g, " ").trim();

/**
 * Every rule a question must keep. Returned as messages so the seeder can
 * print them all at once rather than stopping at the first.
 */
export function validateBank(questions: BankQuestion[]): string[] {
  const problems: string[] = [];
  const seenKeys = new Map<string, string>();
  const seenPrompts = new Map<string, string>();

  for (const q of questions) {
    const at = `${q.file}:${q.line} ${q.key}`;
    const def = skillDef(q.skill);

    if (!new RegExp(`^${q.skill}-${q.level}-\\d{3}$`).test(q.key)) {
      problems.push(`${at}: key must be "${q.skill}-${q.level}-NNN"`);
    }
    if (seenKeys.has(q.key)) problems.push(`${at}: key already used at ${seenKeys.get(q.key)}`);
    seenKeys.set(q.key, `${q.file}:${q.line}`);

    if (!def?.topics.some((t) => t.id === q.topic)) {
      problems.push(`${at}: unknown topic "${q.topic}" (known: ${def?.topics.map((t) => t.id).join(", ")})`);
    }
    if (q.prompt.length < 10) problems.push(`${at}: the prompt is missing or too short`);
    if (/__CODEXA_/.test(q.prompt + q.options.join("") + q.explanation)) problems.push(`${at}: contains the reserved marker __CODEXA_`);

    if (q.options.length < 3 || q.options.length > 6) problems.push(`${at}: needs 3–6 options (has ${q.options.length})`);
    const distinct = new Set(q.options.map(normalise));
    if (distinct.size !== q.options.length) problems.push(`${at}: two options read the same`);
    if (q.options.some((o) => !o)) problems.push(`${at}: an option is empty`);

    if (q.answer.length === 0) problems.push(`${at}: no answer: line`);
    if (q.answer.some((i) => i < 0 || i >= q.options.length)) problems.push(`${at}: the answer names an option that does not exist`);
    if (new Set(q.answer).size !== q.answer.length) problems.push(`${at}: the answer repeats a letter`);
    if (q.kind === "multi") {
      if (!/select all that apply/i.test(q.prompt)) problems.push(`${at}: a multi-answer prompt must say "Select all that apply"`);
      if (q.answer.length === q.options.length) problems.push(`${at}: every option is correct`);
    } else if (/select all that apply/i.test(q.prompt)) {
      problems.push(`${at}: says "Select all that apply" but keys one answer`);
    }

    if (q.explanation.length < 30) problems.push(`${at}: the explanation must say why (30+ characters)`);

    if (q.run) {
      if (!(RUN_LANGUAGES as readonly string[]).includes(q.run)) problems.push(`${at}: run: must be one of ${RUN_LANGUAGES.join(", ")}`);
      if (q.kind !== "single") problems.push(`${at}: a run: question keys exactly one option`);
      if (!programOf(q)) problems.push(`${at}: a run: question needs its program in a fenced block`);
      if (expectedOutput(q) == null) problems.push(`${at}: a run: question's keyed option must be one inline code span, e.g. \`3 4\``);
      if (q.run === "java" && !/public\s+class\s+Main\b/.test(programOf(q) ?? "")) {
        problems.push(`${at}: a Java program must be "public class Main"`);
      }
      const program = programOf(q) ?? "";
      if (q.run === "go" && !(/^package main\b/m.test(program) && /^func main\(\)/m.test(program))) {
        problems.push(`${at}: a Go program must be "package main" with "func main()"`);
      }
      if ((q.run === "c" || q.run === "cpp") && !/\bint\s+main\s*\(/.test(program)) {
        problems.push(`${at}: a C or C++ program needs "int main("`);
      }
    }

    const fingerprint = normalise(q.prompt);
    if (seenPrompts.has(fingerprint)) problems.push(`${at}: same prompt as ${seenPrompts.get(fingerprint)}`);
    seenPrompts.set(fingerprint, at);
  }

  return problems;
}

/** Every bank file, parsed. `only` narrows to "<skill>-<level>" pools. */
export function loadBank(only?: Set<string> | null): { questions: BankQuestion[]; problems: string[] } {
  let files: string[] = [];
  try {
    files = readdirSync(BANK_DIR).filter((name) => name.endsWith(".md")).sort();
  } catch {
    return { questions: [], problems: [] };
  }
  const questions: BankQuestion[] = [];
  const problems: string[] = [];
  for (const name of files) {
    const parsed = parseBank(readFileSync(join(BANK_DIR, name), "utf8"), `bank/${name}`);
    problems.push(...parsed.problems);
    for (const q of parsed.questions) {
      if (!only || only.has(`${q.skill}-${q.level}`)) questions.push(q);
    }
  }
  return { questions, problems };
}

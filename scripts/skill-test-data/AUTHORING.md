# Writing skill-test questions

The skill tests certify people. A wrong answer key does not just cost one
candidate a mark — it can fail someone who knew the material, or certify
someone who did not, and the certificate carries the site's name. So the bar
for a question here is higher than for practice content: **every key must be
provably right, and every distractor provably wrong.**

The bank is private. Questions are never shown outside a sitting, and the
answer key never leaves the server — not during a sitting, not in the
result. Do not copy questions from the public aptitude bank, the study-plan
quizzes, or anywhere on the web; write new ones.

## Files

`bank/<skill>-<level>[-<part>].md`, e.g. `bank/java-basic-1.md`. Several part
files per pool are fine (keep each under ~30 questions). The front matter names
the pool:

```markdown
---
skill: java
level: basic
---
```

Skills, and the topics each question must name, are in
`src/lib/skill-catalog.ts` (`SKILLS`). Levels: `basic`, `intermediate`.

## One question

````markdown
## java-basic-001
topic: strings
answer: B
run: java

What does this program print?

```java
public class Main {
    public static void main(String[] args) {
        String a = "hi";
        String b = "hi";
        System.out.println(a == b);
    }
}
```

- A: `false`
- B: `true`
- C: It does not compile.
- D: It throws a `NullPointerException`.

> String literals are interned: both variables refer to the same object in the
> string pool, so `==` (reference equality) is true. `new String("hi")` would
> have made it false.
````

- **`## <key>`** — `<skill>-<level>-NNN`, three digits, unique, and **never
  reused or renumbered** once seeded (answers are stored against it). Number
  part files on from where the last one stopped.
- **`topic:`** — a topic id from the catalogue.
- **`answer:`** — one letter, or several separated by commas for a
  multi-answer question (`answer: A, C`). A multi-answer prompt must contain
  the words **"Select all that apply"**; it is scored all-or-nothing.
- **`run:`** *(optional)* — `java`, `python`, `javascript`, `cpp`, `c`, `go`
  or `typescript`. Marks an output-prediction question (below).
- Then the prompt (Markdown; code in a fenced block with its language), the
  options as `- A: …` lines (3–6, on one line each, in order, no blank lines
  between), and the explanation as `> ` lines. Nothing else after the options.

## Output-prediction questions (`run:`)

The judge checks these: `npx tsx scripts/seed-skill-tests.ts --run --only java-basic`
runs the **first fenced block** of the prompt as a complete program and
requires its stdout to equal the keyed option exactly. So:

- The program is complete and self-contained. Java: `public class Main` with
  `main`. C and C++: `#include`s and `int main()`. Go: `package main` with
  `func main()`. Python, JavaScript and TypeScript: a script.
- It prints **one line**. Print several values on one line (`end=" "`,
  `print(a, b)`, `System.out.println(a + " " + b)`).
- The keyed option is that line as **one inline code span**: `` `3 4` ``.
  Write the other output options the same way; prose options ("It does not
  compile.", "It throws a `ClassCastException`.") are fine as distractors.
- No input (stdin is empty), no randomness, no time, no hash ordering that
  differs between runs (Python sets of strings, Java `HashMap` of
  user-defined keys), no reliance on undefined behaviour.
- Versions on the judge: Java 18, Python 3.11, Node 16, Clang 18 (`-std=c++20`, libstdc++). Keep C++ to what C++17 and C++20 agree on. Stay in
  what all mainstream versions agree on unless the question is *about* a
  version feature.
- **C** runs on Clang 14 as C17, on a 64-bit ARM machine: `int` is 4 bytes,
  `long` and pointers 8 — and **plain `char` is unsigned** there (it is
  signed on x86). Never let an answer depend on the signedness of plain
  `char`; write `signed char`/`unsigned char` when it matters. A question
  about sizes names the model it assumes ("on a 64-bit Linux system, where
  `int` is 4 bytes and `long` 8"). Never print a pointer's value or rely on
  anything the standard leaves undefined or unspecified (evaluation order
  of arguments, `i = i++`, signed overflow) — a question *about* undefined
  behaviour keys "the behaviour is undefined" and is not `run:`.
- **Go** is 1.19. Generics work; `min`/`max`/`clear` (1.21) and ranging over
  an int (1.22) do not. **A closure that captures a `for` loop variable sees
  one shared variable in 1.19 and a fresh one per iteration from 1.22** —
  the answer changed, so do not ask it at all. Map iteration order is random
  (never range over a map and print in that order); `fmt.Println` of a map
  sorts its keys, so that is fine.
- **TypeScript** is compiled by the judge's `tsc` with its defaults: target
  ES5 and **`strict` off**, with the library typings of about ES2019/ES2020.
  So a `run:` program must not iterate a `Map`, `Set`, string or generator
  with `for…of` or spread it (needs `--downlevelIteration`), use `#private`
  fields, `.at()`, `replaceAll` or `Object.hasOwn`. A question about what
  does or does not compile states its options — "with `strict: true`" —
  and is not `run:`; check its key locally with the real compiler:
  `node ../frontend/node_modules/typescript/bin/tsc --strict --noEmit --target es2022 --lib es2022 file.ts`
  (TypeScript 5.9). A question that depends on a 5.x-only feature says so.
- A question whose keyed answer is "It does not compile" or "It throws …"
  cannot be `run:` — leave `run:` off and make the explanation airtight.

Aim for **at least 40 %** `run:` questions in every language pool. They are
the questions a machine has proved.

## What makes a good question

- **One idea per question**, the one the topic names. Test understanding, not
  trivia: "what does this print" over "which year was it released".
- **Distractors are real mistakes** — what someone who half-knows the topic
  would pick (off-by-one, reference vs value, integer division, the default
  you forgot). Never joke options. Never "All of the above" / "None of the
  above".
- **Options are parallel** — same kind, similar length. The key must not be
  the longest, the most qualified, or the only one in code font.
- **Spread the keys.** Across a file, each letter should be the answer about
  equally often.
- **Basic** = what anyone who has written the language for a few months
  knows. **Intermediate** = what a developer using it at work knows: library
  behaviour, the object model, edge cases, performance.
- **No ambiguity.** If an expert could argue for two options, rewrite it. Name
  the version or dialect when it matters (SQL questions: assume standard SQL
  as MySQL 8 / PostgreSQL both run it, and say so when they differ — better,
  avoid what they differ on).
- SQL questions give the table(s) as a small Markdown table and ask what a
  query returns; the result options are written compactly (`` `(1, 'A'), (2, 'B')` ``).
- Never put `__CODEXA_` anywhere. Never write a `\u` escape sequence (the
  authoring tools decode them); write the character or avoid it.

## Theory pools (OOP, Operating Systems, Computer Networks)

These have no coding round, so the questions carry the whole credential.
Lean on **worked scenarios** over definitions: a process table and an
algorithm → the average waiting time; a reference string and three frames →
the page faults; an address and a mask → the network, broadcast and host
count; a class hierarchy → what it prints. Compute every such key twice —
by hand and with a throwaway script (Node is installed; nothing of it goes
in the file) — before writing it down. Where textbooks disagree on a term
(how many layers, what "aggregation" means), ask about the mechanism, not
the label, or name the convention ("in the five-layer TCP/IP model").
OOP questions may show code in Java, Python or C++ and be `run:` in that
language; aim for a third of the OOP pool to be judge-checked.

## The written guide (content/skill-tests/<slug>.md)

Every test also has a **public** page guide, in `backend/content/skill-tests/<slug>.md`
(read by `src/lib/skill-test-guides.ts`, shown on `/skill-tests/<slug>` and
written into its HTML for search). It is for a candidate deciding whether to
sit the test and how to get ready — never a leak of the bank.

```markdown
---
updated: 2026-10-03
question: What does the Java (Basic) skill test cover?
answer: <25–80 words: the direct answer a search result would quote>
q: <a question people actually ask about this test or skill>?
a: <12–90 words>
q: …?
a: …
---

<one or two opening paragraphs, no heading>

## <three to six "##" sections — e.g. who it is for, what each topic
examines (a bullet per topic, linking where to practise it), how to prepare,
what trips people up, what changes at Intermediate>

## Sample question
topic: strings
answer: B
run: java

<a question in exactly the bank grammar above>
```

- 450–1,400 words of prose before the sample; `##` and `###` headings only.
- Three to six `q:`/`a:` pairs, each a real question ("Do I need to know
  generics for the Java Basic test?"), not a restatement of the facts table
  (time, pass mark and validity are printed from the test itself).
- Links only to pages that exist: `/study-plans/{java,javascript,cpp,python}`,
  `/challenges/<topic-hub>`, `/aptitude/<topic>`, `/roadmap/<lesson>`,
  `/skill-tests/<slug>` and the index pages. The seeder checks every one.
- **The sample question is written for the page** and must not be, or
  paraphrase, a bank question. It is shown with its answer and explanation.
  If it is `run:`, `--run` checks it with the bank.
- Plain, specific prose in the site's voice: say what the test examines and
  what a candidate should be able to do, with concrete examples ("predict
  what `"5" + 3 - 1` evaluates to and why"). No hype, no invented statistics,
  no claims about employers.

## Checking your work

```bash
npx tsx scripts/seed-skill-tests.ts --validate --only java-basic   # structure, topics, keys, duplicates
npx tsx scripts/seed-skill-tests.ts --run --only java-basic        # runs every run: question on the judge
```

Both must pass clean. Then read every non-`run:` question once more as a
candidate would, and solve it without looking at the key.

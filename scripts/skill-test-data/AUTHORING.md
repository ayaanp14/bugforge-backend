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
- **`run:`** *(optional)* — `java`, `python`, `javascript` or `cpp`. Marks an
  output-prediction question (below).
- Then the prompt (Markdown; code in a fenced block with its language), the
  options as `- A: …` lines (3–6, on one line each, in order, no blank lines
  between), and the explanation as `> ` lines. Nothing else after the options.

## Output-prediction questions (`run:`)

The judge checks these: `npx tsx scripts/seed-skill-tests.ts --run --only java-basic`
runs the **first fenced block** of the prompt as a complete program and
requires its stdout to equal the keyed option exactly. So:

- The program is complete and self-contained. Java: `public class Main` with
  `main`. C++: `#include`s and `int main()`. Python and JavaScript: a script.
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

## Checking your work

```bash
npx tsx scripts/seed-skill-tests.ts --validate --only java-basic   # structure, topics, keys, duplicates
npx tsx scripts/seed-skill-tests.ts --run --only java-basic        # runs every run: question on the judge
```

Both must pass clean. Then read every non-`run:` question once more as a
candidate would, and solve it without looking at the key.

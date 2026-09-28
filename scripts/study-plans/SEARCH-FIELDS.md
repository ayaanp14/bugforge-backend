# Search fields for study-plan lessons

Every lesson page is public and indexed. What a search engine ranks it for
is decided mostly by five fields in the lesson's frontmatter — the format
is `LessonSeo` in `dsl.ts`, the rules are `seoProblems` there, and
`npx tsx scripts/seed-study-plans.ts --validate --track <key> --only <module-slug>`
is the gate. This file is how to write them well.

```
---
title: JDK, JRE and JVM — the three layers
minutes: 14
seo-title: What Is the JVM? JDK vs JRE vs JVM Explained
description: The JVM runs Java bytecode, the JRE adds the class library, and the JDK adds javac and the developer tools. How the three nest, and the JVM's memory areas.
question: What is the JVM?
answer: The Java Virtual Machine (JVM) is the program that runs Java bytecode. It loads `.class` files, verifies them, …
q: What is the difference between JDK, JRE and JVM?
a: They are nested layers. The JVM executes bytecode; the JRE is …
q: …
a: …
---
```

Where each one shows up:

| Field | On the page | In search |
| --- | --- | --- |
| `title` (unchanged) | the H1 | — |
| `seo-title` | — | the `<title>` (" — CodeKairo" is appended) and the blue link |
| `description` | — | the meta description, the snippet under the link |
| `question` + `answer` | under the H1, as a "Quick answer" block | the paragraph a featured snippet or AI answer quotes |
| `q` + `a` pairs | after the text, as "Common questions" | FAQPage structured data; "People also ask" |

## The rule behind all of them

Write for the person who has **not** found the lesson yet. Ask: what would
someone type into Google that this lesson answers better than anything
else? "what is the jvm", "jdk vs jre", "java string immutable why",
"python list comprehension", "javascript event loop explained",
"c++ rvalue reference". Those words go in the title, the question and the
first sentence of the answer — in that form, not paraphrased.

Every answer must be **true and consistent with the lesson**. Prefer facts
the lesson teaches; a short piece of widely known context is fine; never
invent a number, version, benchmark or API. When in doubt, leave it out.

## `seo-title` — 20 to 62 characters, plain text

- Lead with the main query. Concept lessons: `What Is X? …`. Comparisons:
  `X vs Y in Java: …`. How-to lessons: `How to X in Python: …`. Topic
  lessons: `Java Generics Explained: Bounded Types and Wildcards`.
- Name the language unless the term already implies it (JVM, npm, STL,
  pip, GIL): "Python Decorators Explained", not "Decorators Explained" —
  four tracks teach similar topics and every title must be unique across
  all of them.
- Title Case. No brand, no "Lesson", no "Tutorial #5", no Markdown, no
  angle brackets (`List<T>` → "Generic Lists").
- Add a second keyword after a colon or "and" when there is room: the
  thing people also search with it.

## `description` — 110 to 160 characters, plain text

One or two sentences: the answer in brief, then what else the page
covers. Include the main keyword once, naturally. No "In this lesson you
will learn", no "Learn about" — state the facts.

## `question` and `answer` — required on a lesson

- `question`: the main query, phrased the way people ask it: "What is the
  JVM?", "How does the JavaScript event loop work?", "What is a pointer in
  C++?".
- `answer`: 30–80 words (aim for 40–60), a self-contained paragraph. The
  first sentence answers the question outright and names the term in full
  ("The Java Virtual Machine (JVM) is …"). The rest adds the two or three
  facts a reader needs next. It must read well out of context — a search
  engine will quote it alone. No "this lesson", no "as we saw".

## `q` / `a` — three to six pairs on a lesson, up to six on a checkpoint

- The questions people search around the topic: "difference between",
  "why does", "when should I use", "how do I", the classic error message,
  the interview question. Not the main question again.
- 12–90 words each (aim for 25–50). The first sentence is the answer; the
  rest is the reason or the example in words.
- Inline code in backticks is fine here (`` `nextLine()` ``); keep code
  blocks out — one line per value.

## Checkpoints (`kind: "test"`)

`seo-title` and `description` are required; `question`/`answer` are
optional and usually left out. Title them as practice:
`Java Basics Quiz: JVM, javac and Console I/O Practice Test`. The
checkpoint's own "make sure you can answer" list is the best source of
two or three `q`/`a` pairs.

## Mechanics

- One `key: value` per line, after `minutes:` and before the closing
  `---`. Keys are exactly `seo-title`, `description`, `question`,
  `answer`, `q`, `a`; anything else is refused.
- Never edit the body while adding these.
- No backslashes. If a value must show a Unicode escape, see
  `fix-escapes.mjs`.
- Search titles and descriptions are checked for uniqueness across every
  track; the validator names the lesson that already has yours.

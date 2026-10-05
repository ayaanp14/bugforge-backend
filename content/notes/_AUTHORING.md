# Writing a CS note

CS notes are the reading behind the four "after the coding round" subjects of
placement and technical interviews: **Operating Systems**, **Computer
Networks**, **DBMS** and **OOP**. One Markdown file per topic in
`content/notes/<subject>/<slug>.md`, served at `/notes/<subject>/<slug>` to
everyone (signed in or not) and indexed by search engines. Files whose name
starts with `_` (this one) are not notes. Subjects (folder names) are fixed:
`operating-systems`, `computer-networks`, `dbms`, `oop`.

The rules are enforced by `src/lib/cs-notes.ts` and the gate:

```
npx tsx scripts/cs-notes.ts --validate --subject dbms              # structure, lengths, links
npx tsx scripts/cs-notes.ts --validate --only normalization         # one note
npx tsx scripts/cs-notes.ts --run --subject oop --workers 2         # every code group on the judge
npx tsx scripts/cs-notes.ts --list                                   # notes, words, figures per subject
```

A note is done when `--validate` passes for it and, if it has code groups,
`--run` passes too.

## Who reads it

A final-year student two days before a placement drive, or someone who
searched "deadlock in OS", "what is normalization in DBMS", "difference
between TCP and UDP" or "polymorphism in OOP with example". They need the
definition they can say out loud in an interview, how the thing actually
works, one worked example they can reproduce on paper, the comparisons
interviewers love ("process vs thread", "paging vs segmentation"), and the
traps. The page should be the best answer on the web for its topic: more
exact than the tutorial sites, shorter than a textbook, and correct.

**Correctness is the bar.** Every number in a worked example is computed
(the Gantt chart's waiting times add up, the subnet's host count is
2^h − 2, the 3NF decomposition is lossless). Say what is standard and what
varies by system ("Linux's CFS does X; the textbook model is Y"). Never
invent statistics, quotes, company names or "asked at X" claims.

## Frontmatter

Between `---` lines, one `key: value` per line, no quotes, no line breaks
inside a value:

| Key | Rule |
| --- | --- |
| `title` | The note's name as the H1 shows it ("CPU Scheduling Algorithms"). Unique across all notes, under 70 characters. |
| `order` | 1, 2, 3 … within the subject — the reading order. |
| `minutes` | Honest reading time: about 200 words a minute plus time for tables and examples (3–30). |
| `level` | `beginner`, `intermediate` or `advanced`. |
| `updated` | `2026-10-05` for this first edition. |
| `seo-title` | 25–60 characters. Leads with the term people search ("CPU Scheduling in OS: FCFS, SJF, Round Robin"). Unique. |
| `description` | 110–158 characters. What the reader learns. Unique. |
| `question` | The question the page answers ("What is CPU scheduling in an operating system?"). Ends with "?". |
| `answer` | 25–80 words (aim for 45–65), one paragraph: the direct answer a search result could quote. |
| `q` / `a` | Four to eight pairs (aim for five or six) of real questions people ask about the topic. Each `q` ends with "?"; each `a` is 12–90 words, two to four sentences, one line. |

## Body

**Figures carry what a picture says better** (since 2026-10-05, the owner's
standing call for teaching pages: "show less content and describe more
through graphics"). A Gantt chart, a handshake, a stack of layers, a class
diagram, a B+ tree splitting — draw it, and let the prose say what no
picture can: the definition to say out loud, why it works, when it fails,
the comparison. Never write a paragraph that narrates what a figure already
shows; the figure's own sentences carry its steps.

Markdown after the frontmatter: **800–2,200 words of prose** (aim for
1,100–1,800; code, figures, tables' pipes and frontmatter do not count), at
least **three figures** (aim for three to six), at least **five `##`
sections**, one of which is exactly `## Interview questions`. Never a `# `
heading — the page has its own H1. No raw HTML.

A shape that works for almost every topic:

1. An opening paragraph (no heading): what the thing is and why it exists, in plain words, in three or four sentences.
2. `## <The core idea>` — the definition, then how it works, as short paragraphs and lists.
3. Sections for the parts of the topic (each scheduling algorithm, each normal form, each OSI layer…). Use `###` under a `##` when a section has parts.
4. `## Worked example` (or examples inside the sections) — a small concrete input worked step by step, with a table. This is what interviewers ask you to do on paper; never skip it where the topic has one (scheduling, page replacement, Banker's algorithm, subnetting, normalization, B+ tree insertion…).
5. `## <A> vs <B>` — the comparisons as a table (rows = aspects, columns = the things compared).
6. `## Common mistakes` — four to six traps, one line each.
7. `## Interview questions` — six to ten questions an interviewer actually asks on this topic, each as a bold question followed by a two-to-four-sentence answer. (These are different from the frontmatter `q`/`a` pairs, which are the search-result FAQ; overlap a little at most.)
8. A last line linking onward: the next note in the subject, and the subject's skill test.

**Tables** are for what a reader copies onto paper: comparisons (rows =
aspects), a worked example's results (each process's waiting time, the
fault count per algorithm, a subnet's ranges, a closure) and summaries.
Keep cells short. A trace that changes step by step — frames filling, a
Gantt chart growing, a tree splitting — is an animation, not a table.

### Figures

A line holding only `@figure <name>`, with a blank line before and after,
places one of the note's own figures. They are written in TypeScript in
`src/lib/note-figures/<slug>.ts`, which exports `FIGURES: Record<name, () =>
Walkthrough>` (registered in `registry.ts`) — the roadmap lessons' figure
model, limits and renderer, so `content/roadmap/_AUTHORING.md` (Figures)
holds for notes too:

- **A diagram is one frame** (a layout, a shape: the OSI stack, a class diagram, an ER diagram); **an animation is 2–16 frames** with the player's controls (every dry run: a scheduler, page frames over a reference string, a B+ tree insertion, a handshake step by step).
- `title` ≤ 90 characters; `input` is the example as text or `""`; each `caption` is 30–340 characters of plain text, one or two sentences, never repeated.
- **Every value drawn is computed by running the thing it shows** — the generator runs the scheduler, the replacement policy, the subnet arithmetic, the closure, the CRC division, and records frames; nothing the code could get wrong is typed in. A mark on an answer is checked against the data (throw if it is wrong).
- At most **600 wide** (aim for 360–520 so labels stay readable on a phone) and **440 tall**; text items ≤ 70 characters. Tones carry meaning: `accent` what the step is about, `strong` the answer or the settled part, `muted` what is out of play, `error` only a rejected candidate or a failure. No other colours.
- Helpers: the walkthrough core (`row`, `under`, `over`, `bandOver`, `spanOver`, `link`, `treeLayout`, `ring`), the lessons' kit (`src/lib/lesson-figures/kit.ts`: `box`, `label`, `arrow`, `region`, `column`, `bars`, `chain`, `binaryTree`, `graph`, `grid`, `chart`), and the notes' kit (`src/lib/note-figures/kit.ts`): `gantt` (a scheduler's timeline), `lifelines` + `message` (a sequence diagram: a handshake, a lookup, two transactions), `classBox` + `umlLink` (UML classes; inherits/implements/composes/aggregates/associates/depends), `entity`/`relation`/`attribute` with `boxRim`/`diamondRim`/`ovalRim` (ER diagrams), `oval`, `diamond`, `lines` (left-aligned text: code, a header's fields).
- An ASCII sketch in a `text` fence (a Gantt row, a layer stack, a timeline, a tree) is a figure now; `text` stays for pseudocode and the odd literal layout.

Preview every figure while writing it, and look at the pictures:

```
npx tsx scripts/preview-walkthroughs.ts --note <slug> --png           # scratch/note-figures/<slug>/*.png + complaints
npx tsx scripts/preview-walkthroughs.ts --note <slug> --png --dark    # the dark theme
```

`--validate` runs every placed figure through the same checks, and
`npm test` (`note-figures.test.ts`) holds every figure placed, deterministic
and small: ≤ 6 KB gzipped each, ≤ 24 KB a note.

### Code

Two kinds of code block:

- **Code groups** — a runnable program, shown in tabs, run by the gate.
  Consecutive fences in this order, any subset but each at most once:
  ` ```cpp `, ` ```java `, ` ```python `, ` ```javascript `, then an
  ` ```output ` fence holding exactly what each program prints (all of them
  print the same). Whole programs with a `main`; the Java class is `Main`
  (no `package`); no input is read (stdin is empty); deterministic output
  (no addresses, no hash ordering, no timing, no threads racing). Judge
  runtimes: Clang (C++17), OpenJDK 18, CPython 3.11, Node 16 — Java may use
  records/switch expressions, JavaScript may use `??`/`?.`/classes, but not
  `structuredClone`/`toSorted`/`findLast`. ≤ 80 lines each.
  **OOP notes need at least one code group per note** in `cpp`, `java` and
  `python` (add `javascript` where it is natural). OS notes may use a code
  group when a concept simulates well (a scheduler, a page-replacement
  simulation, Banker's safety check).
- **Display-only fences** — not run, shown with a label: ` ```c ` (system
  calls the judge cannot run: `fork()`, `pthread`, sockets), ` ```sql `,
  ` ```text ` (pseudocode, a literal layout — a diagram is a figure), ` ```bash `, ` ```http `,
  ` ```json `. Keep them short and correct.

### Links

Plain Markdown links to site paths, never full URLs:

- other notes: `/notes/<subject>/<slug>` (the gate checks they exist, so only link to notes that are in the folder);
- the subject page: `/notes/<subject>`;
- skill tests: `/skill-tests/os-basic`, `/skill-tests/os-intermediate`, `/skill-tests/networks-basic`, `/skill-tests/networks-intermediate`, `/skill-tests/sql-basic`, `/skill-tests/sql-intermediate`, `/skill-tests/oop-basic`, `/skill-tests/oop-intermediate`;
- coding problems `/problems/<slug>` and roadmap lessons `/roadmap/<slug>` where one genuinely helps (the gate checks them).

## Voice

Plain, exact and warm. Short sentences. Second person ("you") is fine.
British/Indian English spelling is fine but be consistent within a note. No
filler ("In today's world…", "Let's dive in"), no emojis, no exclamation
marks, no "In conclusion". Define a term the first time it appears. Prefer a
table or a worked example over a paragraph of description.

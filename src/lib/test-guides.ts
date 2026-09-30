/**
 * A written preparation guide for each placement mock-test pattern, keyed by
 * the pattern's slug in scripts/mock-test-data/index.ts.
 *
 * Why this exists: a pattern page (/tests/<slug>) was a mock-test landing
 * page and little else — the section table and the instructions — while a
 * search for "Accenture cognitive assessment pattern" is answered by written
 * guides. Each guide is shown under its pattern's mock test and written into
 * the page's HTML, so a reader and a crawler get the same words.
 *
 * Every fact here is restated from that pattern's blueprint and its
 * sourceNote: section order, question counts, minutes, marking, sectional
 * timing, what the paper leaves out and how firm the numbers are. Where a
 * guide quotes a cut-off or a real-test detail, the blueprint already
 * carries it as reported; nothing is added about salaries, eligibility,
 * dates or how a company hires today. When a blueprint changes, change its
 * guide with it. The pacing figures (seconds a question, break-even
 * confidence under negative marking) are arithmetic on the blueprint's
 * numbers — Tech Mahindra's −0.25 breaks even at one-in-five, Goldman
 * Sachs's −0.4 at two-in-seven.
 *
 * Links go only to pages that exist: aptitude topics (APTITUDE_TOPICS in
 * lib/aptitude-topics.ts), topic hubs (TOPIC_HUBS in lib/problem-topics.ts),
 * the four study plans, the roadmap and other patterns. The Markdown stays
 * within what lib/markdown-html.ts renders — paragraphs, lists, bold, links
 * and "###" subsections, never a higher heading, since the page has its own
 * title. The text is flush left inside each template literal because four
 * leading spaces would make a Markdown code block.
 */
export const TEST_GUIDES: Readonly<Record<string, string>> = {
  "tcs-nqt-foundation": `A guide to the Foundation section of the TCS National Qualifier Test (NQT), the aptitude gate that every candidate has to clear before any track opens.

### What the paper looks like

The Foundation paper has three sections, sat in a fixed order: Numerical Ability, 20 questions in 25 minutes; Verbal Ability, 25 questions in 25 minutes; and Reasoning Ability, 20 questions in 25 minutes. That makes 65 questions in 75 minutes. Every question is worth one mark, and there is no negative marking. Each section runs on its own clock, and once you leave a section you cannot go back to it. The real test is stricter still and stops you returning to a previous question; this mock lets you move around within the section you are in. The paper is not adaptive. It works as an elimination gate: fail it and no track opens, however well the Advanced section goes.

### How to prepare, section by section

- **Numerical Ability** is mostly arithmetic with some data interpretation. Drill [Percentages](/aptitude/percentages), [Profit & Loss](/aptitude/profit-and-loss), [Ratio & Proportion](/aptitude/ratio-and-proportion), [Time & Work](/aptitude/time-and-work), [Time, Speed & Distance](/aptitude/time-speed-distance) and [Number System](/aptitude/number-system), then practise pulling figures out of [Tables & Charts](/aptitude/tables-and-charts).
- **Verbal Ability** gives you a minute a question, so grammar has to be automatic. Work through [Sentence Correction](/aptitude/sentence-correction), [Fill in the Blanks & Para Jumbles](/aptitude/sentence-completion), [Synonyms & Antonyms](/aptitude/vocabulary) and [Reading Comprehension](/aptitude/reading-comprehension).
- **Reasoning Ability** draws half its questions from [Number & Letter Series](/aptitude/number-series), [Coding & Decoding](/aptitude/coding-decoding), [Blood Relations](/aptitude/blood-relations) and [Direction Sense](/aptitude/direction-sense), and the other half from [Syllogisms](/aptitude/syllogisms), [Seating & Puzzles](/aptitude/seating-arrangement), [Analogies & Classification](/aptitude/analogies-classification) and [Mathematical Reasoning](/aptitude/mathematical-reasoning).

The real NQT continues into an Advanced section and a coding round. The [Foundation + Advanced](/tests/tcs-nqt-full) and [Advanced Coding](/tests/tcs-nqt-advanced-coding) mocks cover those.

### On the day

With no negative marking, answer every question: a blank is the only answer certain to score nothing. The real test does not let you return to an earlier question, so practise the habit it demands and give every question an answer before you move on, guessing if you have to, even though this mock would let you go back. Numerical Ability is the tightest section at 75 seconds a question; if a calculation is still going after two minutes, pick the likeliest option and move. Unused minutes do not carry over to the next section, so there is nothing to gain by racing: a steady pace that uses the whole 25 minutes beats a fast one that leaves time on the clock.

This mock is modelled on the published Foundation pattern, which several prep portals agree on at 20, 25 and 20 questions of 25 minutes each; CodeKairo is not affiliated with TCS.`,

  "tcs-nqt-full": `A guide to the full aptitude half of the TCS National Qualifier Test: the Foundation gate plus the Advanced questions that separate the Ninja, Digital and Prime tracks.

### What the paper looks like

Five sections, sat in a fixed order: Numerical Ability, 20 questions in 25 minutes; Verbal Ability, 25 questions in 25 minutes; Reasoning Ability, 20 questions in 25 minutes; Advanced Quantitative Ability, 10 questions in 17 minutes; and Advanced Reasoning Ability, 5 questions in 8 minutes. That is 80 questions in 100 minutes. Every question is worth one mark and there is no negative marking. Each section runs on its own clock and closes when you leave it. In the real test the two Advanced sections share one 25-minute window; here that window is split so each has its own clock. The paper is not adaptive. The first three sections are the Foundation gate. The fifteen Advanced questions are harder, and sources report steep thresholds on them: roughly 9 to 12 of 15 for Digital and 12 to 15 for Prime.

### How to prepare, section by section

- **The Foundation sections.** Numerical Ability is arithmetic with a little data interpretation: [Percentages](/aptitude/percentages), [Ratio & Proportion](/aptitude/ratio-and-proportion), [Time & Work](/aptitude/time-and-work), [Time, Speed & Distance](/aptitude/time-speed-distance) and [Tables & Charts](/aptitude/tables-and-charts). Verbal Ability is [Sentence Correction](/aptitude/sentence-correction), [Fill in the Blanks & Para Jumbles](/aptitude/sentence-completion), [Synonyms & Antonyms](/aptitude/vocabulary) and [Reading Comprehension](/aptitude/reading-comprehension). Reasoning weights [Number & Letter Series](/aptitude/number-series), [Coding & Decoding](/aptitude/coding-decoding), [Blood Relations](/aptitude/blood-relations) and [Syllogisms](/aptitude/syllogisms).
- **Advanced Quantitative Ability** is mostly hard questions: harder arithmetic and algebra, with geometry and trigonometry in range. Go deeper on [Number System](/aptitude/number-system), [Permutations & Combinations](/aptitude/permutations-combinations), [Probability](/aptitude/probability), [Mixtures & Alligation](/aptitude/mixtures-alligation) and [Mensuration](/aptitude/mensuration).
- **Advanced Reasoning Ability** is four hard logic questions and one medium. [Seating & Puzzles](/aptitude/seating-arrangement) and [Mathematical Reasoning](/aptitude/mathematical-reasoning) are the topics that reward a drawn diagram and a settled method.

The ninety-minute coding round is not part of this paper; sit it separately as the [Advanced Coding](/tests/tcs-nqt-advanced-coding) mock.

### On the day

There is no negative marking, so leave nothing blank in any section. The Foundation sections allow 60 to 75 seconds a question. The Advanced sections give about 100 seconds a question for questions that take longer, and each is one of only fifteen that separate the tracks, so work the ones you can finish carefully rather than skimming all of them, then guess the rest before the clock closes the section. Leaving a Foundation section early saves nothing for the Advanced ones, since minutes do not carry over.

This mock is modelled on the published NQT pattern, with well-corroborated Foundation counts and an Advanced split taken from two prep portals; CodeKairo is not affiliated with TCS.`,

  "infosys-systems-engineer": `A guide to the Infosys Systems Engineer aptitude paper, which has to be respected section by section because each section is judged on its own.

### What the paper looks like

Five sections, sat in a fixed order: Mathematical Ability, 10 questions in 35 minutes; Logical Reasoning, 15 questions in 25 minutes; Verbal Ability, 20 questions in 20 minutes; Pseudocode, 5 questions in 10 minutes; and Puzzle Solving, 4 questions in 10 minutes. That is 54 questions in 100 minutes. There is no negative marking. In this mock every question is worth one mark; in the real paper Pseudocode is reported to carry double marks per question. Each section has its own clock and closes when you leave it. The paper is not adaptive. Every section carries its own percentile cut-off with no compensation between them, so clearing four sections and failing one ends the attempt.

### How to prepare, section by section

- **Mathematical Ability** is ten hard questions meant to take about three minutes each, mostly quantitative with two on data interpretation. Work the harder questions in [Number System](/aptitude/number-system), [Permutations & Combinations](/aptitude/permutations-combinations), [Probability](/aptitude/probability), [Time, Speed & Distance](/aptitude/time-speed-distance) and [Mixtures & Alligation](/aptitude/mixtures-alligation), and practise [Tables & Charts](/aptitude/tables-and-charts) and [Caselets](/aptitude/caselets).
- **Logical Reasoning** splits between [Number & Letter Series](/aptitude/number-series), [Coding & Decoding](/aptitude/coding-decoding), [Blood Relations](/aptitude/blood-relations) and [Direction Sense](/aptitude/direction-sense), and the deduction topics such as [Syllogisms](/aptitude/syllogisms) and [Analogies & Classification](/aptitude/analogies-classification).
- **Verbal Ability** is a minute a question: [Sentence Correction](/aptitude/sentence-correction), [Fill in the Blanks & Para Jumbles](/aptitude/sentence-completion), [Synonyms & Antonyms](/aptitude/vocabulary) and [Reading Comprehension](/aptitude/reading-comprehension).
- **Pseudocode** is C-flavoured: trace it and give the output, or say what it computes. Drill [Pseudocode](/aptitude/pseudocode) and [Programming Fundamentals](/aptitude/programming-fundamentals); the early modules of the [C++ study plan](/study-plans/cpp) cover the C-style syntax it borrows.
- **Puzzle Solving** is two hard constraint puzzles from [Seating & Puzzles](/aptitude/seating-arrangement) and two from [Mathematical Reasoning](/aptitude/mathematical-reasoning).

The coding route is a different test with its own mock: [Infosys SP / DSE — Coding](/tests/infosys-specialist-programmer).

### On the day

With no negative marking, answer every question in every section. The cut-offs shape the pacing more than the clock does: each section's time is its own, so the risk is not running out of time overall but letting one section slide. Treat each as a pass-or-fail paper in its own right. Mathematical Ability gives three and a half minutes a question, so work each one fully rather than guessing early. Puzzle Solving gives two and a half minutes a puzzle: draw the grid first and fill in every fixed clue before you read the options.

This mock is modelled on the published pattern, whose section counts three prep portals give identically, without the optional English writing task; CodeKairo is not affiliated with Infosys.`,

  "wipro-nlth-aptitude": `A guide to the aptitude block of Wipro's National Level Talent Hunt (NLTH), the quickest services paper in this catalogue at under a minute a question.

### What the paper looks like

Three sections, sat in a fixed order: Quantitative Ability, 16 questions in 16 minutes; Logical Ability, 14 questions in 18 minutes; and English Ability, 22 questions in 14 minutes. That is 52 questions in 48 minutes. Each question is worth one mark and there is no negative marking in the aptitude block. Each section is timed separately and closes when you leave it, so nothing can be revisited. The paper is not adaptive. The real NLTH also has a written communication essay and a two-problem coding round; neither is part of this paper. Of every pattern here this one has the least certain question counts: the 48-minute window and the three sections are agreed everywhere, but four different totals circulate, and this split was chosen because its section timings add up to exactly 48 minutes.

### How to prepare, section by section

- **Quantitative Ability** is a minute a question, mostly arithmetic with a little data interpretation. Speed comes from [Percentages](/aptitude/percentages), [Ratio & Proportion](/aptitude/ratio-and-proportion), [Averages](/aptitude/averages), [Profit & Loss](/aptitude/profit-and-loss), [Time & Work](/aptitude/time-and-work) and [Simple & Compound Interest](/aptitude/interest), plus quick reads of [Tables & Charts](/aptitude/tables-and-charts).
- **Logical Ability** has the most time per question. Half the draw is [Number & Letter Series](/aptitude/number-series), [Coding & Decoding](/aptitude/coding-decoding), [Blood Relations](/aptitude/blood-relations) and [Direction Sense](/aptitude/direction-sense); the rest is [Syllogisms](/aptitude/syllogisms), [Seating & Puzzles](/aptitude/seating-arrangement), [Analogies & Classification](/aptitude/analogies-classification) and [Mathematical Reasoning](/aptitude/mathematical-reasoning).
- **English Ability** is the largest section with the least time. [Sentence Correction](/aptitude/sentence-correction), [Synonyms & Antonyms](/aptitude/vocabulary) and [Fill in the Blanks & Para Jumbles](/aptitude/sentence-completion) should be answerable in seconds, which leaves time for [Reading Comprehension](/aptitude/reading-comprehension).

The coding round has its own mock: [Wipro NLTH — Programming](/tests/wipro-nlth-programming).

### On the day

There is no negative marking, so every question gets an answer. English Ability allows about 38 seconds a question: read the question before the passage, answer the grammar and vocabulary items first, and guess anything still blank before the clock closes the section. Quantitative Ability allows a minute each; if a question has not given way in that time, mark your best option and move on. Logical Ability is the only section with slack, at about 77 seconds a question, so it is where a seating puzzle can be drawn out properly. Unused minutes do not carry over, so there is no reward for leaving a section early.

This mock is modelled on a published NLTH pattern whose section timings sum to the agreed 48 minutes, though the question counts remain disputed; CodeKairo is not affiliated with Wipro.`,

  "accenture-cognitive-technical": `A guide to the Accenture Cognitive and Technical Assessment pattern, which runs on a single clock and so rewards a different approach from most placement papers.

### What the paper looks like

Five sections: Verbal Ability, 17 questions; Reasoning Ability, 18 questions; Numerical Ability, 15 questions; Pseudo Code, 18 questions; and Networking, Security & Cloud, 10 questions. That is 78 questions on one 78-minute clock, budgeted at a minute a question (17, 18, 15, 18 and 10 minutes). There is no per-section timer: you may move between sections freely and return to any of them until the clock runs out. Each question is worth one mark and there is no negative marking. The paper is not adaptive. Pseudo Code is the largest single block, bigger than any of the three cognitive sections. The real paper also has a twelve-question Common Applications and MS Office block on a 90-minute clock; this mock omits that block and reduces the time to match. The coding round and the AI-graded communication assessment are not part of it.

### How to prepare, section by section

- **Verbal Ability.** [Sentence Correction](/aptitude/sentence-correction), [Fill in the Blanks & Para Jumbles](/aptitude/sentence-completion), [Synonyms & Antonyms](/aptitude/vocabulary) and [Reading Comprehension](/aptitude/reading-comprehension).
- **Reasoning Ability.** The draw leans on [Number & Letter Series](/aptitude/number-series), [Coding & Decoding](/aptitude/coding-decoding), [Blood Relations](/aptitude/blood-relations) and [Direction Sense](/aptitude/direction-sense), with [Syllogisms](/aptitude/syllogisms), [Seating & Puzzles](/aptitude/seating-arrangement) and [Mathematical Reasoning](/aptitude/mathematical-reasoning) making up the rest.
- **Numerical Ability.** Arithmetic with some data interpretation: [Percentages](/aptitude/percentages), [Profit & Loss](/aptitude/profit-and-loss), [Ratio & Proportion](/aptitude/ratio-and-proportion), [Time & Work](/aptitude/time-and-work) and [Tables & Charts](/aptitude/tables-and-charts).
- **Pseudo Code.** Twelve questions of [Pseudocode](/aptitude/pseudocode) tracing and six of [Programming Fundamentals](/aptitude/programming-fundamentals). Practise tracing loops and recursion by hand with a table of variable values. If operators and control flow are shaky, the early modules of the [C++](/study-plans/cpp), [Java](/study-plans/java) or [Python](/study-plans/python) study plan cover them.
- **Networking, Security & Cloud.** This mock draws the block from [OS, DBMS & Networks](/aptitude/os-dbms-networks); concentrate on its networking questions, such as the OSI layers.

### On the day

The single clock is what matters. Make a first pass through every section answering only what you can do quickly, then come back for the longer questions; with free movement there is no reason to sit stuck in one section while easy marks wait in another. Pseudo Code questions take longer than they look, so give them a fair share of the second pass rather than the last few minutes. With no negative marking, keep the final two minutes for putting an answer against every blank question, in every section.

This mock is modelled on the well-documented Pattern A of the Accenture assessment, less the MS Office block, not on the newer game-based pattern; CodeKairo is not affiliated with Accenture.`,

  "cognizant-genc-aptitude": `A guide to the aptitude round of the Cognizant GenC assessment, a long paper in which reasoning outweighs everything else.

### What the paper looks like

Three sections, sat in a fixed order: Numerical Ability, 25 questions in 35 minutes; Logical Reasoning, 35 questions in 45 minutes; and Verbal Ability, 20 questions in 20 minutes. That is 80 questions in 100 minutes. Each question is worth one mark, so Logical Reasoning, the largest section, carries the most marks. There is no negative marking. Each section has its own clock and closes when you leave it, so a section cannot be revisited. The paper is not adaptive. The communication assessment that comes before it and the technical round that follows are not part of this paper.

### How to prepare, section by section

- **Numerical Ability** is arithmetic with a share of data interpretation. Cover [Percentages](/aptitude/percentages), [Profit & Loss](/aptitude/profit-and-loss), [Ratio & Proportion](/aptitude/ratio-and-proportion), [Averages](/aptitude/averages), [Time & Work](/aptitude/time-and-work), [Time, Speed & Distance](/aptitude/time-speed-distance) and [Simple & Compound Interest](/aptitude/interest), and practise [Tables & Charts](/aptitude/tables-and-charts) and [Caselets](/aptitude/caselets) for the data questions.
- **Logical Reasoning** deserves the largest share of your preparation. Half its questions come from [Number & Letter Series](/aptitude/number-series), [Coding & Decoding](/aptitude/coding-decoding), [Blood Relations](/aptitude/blood-relations) and [Direction Sense](/aptitude/direction-sense), topics where a practised method makes each question quick. The other half comes from [Syllogisms](/aptitude/syllogisms), [Seating & Puzzles](/aptitude/seating-arrangement), [Analogies & Classification](/aptitude/analogies-classification) and [Mathematical Reasoning](/aptitude/mathematical-reasoning), where drawing the arrangement or the Venn diagram is what saves time.
- **Verbal Ability** is a minute a question: [Sentence Correction](/aptitude/sentence-correction), [Fill in the Blanks & Para Jumbles](/aptitude/sentence-completion), [Synonyms & Antonyms](/aptitude/vocabulary) and [Reading Comprehension](/aptitude/reading-comprehension).

### On the day

No negative marking means every question should carry an answer when its section closes. Numerical Ability allows 84 seconds a question and Logical Reasoning about 77, so neither is a sprint, but forty-five minutes of reasoning is long: take the series and coding questions at speed to leave time for the arrangements. Verbal Ability comes last, when you are tired, and allows only a minute each, so answer the grammar items first and the passages after. A section's unused minutes are lost when you leave it, so spend them checking your doubtful answers rather than moving on early.

This mock is modelled on one published GenC breakdown whose section timings are internally consistent, although the overall shape is contested and several incompatible patterns circulate, one replacing reasoning with game-based tasks; CodeKairo is not affiliated with Cognizant.`,

  "capgemini-technical-english": `A guide to the Capgemini Technical and English paper, which is gated section by section: each part has to be cleared on its own.

### What the paper looks like

Two sections, sat in order: Technical MCQs & Pseudocode, 40 questions in 45 minutes, and English Communication, 30 questions in 30 minutes. That is 70 questions in 75 minutes. Each question is worth one mark and there is no negative marking. Each section has its own clock and closes when you leave it. The paper is not adaptive. Each section has its own cut-off, reported at 60–65 per cent for the technical block and 65 per cent for English, and you must clear one to reach the next. The game-based cognitive round, the behavioural inventory and the coding round are not part of this paper.

### How to prepare, section by section

- **Technical MCQs & Pseudocode** draws ten pseudocode questions, twelve on programming fundamentals, ten on data structures and eight on OS, DBMS and networks. Start with [Programming Fundamentals](/aptitude/programming-fundamentals) and [Pseudocode](/aptitude/pseudocode), which together make up more than half the section, then [Data Structures & Algorithms](/aptitude/data-structures-mcq) and [OS, DBMS & Networks](/aptitude/os-dbms-networks). Output-prediction questions turn on language rules such as integer division, operator precedence and scope; the early modules of the [C++](/study-plans/cpp), [Java](/study-plans/java) and [Python](/study-plans/python) study plans cover them. Solving problems stage by stage on the [DSA roadmap](/roadmap) makes the data structure questions familiar from use rather than from memory.
- **English Communication** is grammar, vocabulary and comprehension: [Sentence Correction](/aptitude/sentence-correction), [Fill in the Blanks & Para Jumbles](/aptitude/sentence-completion), [Synonyms & Antonyms](/aptitude/vocabulary) and [Reading Comprehension](/aptitude/reading-comprehension). Thirty questions at a minute each is steady rather than rushed, but the reported cut-off here is the higher of the two.

### On the day

There is no negative marking, so answer every question before each section closes. The technical block allows about 67 seconds a question. Pseudocode tracing is the slowest item in it, so answer the factual questions on OS, DBMS and data structures first and give the tracing questions the time that is left, writing variable values down as you go. Because each section must be cleared on its own, make accuracy the goal rather than finishing early: time left over in a section does not carry to the next. In English, reading the question before the passage saves reading the passage twice.

This mock is modelled on the section sizes two prep portals agree on, 40 technical and 30 English, though one source reports 30 technical, and leaves out the four-game cognitive round; CodeKairo is not affiliated with Capgemini.`,

  "hcltech-aptitude-technical": `A guide to the HCLTech written test, the most regular pattern in this catalogue: four sections of fifteen questions, fifteen minutes each.

### What the paper looks like

Four sections, sat in a fixed order: Quantitative Aptitude, Logical Reasoning, Verbal Ability and Technical, each 15 questions in 15 minutes. That is 60 questions in 60 minutes. Each question is worth one mark and there is no negative marking. Each section is timed separately and closes when you leave it, and time does not carry over: finishing a section early does not lengthen the next. The paper is not adaptive. The reported cut-off is 70 per cent on every section, about eleven of fifteen, so aim for twelve. There is no coding section in this pattern, so nothing is left out of this paper.

### How to prepare, section by section

- **Quantitative Aptitude** is arithmetic with a few data questions: [Percentages](/aptitude/percentages), [Profit & Loss](/aptitude/profit-and-loss), [Ratio & Proportion](/aptitude/ratio-and-proportion), [Averages](/aptitude/averages), [Time & Work](/aptitude/time-and-work), [Time, Speed & Distance](/aptitude/time-speed-distance) and [Tables & Charts](/aptitude/tables-and-charts).
- **Logical Reasoning** splits between [Number & Letter Series](/aptitude/number-series), [Coding & Decoding](/aptitude/coding-decoding), [Blood Relations](/aptitude/blood-relations) and [Direction Sense](/aptitude/direction-sense) on one side, and [Syllogisms](/aptitude/syllogisms), [Seating & Puzzles](/aptitude/seating-arrangement), [Analogies & Classification](/aptitude/analogies-classification) and [Mathematical Reasoning](/aptitude/mathematical-reasoning) on the other.
- **Verbal Ability** is [Sentence Correction](/aptitude/sentence-correction), [Fill in the Blanks & Para Jumbles](/aptitude/sentence-completion), [Synonyms & Antonyms](/aptitude/vocabulary) and [Reading Comprehension](/aptitude/reading-comprehension).
- **Technical** draws about six questions on [Programming Fundamentals](/aptitude/programming-fundamentals), five on [Data Structures & Algorithms](/aptitude/data-structures-mcq) and four on [OS, DBMS & Networks](/aptitude/os-dbms-networks). The early modules of the [Java](/study-plans/java), [C++](/study-plans/cpp) or [Python](/study-plans/python) study plan are a steady way to firm up the language rules the fundamentals questions test.

### On the day

A 70 per cent bar on every section changes the arithmetic. You can afford four wrong answers in each section, not four across the paper, so a weak section cannot hide behind a strong one; find your weakest section in practice and spend your preparation there. At a minute a question, answer everything you can do in under a minute on the first pass, then use the remaining time on the questions you skipped. With no negative marking, put an answer against every blank before the section closes, since a guess can only help you towards the twelve.

This mock is modelled on the published four-by-fifteen pattern, the shorter and better-attested of two reported variants; CodeKairo is not affiliated with HCLTech.`,

  "tech-mahindra-written": `A guide to the Tech Mahindra aptitude and technical paper, the one services pattern in this catalogue where a wrong answer costs marks.

### What the paper looks like

Five sections, sat in a fixed order, each 12 questions in 15 minutes: Logical Reasoning, Quantitative Aptitude, Verbal Ability, Computer Programming and Computer Science. That is 60 questions in 75 minutes. A correct answer earns one mark, a wrong answer loses a quarter of a mark, and a blank scores nothing. Each section has its own clock and there is no going back once you leave it. The paper is not adaptive. Computer Programming and Computer Science are separate blocks: the first is output tracing and object-oriented programming, the second is OS, DBMS, data structures and networks. The essay, the psychometric inventory, the Automata code-completion round and the AI communication assessment are not part of this paper.

### How to prepare, section by section

- **Logical Reasoning.** [Number & Letter Series](/aptitude/number-series), [Coding & Decoding](/aptitude/coding-decoding), [Blood Relations](/aptitude/blood-relations), [Direction Sense](/aptitude/direction-sense), [Syllogisms](/aptitude/syllogisms) and [Seating & Puzzles](/aptitude/seating-arrangement).
- **Quantitative Aptitude.** Arithmetic with some data interpretation: [Percentages](/aptitude/percentages), [Profit & Loss](/aptitude/profit-and-loss), [Time & Work](/aptitude/time-and-work), [Time, Speed & Distance](/aptitude/time-speed-distance) and [Tables & Charts](/aptitude/tables-and-charts).
- **Verbal Ability.** [Sentence Correction](/aptitude/sentence-correction), [Fill in the Blanks & Para Jumbles](/aptitude/sentence-completion), [Synonyms & Antonyms](/aptitude/vocabulary) and [Reading Comprehension](/aptitude/reading-comprehension).
- **Computer Programming.** Eight questions of [Programming Fundamentals](/aptitude/programming-fundamentals) and four of [Pseudocode](/aptitude/pseudocode). For the object-oriented questions, the classes, inheritance and interfaces modules of the [Java study plan](/study-plans/java) cover the ideas they test.
- **Computer Science.** Six questions on [Data Structures & Algorithms](/aptitude/data-structures-mcq) and six on [OS, DBMS & Networks](/aptitude/os-dbms-networks).

### On the day

Negative marking changes how you treat doubt. With one mark for a right answer and a quarter off for a wrong one, a guess pays on average only when you are more than one-in-five sure. A blind pick among four options barely clears that, so it adds little but risk. Rule out one option and a guess becomes worth taking; rule out two, as the paper's instructions advise, and it is a sound bet. Below that, leave the question blank, since a blank costs nothing. Each section allows 75 seconds a question and closes for good, so answer the questions you are sure of first, then return to the doubtful ones before the section's clock runs out.

Sources disagree on whether the real paper has negative marking, and this mock, modelled on the campus AMCAT-style pattern, applies it because practising under it is the safer preparation; CodeKairo is not affiliated with Tech Mahindra.`,

  "google-online-assessment": `A guide to the Google online assessment pattern for university candidates: two coding problems, one clock, and nothing else.

### What the paper looks like

One section: Coding, two problems of medium difficulty in 90 minutes. There is no aptitude round, no reasoning section and no multiple-choice paper. Both problems are open at once on a shared clock, and you can move between them freely and return to either until time runs out. Each problem is worth ten marks and is graded on the test cases your solution passes, so a partial solution scores; nothing is deducted for a wrong answer. The paper is not adaptive. Sources agree on the shape and differ on the details: two problems in 60 to 90 minutes is the dominant report, and some write-ups describe a three-task variant whose third task is code analysis. This mock uses ninety minutes.

### How to prepare, section by section

- **Coding.** Expect graph or tree traversal, a rules-based simulation, or heavy string and array work. For traversal, practise [Breadth-First Search](/challenges/breadth-first-search), [Depth-First Search](/challenges/depth-first-search) and [Graph](/challenges/graph) problems until building an adjacency list and a visited set takes no thought. For simulations, the [Simulation](/challenges/simulation) hub trains the careful state-keeping they need. For string and array work, [Strings](/challenges/strings), [Arrays](/challenges/arrays), [Hash Table](/challenges/hash-table), [Two Pointers](/challenges/two-pointers) and [Sliding Window](/challenges/sliding-window) cover the standard moves. If you want an order to work in, the [DSA roadmap](/roadmap) sequences these topics stage by stage.
- **Language.** Use the language you write fastest and most accurately. If it still slows you down, its study plan — [Java](/study-plans/java), [C++](/study-plans/cpp), [Python](/study-plans/python) or [JavaScript](/study-plans/javascript) — covers the collections and string handling that assessment code leans on.

### On the day

Read both problems before you write anything, and start with the one you can see a way through. Forty-five minutes a problem is the average, not a rule; with one shared clock you can give the harder one more. Because marks come per test case, a correct brute-force solution that passes the small cases is worth submitting before you look for the efficient one, so never leave an editor empty. Keep the last ten minutes for testing on the examples and on edge cases you make up yourself, such as empty input, a single element or repeated values, rather than for starting a new approach.

This mock is modelled on the published shape of Google's online assessment, whose exact counts are crowd-sourced; CodeKairo is not affiliated with Google.`,

  "microsoft-online-assessment": `A guide to the Microsoft online assessment pattern: two coding problems on a platform such as Codility or HackerRank, and nothing that is not code.

### What the paper looks like

One section: Coding, two problems of medium difficulty in 90 minutes on a shared clock. You can move between the two problems freely and come back to either. Each problem is worth ten marks and is graded on the test cases your solution passes, so partial credit counts; there is no negative marking and no multiple-choice section. The paper is not adaptive. The reported scoring is blunt: below 60 per cent is said to be an automatic rejection, 100 per cent an automatic pass, and anything between is read by a recruiter. Those thresholds are consistently repeated but crowd-sourced rather than official, and sources vary between two and three problems in 60 to 90 minutes, scaling with seniority.

### How to prepare, section by section

- **Coding.** Trees, dynamic programming, arrays and strings are the usual ground. Tree questions are traversal questions, so practise recursion over trees with [Depth-First Search](/challenges/depth-first-search) and level-by-level work with [Breadth-First Search](/challenges/breadth-first-search), and get comfortable with [Recursion](/challenges/recursion) itself. For [Dynamic Programming](/challenges/dynamic-programming), start with the one-dimensional problems and move on to two-dimensional tables over strings and grids. For arrays and strings, [Arrays](/challenges/arrays), [Strings](/challenges/strings), [Hash Table](/challenges/hash-table), [Two Pointers](/challenges/two-pointers) and [Sliding Window](/challenges/sliding-window) cover the patterns that recur. The [DSA roadmap](/roadmap) puts these in an order that builds on itself.
- **Language.** Write in the language you are quickest in. The [Java](/study-plans/java), [C++](/study-plans/cpp), [Python](/study-plans/python) and [JavaScript](/study-plans/javascript) study plans each cover the standard collections, which is most of what an assessment solution needs from a library.

### On the day

With partial credit and a reported floor at 60 per cent, the aim is to finish something on both problems rather than perfect one. Read both first. Get a correct solution to the easier one written and submitted, then turn to the second; if its efficient solution will not come, submit a brute force that passes the smaller test cases before refining it. Forty-five minutes each is the even split, and the shared clock lets you move time from one problem to the other. Keep the last ten minutes for testing edge cases, such as empty input, a single element and the largest values, rather than for starting a new approach.

This mock is modelled on the published shape of Microsoft's online assessment, which is well documented in outline and crowd-sourced in detail; CodeKairo is not affiliated with Microsoft.`,

  "meta-coding-screen": `A guide to the Meta coding screen pattern, which has the tightest clock in this catalogue: four problems in seventy minutes.

### What the paper looks like

One section: Coding, four problems, two easy and two of medium difficulty, in 70 minutes on a shared clock, which is about seventeen minutes a problem. You can move between the problems freely. Each problem is worth ten marks and is graded on the test cases it passes, with no negative marking and no multiple-choice section. The paper is not adaptive. Speed is the test: not finishing is normal, and getting three clean is a strong result. Meta's format changed in 2025 and two live formats are reported, one problem that unlocks in four stages over 90 minutes and four separate problems in 70 minutes. This mock models the second, because the staged format cannot be reproduced.

### How to prepare, section by section

- **Coding.** Seventeen minutes a problem leaves no time to discover an approach, so the preparation is recognition: seeing a problem and knowing its pattern at once. Build that on the high-frequency hubs, [Arrays](/challenges/arrays), [Strings](/challenges/strings), [Hash Table](/challenges/hash-table), [Two Pointers](/challenges/two-pointers), [Sliding Window](/challenges/sliding-window), [Stack](/challenges/stack), [Sorting](/challenges/sorting) and [Binary Search](/challenges/binary-search), then add [Breadth-First Search](/challenges/breadth-first-search) and [Depth-First Search](/challenges/depth-first-search) for the medium problems. Time yourself: an easy problem should go from reading to a passing solution in about ten minutes. The [DSA roadmap](/roadmap) is a structured way to cover the ground first.
- **Language.** Speed depends on fluency with your language's library. Pick one and know its maps, sets, sorting and string methods without looking them up; the [Python](/study-plans/python), [Java](/study-plans/java), [C++](/study-plans/cpp) and [JavaScript](/study-plans/javascript) study plans cover them.

### On the day

Triage before you write. Read all four problems, which takes two minutes at most, and order them by how quickly you can see the solution, usually the two easy ones first. Do not polish: get a correct solution down, check it on the examples, submit, and move on. If a problem is still stuck after twenty minutes, submit what passes and go to the next, because an unread problem scores nothing and a partial one scores something. Come back to unfinished work only once all four have had an attempt.

This mock is modelled on the four-problem variant of Meta's published screen, whose format varies; CodeKairo is not affiliated with Meta.`,

  "apple-coding-assessment": `A guide to the Apple coding assessment pattern, the least standardised in this catalogue because it is set team by team.

### What the paper looks like

One section: Coding, three problems, one easy, one medium and one hard, in 90 minutes on a shared clock. You can move between the problems freely. Each is worth ten marks and is graded on the test cases passed, with no negative marking and no multiple-choice questions. The paper is not adaptive. At least one problem needs a genuinely efficient algorithm: a working brute force will exceed the time limit. Implementation quality is reported to be weighted unusually heavily. The numbers are entirely crowd-sourced; ninety minutes and three problems is the most-reported shape, with 60 to 90-plus minutes and an unfixed count also reported. QA and SDET roles are reported to get a different paper, which is not modelled.

### How to prepare, section by section

- **Coding.** Expect arrays, strings, trees, graphs and dynamic programming, with memory-aware solutions favoured. For the problem where brute force times out, the usual routes to an efficient solution are [Hash Table](/challenges/hash-table) lookups, [Binary Search](/challenges/binary-search), [Two Pointers](/challenges/two-pointers), [Prefix Sum](/challenges/prefix-sum), [Heap](/challenges/heap) and [Dynamic Programming](/challenges/dynamic-programming). For trees and graphs, practise [Depth-First Search](/challenges/depth-first-search), [Breadth-First Search](/challenges/breadth-first-search) and [Graph](/challenges/graph). State the time and space complexity of every solution you write, and ask whether the space can come down; a dynamic programming table often shrinks to a single row. The [DSA roadmap](/roadmap) covers these topics in order.
- **Code quality.** Clear names, small functions and early handling of edge cases make a solution readable. If your habits in your language are loose, the interview idioms module that closes each study plan, [Java](/study-plans/java), [C++](/study-plans/cpp), [Python](/study-plans/python) or [JavaScript](/study-plans/javascript), is a good check.

### On the day

Read all three problems first and look at the input sizes: the constraints tell you which problem needs the efficient algorithm. Solve the easy one cleanly and quickly, then give the most time to whichever remaining problem you can see the efficient approach for. If the hard one's efficient solution does not come, a brute force still earns the test cases small enough to pass, so submit it rather than leave the editor empty. Because quality is weighted, spend a few minutes tidying names and structure once a solution passes, rather than starting yet another attempt at the hard problem in the final minutes.

This mock is modelled on the most-reported shape of Apple's coding assessment, which varies by team; CodeKairo is not affiliated with Apple.`,

  "flipkart-online-coding": `A guide to the Flipkart online coding round pattern: three problems in ninety minutes, where complexity is judged as well as correctness.

### What the paper looks like

One section: Coding, three problems of medium difficulty in 90 minutes on a shared clock, with free movement between them. There is no aptitude or reasoning section. In the real round every test case must pass for a problem to count as solved, and time and space complexity are assessed alongside correctness. This mock scores each problem out of ten on the test cases passed, with no negative marking, so a partial score shows here; treat it as a sign of what still needs work. The paper is not adaptive. Three problems in 90 minutes is the main report, and some batches add a debugging block. The machine-coding round that follows, where you build a small runnable program from a specification, is a different exercise and is not modelled.

### How to prepare, section by section

- **Coding.** The reported topics are arrays, strings, trees, graphs, hashing, sliding window, recursion and dynamic programming. Work the hubs for each: [Arrays](/challenges/arrays), [Strings](/challenges/strings), [Hash Table](/challenges/hash-table), [Sliding Window](/challenges/sliding-window), [Recursion](/challenges/recursion) and [Dynamic Programming](/challenges/dynamic-programming), with [Depth-First Search](/challenges/depth-first-search), [Breadth-First Search](/challenges/breadth-first-search) and [Graph](/challenges/graph) for the tree and graph problems. Because all test cases must pass, the large hidden inputs are what fail most solutions: for every problem you practise, work out the complexity the constraints allow before writing, and do not stop at a solution that only passes the examples. The [DSA roadmap](/roadmap) orders these topics so that each stage builds on the last.
- **Language.** Know your language's hash map, set, sorting and queue by heart; the [Java](/study-plans/java), [C++](/study-plans/cpp), [Python](/study-plans/python) and [JavaScript](/study-plans/javascript) study plans cover them.

### On the day

Thirty minutes a problem is the even split. Read all three, then start with the one whose efficient solution you can see. Since a problem in the real round counts only when every test case passes, one fully correct solution is worth more than three partial ones, so finish and verify each before moving on. Check the edge cases the hidden tests are likely to hold: empty input, a single element, duplicates and the maximum size. If a solution is correct but too slow, the constraints usually tell you by how much, and that points to the technique you need.

This mock is modelled on Flipkart's published first-round pattern, in which the absence of an aptitude section is explicit; CodeKairo is not affiliated with Flipkart.`,

  "salesforce-swe-assessment": `A guide to the Salesforce software engineering assessment pattern: two narrative coding problems in seventy-five minutes, with no aptitude section.

### What the paper looks like

One section: Coding, two problems of medium difficulty in 75 minutes on a shared clock; the real assessment is India-gated and runs on HackerRank. You can move between the two problems freely. There is no aptitude section and no negative marking, and the paper is not adaptive. The problems read as narratives rather than textbook data-structure puzzles: they describe a scenario to simulate, and an efficient solution is still required. In the real assessment the two are not worth the same; the reported split is 50 points for the first and 75 for the second, out of 125. This mock marks both equally, ten marks each, graded on the test cases passed. Duration is reported as 60 minutes in 2024 and 75 in 2025, and this mock uses 75.

### How to prepare, section by section

- **Coding.** The first skill a narrative problem tests is translation: reading a paragraph of scenario and seeing the data structure underneath it. The [Simulation](/challenges/simulation) hub is the closest practice, since its problems are solved by doing exactly what the statement says while keeping every piece of state right. Behind the story, the usual tools are [Hash Table](/challenges/hash-table), [Sorting](/challenges/sorting), [Heap](/challenges/heap), [Queue](/challenges/queue), [Intervals](/challenges/intervals) and [Greedy](/challenges/greedy), with [Arrays](/challenges/arrays) and [Strings](/challenges/strings) underneath them all. After each practice problem, write one line saying what the story reduced to, such as "a queue of events processed in time order"; that habit is what makes a real problem quick to read. The [DSA roadmap](/roadmap) covers the underlying techniques in order.
- **Language.** Narrative problems often mean modelling a few entities, so be comfortable defining a small class in your language; the [Java](/study-plans/java), [Python](/study-plans/python), [C++](/study-plans/cpp) and [JavaScript](/study-plans/javascript) study plans all cover classes.

### On the day

Read both problems fully before choosing where to start. A narrative takes longer to read than a puzzle, and misreading one rule costs more than the minutes spent reading carefully. In the real assessment the second problem is worth more, so do not let the first consume the clock: thirty-five minutes on the first leaves forty for the second. Write the rules of each scenario down as a short list before coding, then check your solution against each rule. Because marks come per test case, submit a working version early and improve it, rather than holding back an unfinished efficient one.

This mock is modelled on Salesforce's published India assessment, crowd-sourced but consistent across candidate reports; CodeKairo is not affiliated with Salesforce.`,

  "infosys-specialist-programmer": `A guide to the Infosys Specialist Programmer coding pattern: three problems in three hours, set as an easy, medium and hard ladder.

### What the paper looks like

One section: Coding, three problems, one easy, one medium and one hard, in 180 minutes on a shared clock. There is no multiple-choice section. You can move between the problems, but the ladder is deliberate and the instructions are to solve them in order: the first should take about half an hour, the second 45 to 60 minutes and the third an hour or more. Each problem is worth ten marks in this mock and is marked per test case, with no negative marking. The reported pass thresholds rise with the ladder: all test cases on the first, about 80 per cent on the second and about 75 per cent on the third. The paper is not adaptive. The name is a trap: "DSE" is used both for this coding track and for the aptitude-track Digital Specialist Engineer role, which sits the [Systems Engineer aptitude paper](/tests/infosys-systems-engineer) instead.

### How to prepare, section by section

- **Coding, first problem.** Treat it as a fluency check: [Arrays](/challenges/arrays), [Strings](/challenges/strings), [Math](/challenges/math) and [Hash Table](/challenges/hash-table) problems solved cleanly with every edge case handled, since the reported threshold is every test case.
- **Coding, second problem.** Medium problems built on standard techniques: [Sorting](/challenges/sorting), [Two Pointers](/challenges/two-pointers), [Sliding Window](/challenges/sliding-window), [Binary Search](/challenges/binary-search), [Greedy](/challenges/greedy) and [Prefix Sum](/challenges/prefix-sum).
- **Coding, third problem.** Expect the harder techniques: [Dynamic Programming](/challenges/dynamic-programming), [Graph](/challenges/graph) search with [Breadth-First Search](/challenges/breadth-first-search) and [Depth-First Search](/challenges/depth-first-search), [Backtracking](/challenges/backtracking), [Union Find](/challenges/union-find) and [Topological Sort](/challenges/topological-sort).

The [DSA roadmap](/roadmap) climbs the same ladder in stages. Over three hours a firm grip on one language matters, and the [Java](/study-plans/java), [C++](/study-plans/cpp) and [Python](/study-plans/python) study plans each end with an interview idioms module.

### On the day

Three hours is long enough that pacing is about stamina rather than speed. Solve the first problem fully and check it against edge cases before moving on, because the reported bar there is every test case. Give the second problem its hour. On the third, a partial solution that passes some test cases still scores, so if the full solution will not come, submit the best correct approach you have, such as a brute force or a solution to a restricted case, and then try to improve it. Keep the last fifteen minutes for re-running all three against extra cases of your own.

This mock is modelled on the published Specialist Programmer pattern, consistent across sources at three problems in 180 minutes with no multiple-choice section; CodeKairo is not affiliated with Infosys.`,

  "tcs-nqt-advanced-coding": `A guide to the Advanced Coding round of the TCS National Qualifier Test, sat here on its own without the aptitude paper first.

### What the paper looks like

One section: Advanced Coding, two problems, one easy and one of medium difficulty, in 90 minutes on a shared clock, with free movement between them. Each problem is worth ten marks, and partial marks are awarded for a solution that passes some test cases; there is no negative marking and no multiple-choice section. The paper is not adaptive. The ninety-minute window is agreed everywhere, but the problem count is disputed: one major source says three, with a reported ladder of one problem for Ninja, two for Digital and all three for Prime, while several others say two. This mock draws two. TCS accepts C, C++, Java, Python and Perl.

### How to prepare, section by section

- **Coding, first problem.** Expect an easier problem that rewards clean implementation: [Arrays](/challenges/arrays), [Strings](/challenges/strings), [Math](/challenges/math), [Number Theory](/challenges/number-theory) and [Simulation](/challenges/simulation) problems, solved with every edge case covered.
- **Coding, second problem.** A medium problem on a standard technique: [Hash Table](/challenges/hash-table), [Sorting](/challenges/sorting), [Two Pointers](/challenges/two-pointers), [Sliding Window](/challenges/sliding-window), [Greedy](/challenges/greedy), [Prefix Sum](/challenges/prefix-sum) or [Dynamic Programming](/challenges/dynamic-programming).
- **Language.** Of the accepted languages, Java, C++ and Python each have a full study plan: [Java](/study-plans/java), [C++](/study-plans/cpp) and [Python](/study-plans/python). Whichever you choose, know its standard library well enough to write without looking things up and, in C++ or Java, know where integers overflow.

The [DSA roadmap](/roadmap) orders the techniques above into stages. For the aptitude half of the NQT, take the [Foundation + Advanced](/tests/tcs-nqt-full) mock.

### On the day

Forty-five minutes a problem is the even split, but the easier problem should take much less; aim to have it passing within twenty-five minutes, which leaves an hour for the second. Partial marks are awarded, so submit a working brute force on the second problem as soon as you have one, then improve it towards the efficient version. Before submitting either, test the edge cases the examples leave out: the smallest input, the largest, repeated values. With no negative marking and partial credit, an empty editor is the only certain zero.

This mock is modelled on the published NQT coding round, whose ninety-minute window is agreed while its problem count is not; CodeKairo is not affiliated with TCS.`,

  "wipro-nlth-programming": `A guide to the programming round of Wipro's National Level Talent Hunt (NLTH): two deliberately unequal problems in an hour.

### What the paper looks like

One section: Online Programming, two problems, one easy and one of medium difficulty, in 60 minutes on a shared clock, with free movement between them. Each problem is worth ten marks in this mock and is graded on the test cases passed; there is no negative marking and no multiple-choice section. The paper is not adaptive. The two problems are unequal by design: the first is general programming and should take around twenty minutes, and the second is data structures and algorithms and takes the rest. The round is sat in one language, chosen from Java, C, C++ and Python, which cannot be changed during it. The reported cut-off for the round is 80 per cent. Some tech-track drives add an Automata Fix round, in which you repair pre-written code; that is not modelled.

### How to prepare, section by section

- **Coding, first problem.** General programming: loops, conditions, arithmetic and string handling done without error. [Math](/challenges/math), [Strings](/challenges/strings), [Arrays](/challenges/arrays) and [Simulation](/challenges/simulation) problems build the speed this needs.
- **Coding, second problem.** Data structures and algorithms. Practise [Hash Table](/challenges/hash-table), [Stack](/challenges/stack), [Queue](/challenges/queue), [Sorting](/challenges/sorting), [Two Pointers](/challenges/two-pointers), [Binary Search](/challenges/binary-search) and [Recursion](/challenges/recursion), then [Dynamic Programming](/challenges/dynamic-programming) once those are comfortable. The [DSA roadmap](/roadmap) takes you through them in a sensible order.
- **Language.** Because the choice is fixed for the whole round, make it before the test and practise every problem in that language. Java, C++ and Python have full study plans: [Java](/study-plans/java), [C++](/study-plans/cpp) and [Python](/study-plans/python).

The aptitude paper that comes before this round has its own mock: [Wipro NLTH — Aptitude](/tests/wipro-nlth-aptitude).

### On the day

Keep to the split the problems are designed for. Finish the first problem in about twenty minutes, test it against edge cases and submit it, which leaves forty minutes for the second. With a reported cut-off of 80 per cent, the first problem has to pass completely, and there is little room left for losses on the second. Once the second has a working solution, spend the remaining time on the cases it might miss, such as empty input and the largest values, rather than on style. If the efficient approach will not come, submit a simpler correct one; with marks per test case, it still earns the smaller cases.

This mock is modelled on the published NLTH programming round, on which sources agree at two problems in sixty minutes, fundamentals first and then data structures; CodeKairo is not affiliated with Wipro.`,

  "amazon-reasoning-debugging": `A guide to the Amazon SDE online assessment pattern: code debugging, then two coding problems, then logical reasoning, which are the three parts of the assessment that can be reproduced.

### What the paper looks like

Three sections, in a fixed order: Code Debugging, 7 questions in 20 minutes; Coding, two problems of medium difficulty in 70 minutes; and Logical Reasoning, 24 questions in 35 minutes. That is 33 questions in 125 minutes. Each debugging and reasoning question is worth one mark, and each coding problem ten marks, graded on the test cases passed. There is no negative marking. Each section has its own clock and locks when you leave it, as the real assessment does. The paper is not adaptive. The reasoning block appears only in some India batches, and sources disagree on its size and on the debugging count; the larger figures are used here. Two parts of the real assessment cannot be reproduced: the Work Simulation, an inbox exercise scored against Amazon's leadership principles, and the Work Style Survey, a set of statements with no right answer.

### How to prepare, section by section

- **Code Debugging** is short snippets with a defect, about three minutes each, drawn here from [Programming Fundamentals](/aptitude/programming-fundamentals) and [Pseudocode](/aptitude/pseudocode). Practise spotting the common kinds of defect, such as off-by-one loop bounds, inverted conditions and unhandled edge cases, by reading code for what it does rather than what it was meant to do. The early modules of the [Java](/study-plans/java), [C++](/study-plans/cpp) or [Python](/study-plans/python) study plan firm up the language rules involved.
- **Coding** is two medium problems in seventy minutes. Cover [Arrays](/challenges/arrays), [Strings](/challenges/strings), [Hash Table](/challenges/hash-table), [Sorting](/challenges/sorting), [Heap](/challenges/heap), [Two Pointers](/challenges/two-pointers), [Sliding Window](/challenges/sliding-window), [Breadth-First Search](/challenges/breadth-first-search), [Depth-First Search](/challenges/depth-first-search) and [Dynamic Programming](/challenges/dynamic-programming), in the order the [DSA roadmap](/roadmap) sets.
- **Logical Reasoning** is series, syllogisms, arrangements and light data interpretation: [Number & Letter Series](/aptitude/number-series), [Syllogisms](/aptitude/syllogisms), [Seating & Puzzles](/aptitude/seating-arrangement), [Coding & Decoding](/aptitude/coding-decoding) and [Tables & Charts](/aptitude/tables-and-charts).

### On the day

Coding decides the result, so do not linger in the debugging section: about three minutes a snippet, and if the defect is not visible, choose the likeliest answer and move on, since there is no negative marking and the section cannot be reopened. In Coding, thirty-five minutes a problem is the even split; submit a correct solution early and improve it, since marks come per test case. Logical Reasoning comes last, at under a minute and a half a question, so answer every one before the section closes.

This mock is modelled on the published shape of Amazon's SDE assessment, though Amazon's careers page confirms only that it includes a coding test; CodeKairo is not affiliated with Amazon.`,

  "goldman-sachs-aptitude": `A guide to the Goldman Sachs aptitude test pattern, the one paper in this catalogue where a careless guess is a losing strategy.

### What the paper looks like

Four sections: Numerical Computation, 8 questions; Numerical Reasoning, 12 questions; Logical Reasoning, 12 questions; and Verbal Reasoning, 10 questions. That is 42 questions on one shared 55-minute clock, budgeted at 9, 16, 16 and 14 minutes, and you may move between sections freely and return to any of them. Marking follows the real test's +5 for a correct answer and −2 for a wrong one, scaled here to one mark and minus 0.4; a blank scores zero. The paper is not adaptive. The reported cut-off is around 75 per cent. The real Round 1 has 66 questions in 90 minutes across six sections, including Abstract Reasoning and Diagrammatic Reasoning, twelve questions each, built entirely from figures and flowcharts. Those two are not text multiple choice, so this mock leaves them out and reduces the time in proportion.

### How to prepare, section by section

- **Numerical Computation** is arithmetic under time: percentages, averages, probability and counting. Drill [Percentages](/aptitude/percentages), [Averages](/aptitude/averages), [Probability](/aptitude/probability) and [Permutations & Combinations](/aptitude/permutations-combinations) until the calculations are quick and exact.
- **Numerical Reasoning** is data interpretation from tables and charts, plus number series. Practise [Tables & Charts](/aptitude/tables-and-charts) and [Caselets](/aptitude/caselets), estimating before you calculate, and [Number & Letter Series](/aptitude/number-series).
- **Logical Reasoning** draws from the whole logical syllabus: [Syllogisms](/aptitude/syllogisms), [Seating & Puzzles](/aptitude/seating-arrangement), [Blood Relations](/aptitude/blood-relations), [Direction Sense](/aptitude/direction-sense), [Coding & Decoding](/aptitude/coding-decoding), [Analogies & Classification](/aptitude/analogies-classification) and [Mathematical Reasoning](/aptitude/mathematical-reasoning).
- **Verbal Reasoning** is [Reading Comprehension](/aptitude/reading-comprehension), [Sentence Correction](/aptitude/sentence-correction), [Fill in the Blanks & Para Jumbles](/aptitude/sentence-completion) and [Synonyms & Antonyms](/aptitude/vocabulary).

### On the day

The marking decides the strategy. With +5 for a right answer and −2 for a wrong one, a guess breaks even at about two-in-seven confidence. A blind pick among four options falls below that and loses marks on average; ruling out one option puts a guess just ahead, and ruling out two, as the instructions advise, makes it clearly worth taking. Otherwise leave the question blank. Use the shared clock: make a first pass through all four sections answering what you are sure of, then return to the questions where you can eliminate options. A high cut-off and a penalty together reward accuracy, so work each question properly rather than skimming for coverage.

This mock is modelled on the published Goldman Sachs pattern, the best documented in this catalogue, less its two figure-based sections; CodeKairo is not affiliated with Goldman Sachs.`,

  "deloitte-assessment": `A guide to the Deloitte online assessment pattern, in which computer fundamentals outweigh aptitude: thirty of the sixty-five questions are technical.

### What the paper looks like

Three sections, sat in a fixed order: Language Skills, 13 questions in 10 minutes; General Aptitude, 22 questions in 25 minutes; and Technical Skills, 30 questions in 25 minutes. That is 65 questions in 60 minutes. Each question is worth one mark and there is no negative marking. Each section runs on its own clock and closes when you leave it; sources differ on whether the real timer is shared or per section, and per section is used here. Sources also disagree on whether the paper is adaptive, and this mock is not. Reported sectional cut-offs are roughly 7 of 13 on English, 11 of 22 on aptitude and 11 of 30 on technical. The two coding problems that follow the multiple-choice block are not part of this paper.

### How to prepare, section by section

- **Language Skills** is thirteen verbal questions at about 46 seconds each: [Sentence Correction](/aptitude/sentence-correction), [Synonyms & Antonyms](/aptitude/vocabulary), [Fill in the Blanks & Para Jumbles](/aptitude/sentence-completion) and [Reading Comprehension](/aptitude/reading-comprehension). Grammar needs to be automatic at that pace.
- **General Aptitude** asks quantitative and reasoning questions together, twelve and ten. For the quantitative side, cover [Percentages](/aptitude/percentages), [Profit & Loss](/aptitude/profit-and-loss), [Ratio & Proportion](/aptitude/ratio-and-proportion), [Time & Work](/aptitude/time-and-work) and [Time, Speed & Distance](/aptitude/time-speed-distance); for reasoning, [Number & Letter Series](/aptitude/number-series), [Syllogisms](/aptitude/syllogisms), [Blood Relations](/aptitude/blood-relations) and [Seating & Puzzles](/aptitude/seating-arrangement).
- **Technical Skills** is ten questions each on [Programming Fundamentals](/aptitude/programming-fundamentals), [Data Structures & Algorithms](/aptitude/data-structures-mcq) and [OS, DBMS & Networks](/aptitude/os-dbms-networks). It is the largest section, so it repays the most preparation. For the programming questions, the early modules of the [Java](/study-plans/java), [C++](/study-plans/cpp) or [Python](/study-plans/python) study plan cover operators, types and control flow; for data structures, solving problems on the [DSA roadmap](/roadmap) makes the trade-offs familiar from use.

### On the day

Every section is timed separately, so pace each on its own terms. Language Skills is the fastest at under fifty seconds a question: answer what you know on sight and guess the rest before the ten minutes are up. General Aptitude allows about 68 seconds a question. Technical Skills allows 50 seconds, which suits recall questions but not long tracing, so answer the factual OS, DBMS and data structures questions first and come back to the output-prediction ones. There is no negative marking, so leave no question blank in any section, and remember that minutes left in one section are lost when you move on.

This mock is modelled on the section counts two prep portals agree on, 13, 22 and 30, with per-section timing chosen where they differ; CodeKairo is not affiliated with Deloitte.`,

  "adobe-campus-aptitude": `A guide to the Adobe campus aptitude pattern: three equal sections of twenty questions, twenty minutes each, where the only difficulty in the format is the pace.

### What the paper looks like

Three sections, sat in a fixed order: Quantitative Aptitude, Logical Reasoning and Verbal English, each 20 questions in 20 minutes. That is 60 questions in 60 minutes. Each question is worth one mark, there is no negative marking and the paper is not adaptive. Each section is hard-locked at twenty minutes: it closes when you leave it, and time does not carry from one section to the next. The sixty-minute coding round that follows is not part of this paper. Two prep portals agree on this shape, differing only on the coding round, and an off-campus variant with a different shape is also reported.

### How to prepare, section by section

- **Quantitative Aptitude** is mostly arithmetic with a few data interpretation questions. At a minute each, shortcuts matter: know the common percentage and fraction equivalents by heart for [Percentages](/aptitude/percentages) and [Profit & Loss](/aptitude/profit-and-loss), and practise [Ratio & Proportion](/aptitude/ratio-and-proportion), [Averages](/aptitude/averages), [Time & Work](/aptitude/time-and-work), [Time, Speed & Distance](/aptitude/time-speed-distance), [Number System](/aptitude/number-system) and [Tables & Charts](/aptitude/tables-and-charts).
- **Logical Reasoning** splits evenly between the quicker topics, [Number & Letter Series](/aptitude/number-series), [Coding & Decoding](/aptitude/coding-decoding), [Blood Relations](/aptitude/blood-relations) and [Direction Sense](/aptitude/direction-sense), and the slower ones: [Syllogisms](/aptitude/syllogisms), [Seating & Puzzles](/aptitude/seating-arrangement), [Analogies & Classification](/aptitude/analogies-classification) and [Mathematical Reasoning](/aptitude/mathematical-reasoning).
- **Verbal English** is [Sentence Correction](/aptitude/sentence-correction), [Fill in the Blanks & Para Jumbles](/aptitude/sentence-completion), [Synonyms & Antonyms](/aptitude/vocabulary) and [Reading Comprehension](/aptitude/reading-comprehension).

The coding round is not modelled here; the [DSA roadmap](/roadmap) is the place to prepare for it.

### On the day

A minute a question with no slack anywhere means the main risk is one question eating three minutes. Set yourself a rule: if a question has not given way in about ninety seconds, choose your best option and move on, and come back only if time remains in that section. In Logical Reasoning, take the series and coding questions first and leave the arrangements for a second pass. No negative marking means every question should carry an answer before its section closes. Finishing a section early earns nothing, since time does not carry over, so use any spare minutes to recheck calculations.

This mock is modelled on the published Adobe campus pattern of three twenty-question, twenty-minute sections; CodeKairo is not affiliated with Adobe.`,

  "zs-associates-aptitude": `A guide to the ZS Associates aptitude pattern: sixty questions, seventy-five minutes, no coding, and no section that locks.

### What the paper looks like

Four sections: Quantitative Aptitude, 18 questions; Logical Reasoning, 16 questions; Verbal Ability, 14 questions; and Data Interpretation, 12 questions. That is 60 questions on one 75-minute clock. There are no sectional time limits. The sections are budgeted at 22, 20, 15 and 18 minutes, but the time is yours to spend across them as you like, and you can move between sections freely and return to any of them. Each question is worth one mark, there is no negative marking, and there are no sectional cut-offs. The paper is not adaptive. Data Interpretation's eighteen-minute budget is almost a quarter of the clock. The business-scenario video round that follows is not part of this paper. Sources disagree on whether there are four sections or five, one adding an Attention to Detail block; four are modelled here.

### How to prepare, section by section

- **Quantitative Aptitude** draws from the whole quantitative syllabus: [Percentages](/aptitude/percentages), [Profit & Loss](/aptitude/profit-and-loss), [Ratio & Proportion](/aptitude/ratio-and-proportion), [Averages](/aptitude/averages), [Time & Work](/aptitude/time-and-work), [Time, Speed & Distance](/aptitude/time-speed-distance), [Simple & Compound Interest](/aptitude/interest), [Permutations & Combinations](/aptitude/permutations-combinations), [Probability](/aptitude/probability) and [Mixtures & Alligation](/aptitude/mixtures-alligation).
- **Logical Reasoning** likewise covers the full logical syllabus, from [Number & Letter Series](/aptitude/number-series) and [Coding & Decoding](/aptitude/coding-decoding) to [Syllogisms](/aptitude/syllogisms), [Seating & Puzzles](/aptitude/seating-arrangement) and [Mathematical Reasoning](/aptitude/mathematical-reasoning).
- **Verbal Ability** is [Reading Comprehension](/aptitude/reading-comprehension), [Sentence Correction](/aptitude/sentence-correction), [Fill in the Blanks & Para Jumbles](/aptitude/sentence-completion) and [Synonyms & Antonyms](/aptitude/vocabulary).
- **Data Interpretation** is [Tables & Charts](/aptitude/tables-and-charts) and [Caselets](/aptitude/caselets). Practise reading what a chart shows before looking at the question, and estimating an answer to rule out options before calculating one.

### On the day

Free time allocation is the defining feature, so decide your order in advance. A sensible plan is to sweep the data interpretation sets you can read quickly, then the quantitative and logical questions you can finish in under a minute, then return to the long calculations and puzzles with the time that is left. Watch the overall clock rather than the section budgets: at 75 seconds a question on average, a question that has taken three minutes is costing you two others. There is no negative marking and no sectional cut-off, so in the last three minutes put an answer against every blank question in every section.

This mock is modelled on the crowd-sourced ZS pattern, on which sources agree about the free time allocation and the absence of negative marking; CodeKairo is not affiliated with ZS Associates.`,

  "morgan-stanley-assessment": `A guide to the Morgan Stanley aptitude and technical assessment pattern, where computer science carries most of the weight: thirty of its fifty-three questions are fundamentals.

### What the paper looks like

Three sections, sat in a fixed order: Aptitude, 16 questions in 20 minutes; CS Fundamentals, 30 questions in 30 minutes; and Pseudo Code, 7 questions in 20 minutes. That is 53 questions in 70 minutes. Each section has its own clock and closes when you leave it. The paper is not adaptive. No source documents the real marking or cut-offs, so this mock scores one mark a question with no negative marking. Morgan Stanley runs different tests by division and region, and four incompatible patterns are reported; this one follows the only variant with explicit per-section timings. The three-problem coding round that follows is not part of this paper.

### How to prepare, section by section

- **Aptitude** is eight quantitative and eight logical questions at 75 seconds each. Keep the quick arithmetic topics sharp, [Percentages](/aptitude/percentages), [Ratio & Proportion](/aptitude/ratio-and-proportion), [Time & Work](/aptitude/time-and-work) and [Probability](/aptitude/probability), alongside [Number & Letter Series](/aptitude/number-series), [Syllogisms](/aptitude/syllogisms) and [Seating & Puzzles](/aptitude/seating-arrangement).
- **CS Fundamentals** is sixteen questions on data structures and algorithms and fourteen on operating systems, databases and networks, at a minute each. Work through [Data Structures & Algorithms](/aptitude/data-structures-mcq) and [OS, DBMS & Networks](/aptitude/os-dbms-networks) until the answers are recall rather than reasoning: the cost of the standard operations, scheduling, normalisation, SQL and the OSI layers. The [Stack](/challenges/stack), [Queue](/challenges/queue), [Heap](/challenges/heap) and [Hash Table](/challenges/hash-table) hubs pair each structure with problems, and solving problems along the [DSA roadmap](/roadmap) makes the trade-offs familiar from use.
- **Pseudo Code** is seven questions in twenty minutes, nearly three minutes each. Practise [Pseudocode](/aptitude/pseudocode) tracing with a written table of variable values, and [Recursion](/challenges/recursion) problems for the recursive routines.

### On the day

The time per question varies more than in most papers, so change pace between sections. In Aptitude, at 75 seconds a question, skip anything long on the first pass and return to it. In CS Fundamentals, a minute each suits recall; if you do not know an answer, reason it out briefly, choose, and move on. In Pseudo Code the time is generous for a reason: read the whole routine before you trace it, and trace carefully rather than quickly, since one misread loop bound changes the output. With no negative marking in this mock, answer every question before each section closes.

This mock is modelled on one published variant of Morgan Stanley's assessment, whose marking and cut-offs are documented nowhere; CodeKairo is not affiliated with Morgan Stanley.`,

  "oracle-aptitude-verbal": `A guide to the Oracle aptitude and verbal pattern: a short multiple-choice block of twenty questions on one clock, with a reported cut-off of sixty per cent.

### What the paper looks like

Two sections: Aptitude Assessment, 10 questions, and Verbal Assessment, 10 questions. That is 20 questions on one shared 30-minute clock, budgeted at 15 minutes a section, and you may move between sections as you like and return to either. Each question is worth one mark, there is no negative marking and the paper is not adaptive. The reported cut-off is 60 per cent on both sections. In the real test this block shares a 90-minute clock with a coding problem and an API-making problem, in which candidates build a REST endpoint rather than solve a puzzle; neither is part of this paper. Other sources describe a different track with two or three coding problems and no API round.

### How to prepare, section by section

- **Aptitude Assessment** is six logical questions and four quantitative. On the logical side, cover [Number & Letter Series](/aptitude/number-series), [Coding & Decoding](/aptitude/coding-decoding), [Blood Relations](/aptitude/blood-relations), [Direction Sense](/aptitude/direction-sense), [Syllogisms](/aptitude/syllogisms) and [Seating & Puzzles](/aptitude/seating-arrangement). On the quantitative side, [Percentages](/aptitude/percentages), [Ratio & Proportion](/aptitude/ratio-and-proportion), [Time & Work](/aptitude/time-and-work) and [Profit & Loss](/aptitude/profit-and-loss) are the core.
- **Verbal Assessment** is [Sentence Correction](/aptitude/sentence-correction), [Fill in the Blanks & Para Jumbles](/aptitude/sentence-completion), [Synonyms & Antonyms](/aptitude/vocabulary) and [Reading Comprehension](/aptitude/reading-comprehension). With only ten questions, each one is a tenth of the section, so a single careless error on a grammar question matters.
- **The coding problem this paper leaves out.** Hubs such as [Arrays](/challenges/arrays), [Strings](/challenges/strings) and [Hash Table](/challenges/hash-table), taken in the order the [DSA roadmap](/roadmap) sets, are the preparation for it.

### On the day

Thirty minutes for twenty questions is ninety seconds each, which is generous. The risk here is not the clock but the cut-off: with ten questions a section, you can afford at most four mistakes in either section, however well the other goes. Use the shared clock to your advantage. Answer the verbal questions you are sure of first, then work the aptitude questions carefully, and spend the time left rechecking every answer in whichever section felt weaker. With no negative marking, no question should be left blank.

This mock is modelled on the published Oracle pattern as PrepInsta's pages describe it, crowd-sourced but internally consistent; CodeKairo is not affiliated with Oracle.`,

  "zoho-round-one": `A guide to the Zoho Round 1 pattern, which tests depth rather than speed: generous time for hard aptitude questions, then C output prediction.

### What the paper looks like

Two sections, sat in order: Aptitude, 20 questions in 80 minutes, and Technical, 10 questions in 45 minutes. That is 30 questions in 125 minutes. Each question is worth one mark and there is no negative marking. Each section has its own clock and closes when you leave it. The paper is not adaptive. The timing is deliberately unhurried, four minutes a question on the aptitude block and four and a half on the technical one, because the questions are meant to be worked through properly. The real round is sat with pen and paper at a Zoho office. Zoho's shape is stable but its numbers are not: three credible sources give three different Round 1 specifications, and this mock follows 2025 candidate reports. The programming rounds that follow are not part of this paper.

### How to prepare, section by section

- **Aptitude** is fourteen quantitative questions, eight of them hard, and six logical. Work the hard questions in [Number System](/aptitude/number-system), [Permutations & Combinations](/aptitude/permutations-combinations), [Probability](/aptitude/probability), [Time, Speed & Distance](/aptitude/time-speed-distance), [Time & Work](/aptitude/time-and-work), [Mixtures & Alligation](/aptitude/mixtures-alligation) and [Ratio & Proportion](/aptitude/ratio-and-proportion), writing out full working as you would on paper. For the logical questions, [Seating & Puzzles](/aptitude/seating-arrangement), [Mathematical Reasoning](/aptitude/mathematical-reasoning) and [Number & Letter Series](/aptitude/number-series) reward the same patience.
- **Technical** is seven [Programming Fundamentals](/aptitude/programming-fundamentals) questions and three [Pseudocode](/aptitude/pseudocode) questions. C output prediction turns on details: operator precedence, pre- and post-increment, integer division and overflow, pointers and arrays, and what a loop prints on its last pass. There is no C study plan, but the [C++ study plan](/study-plans/cpp) shares that ground in its types, operators, and arrays, pointers and references modules.
- **The rounds after.** For the programming rounds that follow, the [DSA roadmap](/roadmap) and hubs such as [Arrays](/challenges/arrays), [Strings](/challenges/strings) and [Matrix](/challenges/matrix) are the place to build up.

### On the day

Depth over speed is the rule, and the timing backs it up: four minutes a question leaves time to work each one fully and check it. Work through the questions in order, and verify each answer by a second method or by substituting it back into the question. In the Technical section, trace each program line by line and write down every variable's value as it changes, rather than predicting the output from the shape of the code. With no negative marking, answer every question before each section closes.

This mock is modelled on 2025 candidate reports of Zoho's Round 1, since the published specifications vary; CodeKairo is not affiliated with Zoho.`,

  "big-tech-screen-prep": `A theory drill for candidates preparing for the coding screens at Google, Microsoft, Meta, Apple, Flipkart and Salesforce. It is not any company's real test.

### What the paper looks like

Three sections, sat in a fixed order: Data Structures & Algorithms, 20 questions in 25 minutes; OS, DBMS & Networks, 15 questions in 18 minutes; and Language Semantics, 15 questions in 17 minutes. That is 50 questions in 60 minutes. Each question is worth one mark, there is no negative marking, and the paper is not adaptive. Each section has its own clock and closes when you leave it. Those companies all screen with coding problems and nothing else: there is no aptitude round, no reasoning section and no multiple-choice paper to reproduce. What this paper drills instead is the theory those coding rounds assume: complexity, data structure trade-offs, the operating system and database facts that come up in the interviews that follow, and the language semantics that decide whether a solution is correct.

### How to prepare, section by section

- **Data Structures & Algorithms** covers complexity, trade-offs, traversals and the classics, drawn from [Data Structures & Algorithms](/aptitude/data-structures-mcq). The theory sticks best when tied to problems: [Hash Table](/challenges/hash-table), [Heap](/challenges/heap), [Stack](/challenges/stack), [Binary Search](/challenges/binary-search), [Sorting](/challenges/sorting), [Breadth-First Search](/challenges/breadth-first-search) and [Depth-First Search](/challenges/depth-first-search) each pair a structure or algorithm with problems that use it.
- **OS, DBMS & Networks** is drawn from [OS, DBMS & Networks](/aptitude/os-dbms-networks): processes and scheduling, SQL and normalisation, and the OSI layers.
- **Language Semantics** is output prediction in C, Java and Python, plus pseudocode tracing, from [Programming Fundamentals](/aptitude/programming-fundamentals) and [Pseudocode](/aptitude/pseudocode). The [Java](/study-plans/java), [Python](/study-plans/python), [C++](/study-plans/cpp) and [JavaScript](/study-plans/javascript) study plans go deeper on the language rules behind these questions.

The coding itself is where the offer is decided, so sit it there: the [Google](/tests/google-online-assessment), [Microsoft](/tests/microsoft-online-assessment), [Meta](/tests/meta-coding-screen), [Apple](/tests/apple-coding-assessment), [Flipkart](/tests/flipkart-online-coding) and [Salesforce](/tests/salesforce-swe-assessment) coding mocks, with the [DSA roadmap](/roadmap) as the path through the topics.

### On the day

The first section gives 75 seconds a question, and the other two roughly 72 and 68. These are recall questions, so answer on sight when you know, reason briefly when you do not, and never leave one blank, since there is no negative marking. Treat the result as a map of gaps: a wrong answer on a complexity or semantics question is a bug you might otherwise write into a coding round, so look up every one you miss afterwards.

This paper is CodeKairo's own and is not modelled on a published pattern, because none of these companies runs a multiple-choice round (Amazon, the one exception, has [its own mock](/tests/amazon-reasoning-debugging)); CodeKairo is not affiliated with any of these companies.`,

  "full-length-aptitude": `A guide to CodeKairo's full-length aptitude paper: a hundred questions across every section in two hours, built for stamina and diagnosis rather than to match one company.

### What the paper looks like

Five sections, sat in a fixed order: Quantitative Aptitude, 30 questions in 35 minutes; Logical Reasoning, 25 questions in 30 minutes; Verbal Ability, 25 questions in 25 minutes; Data Interpretation, 12 questions in 20 minutes; and Technical MCQs, 8 questions in 10 minutes. That is 100 questions in 120 minutes. Each question is worth one mark and there is no negative marking. Each section has its own clock and closes when you leave it. The paper is not adaptive. It is sized to a typical two-hour campus paper and weighted the way most services tests weight their sections, and the result breaks your score down by topic, so it works best as a diagnostic before you drill.

### How to prepare, section by section

- **Quantitative Aptitude** draws from the whole quantitative syllabus, from [Number System](/aptitude/number-system), [Percentages](/aptitude/percentages) and [Profit & Loss](/aptitude/profit-and-loss) through [Time & Work](/aptitude/time-and-work), [Time, Speed & Distance](/aptitude/time-speed-distance) and [Simple & Compound Interest](/aptitude/interest) to [Permutations & Combinations](/aptitude/permutations-combinations), [Probability](/aptitude/probability), [Mixtures & Alligation](/aptitude/mixtures-alligation), [Mensuration](/aptitude/mensuration) and [Problems on Ages](/aptitude/ages).
- **Logical Reasoning** covers [Number & Letter Series](/aptitude/number-series), [Coding & Decoding](/aptitude/coding-decoding), [Blood Relations](/aptitude/blood-relations), [Direction Sense](/aptitude/direction-sense), [Syllogisms](/aptitude/syllogisms), [Seating & Puzzles](/aptitude/seating-arrangement), [Analogies & Classification](/aptitude/analogies-classification) and [Mathematical Reasoning](/aptitude/mathematical-reasoning).
- **Verbal Ability** is [Synonyms & Antonyms](/aptitude/vocabulary), [Sentence Correction](/aptitude/sentence-correction), [Fill in the Blanks & Para Jumbles](/aptitude/sentence-completion) and [Reading Comprehension](/aptitude/reading-comprehension).
- **Data Interpretation** is [Tables & Charts](/aptitude/tables-and-charts) and [Caselets](/aptitude/caselets).
- **Technical MCQs** is a short block on [Programming Fundamentals](/aptitude/programming-fundamentals), [Data Structures & Algorithms](/aptitude/data-structures-mcq) and [OS, DBMS & Networks](/aptitude/os-dbms-networks).

After the sitting, take the topic breakdown and work through the two or three weakest topic pages before you sit a company pattern.

### On the day

Two hours is long enough that concentration, not knowledge, is often what fails first, so sit it in one go, somewhere quiet, as you would a real paper. The pace varies by section: 70 seconds a question in Quantitative Aptitude, 72 in Logical Reasoning, a minute in Verbal Ability, 100 in Data Interpretation and 75 in Technical MCQs. With no negative marking, answer every question before each section closes, and note which ones you guessed, because a guess that happens to be right still marks a topic to revisit. Minutes left in one section do not carry to the next.

This paper is not modelled on any company's published pattern but sized to a typical two-hour campus paper, and CodeKairo is not affiliated with any of the companies whose tests it resembles.`,

  "quick-aptitude-sprint": `A guide to CodeKairo's thirty-minute sprint: a single mixed section at the pace services papers expect, for the days you only have half an hour.

### What the paper looks like

One section, Mixed Aptitude: 30 questions in 30 minutes, twelve quantitative, ten logical and eight verbal. Each question is worth one mark and there is no negative marking. With a single section there is nothing to lock, and you can move between questions freely until the clock runs out. The paper is not adaptive. It is not a company pattern but a short diagnostic at services-paper pace: one minute a question, the pace every services test expects. It is short enough to sit before an interview and long enough to be honest about your speed.

### How to prepare, section by section

- **Quantitative questions** come from the whole quantitative syllabus. The topics that most reward shortcuts at a minute a question are [Percentages](/aptitude/percentages), [Ratio & Proportion](/aptitude/ratio-and-proportion), [Averages](/aptitude/averages), [Profit & Loss](/aptitude/profit-and-loss), [Time & Work](/aptitude/time-and-work) and [Time, Speed & Distance](/aptitude/time-speed-distance); [Number System](/aptitude/number-system) and [Simple & Compound Interest](/aptitude/interest) are close behind.
- **Logical questions** span [Number & Letter Series](/aptitude/number-series), [Coding & Decoding](/aptitude/coding-decoding), [Blood Relations](/aptitude/blood-relations), [Direction Sense](/aptitude/direction-sense), [Syllogisms](/aptitude/syllogisms) and [Seating & Puzzles](/aptitude/seating-arrangement). The first four are the ones a practised method makes quick.
- **Verbal questions** are [Sentence Correction](/aptitude/sentence-correction), [Synonyms & Antonyms](/aptitude/vocabulary), [Fill in the Blanks & Para Jumbles](/aptitude/sentence-completion) and [Reading Comprehension](/aptitude/reading-comprehension).

Sit it regularly and compare your results. If your score rises but you still run out of time, speed is the gap, and the topic pages above are the place to drill it. If you finish with time to spare but still miss questions, slow down and check. When you want the full two hours, take the [Full-Length Aptitude Paper](/tests/full-length-aptitude); when you want a particular company's shape, sit its own pattern.

### On the day

A minute a question means no single question deserves more than two. Make a first pass answering everything you can do in under a minute and skipping the rest, then use what is left on the skipped questions, the quickest-looking first. With no negative marking, put an answer against every question before the thirty minutes run out, even if the last few are guesses. Afterwards, look at which kind of question you skipped most often: that is where your next half hour of practice should go.

This sprint is not modelled on any company's published pattern but is CodeKairo's own short diagnostic at services-paper pace, and CodeKairo is not affiliated with any employer.`,
};

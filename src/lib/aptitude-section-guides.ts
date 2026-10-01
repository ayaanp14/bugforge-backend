/**
 * A written introduction for each aptitude section hub, /aptitude/<category>,
 * keyed by the category id in APTITUDE_CATEGORIES (lib/aptitude-topics.ts).
 *
 * Why this exists: the 2026-10-01 SEO/content audit found the five section
 * hubs carried one sentence of their own, the category blurb, above a list
 * of topics: 62 to 116 words that were the page's own, thin beside the
 * topic pages (lib/aptitude-essentials.ts) and the pattern pages
 * (lib/test-guides.ts) on either side of them, and nothing a reader
 * deciding where to start could act on.
 *
 * Each guide says what the section tests, how placement papers time it,
 * how to practise it topic by topic, and the one or two traps typical of
 * it. Every figure (which patterns include the section, question counts,
 * minutes, negative marking, reported cut-offs) is restated from the
 * blueprints in scripts/mock-test-data/index.ts and the guides in
 * lib/test-guides.ts; seconds a question are arithmetic on those. Nothing
 * is added about a company beyond what they already say, and a company is
 * named only as the subject of a pattern "modelled on" its paper. When a
 * blueprint is added or changes, recount here: "17 of the 29 patterns"
 * goes stale with it. The traps are the ones the topics' own essentials
 * sheets warn about.
 *
 * Links go only to topic pages (/aptitude/<topic id> from APTITUDE_TOPICS).
 * The Markdown keeps to what lib/markdown-html.ts renders and react-markdown
 * draws the same way: paragraphs, one level of list, bold, links and "###"
 * subsections, never a higher heading, since the hub has its own H1. No
 * bare asterisk (multiplication is ×) and no backtick. The text is flush
 * left inside each template literal because four leading spaces would make
 * a Markdown code block. British spelling, like the bank.
 */
export const APTITUDE_SECTION_GUIDES: Readonly<Record<string, string>> = {
  quantitative: `Quantitative aptitude is arithmetic against the clock: percentages, ratios, rates and counting, where a method beats a long calculation. Of the 29 patterns in the mock-test catalogue, 17 draw quantitative questions, usually as a section of 10 to 30.

### How it is timed

Most patterns allow 60 to 84 seconds a question. The patterns modelled on Wipro's NLTH, HCLTech and Adobe give a minute (16 questions in 16 minutes, 15 in 15, 20 in 20); those modelled on the TCS NQT Foundation and Cognizant GenC give 75 and 84 seconds (20 in 25, 25 in 35). Two are slow by design: the patterns modelled on Infosys's Systems Engineer paper and Zoho's Round 1 set 10 questions in 35 minutes and four minutes a question. In nine patterns about a fifth of the numerical section is data interpretation, so the TCS Foundation's 20 hold 16 quantitative questions and 4 data ones. Only the patterns modelled on Tech Mahindra and Goldman Sachs take marks off for a wrong answer.

### How to practise

Start with the topics the pattern guides name most often: [Percentages](/aptitude/percentages), [Ratio & Proportion](/aptitude/ratio-and-proportion), [Profit & Loss](/aptitude/profit-and-loss), [Time & Work](/aptitude/time-and-work), [Time, Speed & Distance](/aptitude/time-speed-distance) and [Averages](/aptitude/averages). Then [Number System](/aptitude/number-system), [Simple & Compound Interest](/aptitude/interest), [Problems on Ages](/aptitude/ages), [Mixtures & Alligation](/aptitude/mixtures-alligation) and [Mensuration](/aptitude/mensuration); the harder papers add [Permutations & Combinations](/aptitude/permutations-combinations) and [Probability](/aptitude/probability). Each topic page opens with its formulas.

### Typical traps

Taking a percentage of the wrong base, when a change is measured against the starting value; and averaging two speeds over equal distances, when the average speed is 2ab ÷ (a + b), not (a + b) ÷ 2.`,

  logical: `Logical reasoning rewards a method more than knowledge: each question type has a procedure, and the marks go to whoever applies it without hesitating. Logical questions appear in 18 of the 29 patterns in the mock-test catalogue, usually as a section of 12 to 35 questions.

### How it is timed

The patterns modelled on HCLTech and Adobe give a minute a question (15 in 15 minutes, 20 in 20); those modelled on the TCS NQT Foundation, Wipro's NLTH and Cognizant GenC give about 75 seconds (20 in 25, 14 in 18, 35 in 45), and Cognizant's 35 make reasoning the largest section of that paper. The Infosys-modelled paper is slower: 15 questions in 25 minutes, then a separate Puzzle Solving section of 4 puzzles in 10. In nine patterns, every services one among them, the draw is half series, coding, blood relations and direction sense, and half syllogisms, seating, analogies and mathematical reasoning.

### How to practise

Make the quick four automatic first: [Number & Letter Series](/aptitude/number-series), [Coding & Decoding](/aptitude/coding-decoding), [Blood Relations](/aptitude/blood-relations) and [Direction Sense](/aptitude/direction-sense). Then work [Syllogisms](/aptitude/syllogisms), [Seating & Puzzles](/aptitude/seating-arrangement), [Analogies & Classification](/aptitude/analogies-classification) and [Mathematical Reasoning](/aptitude/mathematical-reasoning) with a pencil: a Venn diagram or a seating grid is what saves the time.

### Typical traps

Judging a syllogism by what is true in the world rather than by what the statements say; and reading a relation the wrong way round, since 'How is A related to B?' asks what A is to B, not what B is to A.`,

  verbal: `Verbal ability is grammar, vocabulary and reading, and a paper rarely gives it more time a question than any other section. Verbal questions appear in 16 of the 29 patterns in the mock-test catalogue, always as a section of their own except in the thirty-minute mixed sprint.

### How it is timed

The usual pace is a minute a question: 25 in 25 minutes in the pattern modelled on the TCS NQT Foundation, 20 in 20 in those modelled on Infosys, Cognizant and Adobe, and 30 in 30 in the Capgemini-modelled English Communication section. Two are much tighter: the Wipro-modelled English Ability section allows about 38 seconds a question (22 in 14 minutes) and the Deloitte-modelled Language Skills about 46 (13 in 10). Some patterns gate on this section alone. The pattern modelled on Capgemini reports a 65 per cent cut-off on English, the higher of its two, and the one modelled on Oracle 60 per cent on each section.

### How to practise

[Sentence Correction](/aptitude/sentence-correction) and [Synonyms & Antonyms](/aptitude/vocabulary) should become answerable in seconds; that speed is what buys time for [Reading Comprehension](/aptitude/reading-comprehension). [Fill in the Blanks & Para Jumbles](/aptitude/sentence-completion) rewards naming the logic between the two halves of a sentence before reading the options. Read a passage's questions before the passage.

### Typical traps

Picking the option that feels related instead of the one that matches the definition, since antonym questions nearly always plant a synonym; and answering a passage question from outside knowledge. If you cannot point at the sentence, the option is unsupported.`,

  "data-interpretation": `Data interpretation hands you a table, a chart or a paragraph of figures and asks for a share, a growth rate or a total. It appears in 13 of the 29 patterns in the mock-test catalogue, but rarely as a section of its own.

### How it is timed

Usually the data questions sit inside a numerical section and share its clock, at 60 to 84 seconds a question: about a fifth of the section in the patterns modelled on the TCS NQT (4 of 20 questions), Cognizant GenC (5 of 25), Wipro's NLTH (3 of 16) and HCLTech (3 of 15). The Goldman Sachs-modelled Numerical Reasoning section is mostly data, 8 of its 12 questions, and the Amazon-modelled Logical Reasoning section carries 4 among its 24. Only two give it a section of its own: the pattern modelled on ZS Associates, 12 questions on an 18-minute budget, almost a quarter of its clock; and CodeKairo's full-length paper, 12 questions in 20 minutes.

### How to practise

Work [Tables & Charts](/aptitude/tables-and-charts) for tables and charts, and [Caselets](/aptitude/caselets) for figures buried in a paragraph. Before any arithmetic, note the units, whether a totals row is given, and whether the question wants a row or a column. Then estimate, and calculate exactly only when two options are close.

### Typical traps

Measuring growth against the later value instead of the earlier one, which turns a 25 per cent rise into 20; and counting an overlap twice, when the readers of A or B are A + B − both.`,

  programming: `The programming section asks you to trace code, predict its output and recall computer-science facts, all as multiple choice. Eleven of the 29 patterns in the mock-test catalogue include one, and in some it outweighs the aptitude sections.

### How it is timed

Recall questions run at a minute or less: 30 in 25 minutes in the Deloitte-modelled Technical Skills section, 30 in 30 in the Morgan Stanley-modelled CS Fundamentals and 15 in 15 in the HCLTech-modelled Technical section. Tracing gets more time: the Infosys-modelled Pseudocode section allows 2 minutes a question, the Morgan Stanley-modelled Pseudo Code nearly 3 and the Zoho-modelled Technical section four and a half. The Accenture-modelled Pseudo Code block has 18 questions, as many as that paper's largest cognitive section, and the Capgemini-modelled Technical section is 40 questions in 45 minutes. In the pattern modelled on Tech Mahindra a wrong answer costs a quarter of a mark.

### How to practise

Begin with [Pseudocode](/aptitude/pseudocode) and [Programming Fundamentals](/aptitude/programming-fundamentals), the output-prediction core, and trace with a written table of every variable's value rather than predicting from the shape of the code. Then make [Data Structures & Algorithms](/aptitude/data-structures-mcq) and [OS, DBMS & Networks](/aptitude/os-dbms-networks) a matter of recall: complexities, scheduling, normal forms, SQL clause order and the OSI layers.

### Typical traps

Ignoring the question's own conventions, such as whether / is integer division and whether arrays start at 0 or 1; and misreading a loop bound by one, which changes every value printed after it.`,
};

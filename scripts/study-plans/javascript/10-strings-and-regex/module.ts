import { defineModule } from "../../dsl.js";

export default defineModule(import.meta.url, {
  slug: "strings-and-regex",
  title: "Strings, Unicode, regular expressions and parsing",
  blurb: "UTF-16 code units, code points and graphemes; normalisation, collation and Intl formatting; tagged templates; regular expressions from syntax to lookarounds, Unicode properties, escaping and ReDoS; tokenizers and recursive-descent parsers.",
  icon: "text",
  overview: `Text is where most programs meet the real world, and JavaScript's text model has a gap at its centre: a string is a sequence of UTF-16 code units, while users type characters. Every "impossible" string bug — a length of 2 for one emoji, identical-looking strings that compare unequal, a reversed name full of question marks — comes from that gap, and every fix is knowing which layer a task needs: code units, code points or grapheme clusters.

The module opens with that model and the tools at each layer, then the string toolbox with its exact semantics, tagged templates as the mechanism behind \`html\`/\`sql\` tags, and \`Intl\` for anything shown to a reader. Two lessons cover regular expressions: the complete syntax with flags, groups and the five methods (and the \`lastIndex\` trap), then the practical layer — lookarounds, \`\\p{L}\`, function replacers, escaping input, and the catastrophic-backtracking patterns that turn one request into a denial of service. The last lesson goes past regex: a sticky-flag tokenizer, a recursive-descent parser where precedence is structural, CSV's quoting rules as a state machine, and errors that carry positions.

The exercises measure surrogate pairs and graphemes, normalise and collate, format a table with \`Intl\`, write \`html\` and \`sql\` tags, drive every regex method and watch \`lastIndex\`, extract dates with named groups, insert thousands separators with a lookahead, escape a search query, parse CSV and arithmetic — and finish with a Unicode-aware word-statistics tool, a template renderer, and a calculator with variables and right-associative exponents.`,
  lessons: [
    {
      slug: "unicode-and-string-internals",
      file: "01-unicode-and-string-internals.md",
      exercises: [
        {
          title: "Code units, code points, graphemes",
          prompt: `The input is a list of hexadecimal code points; build the string with \`String.fromCodePoint\`. Print \`length=<code units> codePoints=<[...s].length> graphemes=<Intl.Segmenter grapheme count>\`; \`units=<each charCodeAt in hex>\`; \`codePoint0=<hex> charCode0=<hex> isPair=<first code point above 0xFFFF>\`; \`reverseNaive=<code points of s.split("").reverse().join("")>\` and \`reverseByCodePoint=<code points of [...s].reverse().join("")>\` (both as hex code points via the starter's \`hex\`); and \`sliceHalf=<hex of s.slice(0, 1)> at(-1)=<hex of s.at(-1)> last=<hex of [...s].at(-1)>\`.

Example: \`1F600 61\` (😀a) →
\`\`\`
length=3 codePoints=2 graphemes=2
units=d83d de00 61
codePoint0=1f600 charCode0=d83d isPair=true
reverseNaive=61 de00 d83d
reverseByCodePoint=61 1f600
sliceHalf=d83d at(-1)=61 last=61
\`\`\`
The naive reverse produced two lone surrogates; \`slice(0, 1)\` cut the emoji in half.`,
          starterFile: "code/code-points.starter.js",
          solutionFile: "code/code-points.solution.js",
          hints: ["Array.from({ length: s.length }, (_, i) => s.charCodeAt(i)) walks code units; [...s] walks code points.", "new Intl.Segmenter(\"en\", { granularity: \"grapheme\" }).segment(s) is iterable — spread and count."],
          cases: [
            { stdin: "1F600 61", expected: "length=3 codePoints=2 graphemes=2\nunits=d83d de00 61\ncodePoint0=1f600 charCode0=d83d isPair=true\nreverseNaive=61 de00 d83d\nreverseByCodePoint=61 1f600\nsliceHalf=d83d at(-1)=61 last=61\n" },
            { stdin: "1F468 200D 1F469 200D 1F467", expected: "length=8 codePoints=5 graphemes=1\nunits=d83d dc68 200d d83d dc69 200d d83d dc67\ncodePoint0=1f468 charCode0=d83d isPair=true\nreverseNaive=dc67 d83d 200d dc69 d83d 200d dc68 d83d\nreverseByCodePoint=1f467 200d 1f469 200d 1f468\nsliceHalf=d83d at(-1)=dc67 last=1f467\n", hidden: true },
            { stdin: "61 62 63", expected: "length=3 codePoints=3 graphemes=3\nunits=61 62 63\ncodePoint0=61 charCode0=61 isPair=false\nreverseNaive=63 62 61\nreverseByCodePoint=63 62 61\nsliceHalf=61 at(-1)=63 last=63\n", hidden: true },
          ],
        },
        {
          title: "Normalise, then compare like a human",
          prompt: `Line 1 holds the same word twice — precomposed and decomposed (\`é\` as U+00E9 versus \`e\` + U+0301). Line 2 is a word list. Print \`equal=<a === b> normalizedEqual=<NFC forms equal> lengths=<a.length>,<b.length> nfdLengths=<NFD lengths>\`; \`sortDefault=<[...words].sort()>\`; \`sortCollator=<sorted with new Intl.Collator("en", { numeric: true }).compare>\`; \`baseEqual(Apple,apple)=<bool> baseEqual(e,é)=<bool>\` using a collator with \`sensitivity: "base"\`; and \`upper=<"straße".toUpperCase()> lengthChange=<before>-><after> turkishI=<"i".toLocaleUpperCase("tr") code point in hex>\`.

Example: \`café café\` / \`banana Apple apple Éclair zebra file10 file2\` →
\`\`\`
equal=false normalizedEqual=true lengths=4,5 nfdLengths=5,5
sortDefault=Apple apple banana file10 file2 zebra Éclair
sortCollator=apple Apple banana Éclair file2 file10 zebra
baseEqual(Apple,apple)=true baseEqual(e,é)=true
upper=STRASSE lengthChange=6->7 turkishI=130
\`\`\`
Default sort put the accented word last and \`file10\` before \`file2\`; the collator fixed both.`,
          starterFile: "code/normalize-and-compare.starter.js",
          solutionFile: "code/normalize-and-compare.solution.js",
          hints: ["Build ß and é with String.fromCodePoint(0xdf) / (0xe9) so the source stays ASCII.", "Create each Intl.Collator once and pass collator.compare to sort."],
          cases: [
            { stdin: "caf\u00e9 cafe\u0301\nbanana Apple apple \u00c9clair zebra file10 file2\n", expected: "equal=false normalizedEqual=true lengths=4,5 nfdLengths=5,5\nsortDefault=Apple apple banana file10 file2 zebra \u00c9clair\nsortCollator=apple Apple banana \u00c9clair file2 file10 zebra\nbaseEqual(Apple,apple)=true baseEqual(e,\u00e9)=true\nupper=STRASSE lengthChange=6->7 turkishI=130\n" },
            { stdin: "\u00f1 n\u0303\nb a B A\n", expected: "equal=false normalizedEqual=true lengths=1,2 nfdLengths=2,2\nsortDefault=A B a b\nsortCollator=a A b B\nbaseEqual(Apple,apple)=true baseEqual(e,\u00e9)=true\nupper=STRASSE lengthChange=6->7 turkishI=130\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "`\"😀\".length` is 2 because…",
          options: ["Emoji are two characters", "Strings are UTF-16 code units and the emoji is a surrogate pair — one code point, two units", "It counts the variation selector", "It is a bug"],
          answer: 1,
          explanation: "`[...\"😀\"].length` is 1; a family emoji is several code points but one grapheme.",
        },
        {
          prompt: "Two strings render identically but `===` is false. The likely cause is…",
          options: ["Different fonts", "Precomposed versus decomposed characters — normalise both with `normalize(\"NFC\")` before comparing", "Trailing whitespace only", "Case"],
          answer: 1,
          explanation: "Keyboards, OSes and copy-paste produce both forms.",
        },
        {
          prompt: "`[\"b\", \"a\", \"B\", \"É\"].sort()` puts `É`…",
          options: ["First", "Last — default sort compares code units, and accented letters sit above ASCII; use `localeCompare`/`Intl.Collator`", "Between `a` and `b`", "It throws"],
          answer: 1,
          explanation: "`numeric: true` also fixes `file10` sorting before `file2`.",
        },
        {
          prompt: "Counting visible characters correctly needs…",
          options: ["`length`", "`Intl.Segmenter` with `granularity: \"grapheme\"` — code points still split combined emoji", "`split(\"\")`", "`charCodeAt`"],
          answer: 1,
          explanation: "Code points (`[...s]`) are right for many tasks; graphemes for what the user sees.",
        },
        {
          prompt: "`\"straße\".toUpperCase()`…",
          options: ["Is `\"STRAßE\"`", "Is `\"STRASSE\"` — case mapping is Unicode-aware and can change length", "Throws", "Depends on the locale"],
          answer: 1,
          explanation: "Locale matters elsewhere: `\"i\".toLocaleUpperCase(\"tr\")` is `İ`.",
        },
      ],
    },
    {
      slug: "string-methods-and-formatting",
      file: "02-string-methods-and-formatting.md",
      exercises: [
        {
          title: "An aligned report with Intl",
          prompt: `Each line is \`name amount\`. Print an aligned table: a header \`Name | Amount | Share\` (name column padded to the longest name, at least 4; amount column right-aligned to the widest formatted amount, at least 6), a rule of dashes, one row per entry with the amount from \`Intl.NumberFormat("en-US", { style: "currency", currency: "USD" })\` and the share of the total as a percent with at most one decimal (padded to 5), a \`Total\` row, and finally \`compact=<total in compact notation> de=<total as EUR in de-DE> toFixed=<total.toFixed(2)>\`.

Example: \`rent 1200\`, \`coffee 47.5\`, \`cloud 1350000\` →
\`\`\`
Name   |        Amount | Share
-------+---------------+------
rent   |     $1,200.00 |  0.1%
coffee |        $47.50 |    0%
cloud  | $1,350,000.00 | 99.9%
Total  | $1,351,247.50 |  100%
compact=1.4M de=1.351.247,50 € toFixed=1351247.50
\`\`\``,
          starterFile: "code/format-table.starter.js",
          solutionFile: "code/format-table.solution.js",
          hints: ["Format every amount first, then measure: the column width is the longest formatted string.", "Create the three Intl.NumberFormat objects once, outside the loop."],
          cases: [
            { stdin: "rent 1200\ncoffee 47.5\ncloud 1350000\n", expected: "Name   |        Amount | Share\n-------+---------------+------\nrent   |     $1,200.00 |  0.1%\ncoffee |        $47.50 |    0%\ncloud  | $1,350,000.00 | 99.9%\nTotal  | $1,351,247.50 |  100%\ncompact=1.4M de=1.351.247,50 \u20ac toFixed=1351247.50\n" },
            { stdin: "x 0\n", expected: "Name | Amount | Share\n-----+--------+------\nx    |  $0.00 |    0%\nTotal |  $0.00 |    0%\ncompact=0 de=0,00 \u20ac toFixed=0.00\n", hidden: true },
          ],
        },
        {
          title: "html and sql tags",
          prompt: `Write two tag functions. \`html\` joins the literal parts and HTML-escapes every interpolated value (\`& < > " '\`). \`sql\` replaces every interpolation with \`$1\`, \`$2\`, … and returns \`{ text, values }\`. Input: three lines — a name, a comment, an id. Print \`html\\\`<p class="by">\${name}</p><blockquote>\${comment}</blockquote>\\\`\`, then the \`sql\` query \`SELECT * FROM comments WHERE author = \${name} AND id = \${Number(id)}\` as \`<text> -- <JSON values>\`, then a diagnostic tag applied to \`\\\`a\\\\n\${1}b\${2}\\\`\` printing \`strings=<JSON> raw=<JSON of strings.raw> values=<JSON>\`, then \`raw=<String.raw\\\`C:\\\\new\\\\table\\\`> interpolated=<length of \\\`C:\\\\new\\\`>\`.

Example: \`Ada <script>alert(1)</script>\` / \`I "love" it & more\` / \`42\` →
\`\`\`
<p class="by">Ada &lt;script&gt;alert(1)&lt;/script&gt;</p><blockquote>I &quot;love&quot; it &amp; more</blockquote>
SELECT * FROM comments WHERE author = $1 AND id = $2 -- ["Ada <script>alert(1)</script>",42]
strings=["a\\n","b",""] raw=["a\\\\n","b",""] values=[1,2]
raw=C:\\new\\table interpolated=5
\`\`\``,
          starterFile: "code/tagged-templates.starter.js",
          solutionFile: "code/tagged-templates.solution.js",
          hints: ["strings.reduce((out, str, i) => out + str + (i < values.length ? transform(values[i]) : \"\"), \"\") is the shape of every tag.", "strings.raw keeps the backslash escapes exactly as typed."],
          cases: [
            { stdin: "Ada <script>alert(1)</script>\nI \"love\" it & more\n42\n", expected: "<p class=\"by\">Ada &lt;script&gt;alert(1)&lt;/script&gt;</p><blockquote>I &quot;love&quot; it &amp; more</blockquote>\nSELECT * FROM comments WHERE author = $1 AND id = $2 -- [\"Ada <script>alert(1)</script>\",42]\nstrings=[\"a\\n\",\"b\",\"\"] raw=[\"a\\\\n\",\"b\",\"\"] values=[1,2]\nraw=C:\\new\\table interpolated=5\n" },
            { stdin: "plain\nno specials\n7\n", expected: "<p class=\"by\">plain</p><blockquote>no specials</blockquote>\nSELECT * FROM comments WHERE author = $1 AND id = $2 -- [\"plain\",7]\nstrings=[\"a\\n\",\"b\",\"\"] raw=[\"a\\\\n\",\"b\",\"\"] values=[1,2]\nraw=C:\\new\\table interpolated=5\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "`\"a,b,\".split(\",\")` is…",
          options: ["`[\"a\", \"b\"]`", "`[\"a\", \"b\", \"\"]` — a trailing separator yields an empty last element", "`[\"a\", \"b\", null]`", "An error"],
          answer: 1,
          explanation: "`\"\".split(\",\")` is `[\"\"]`, not `[]`.",
        },
        {
          prompt: "A tag function receives…",
          options: ["The finished string", "The array of literal parts (with a `.raw` view) and the interpolated values separately, before any joining", "A regex", "Only the values"],
          answer: 1,
          explanation: "So it can escape, parameterise or transform — `html`, `sql`, `css`.",
        },
        {
          prompt: "`\"x\".replace(\"a\", \"b\")` replaces…",
          options: ["Every `a`", "Only the first occurrence — use `replaceAll` or a `g` regex for all", "Nothing", "Every character"],
          answer: 1,
          explanation: "And a string replacement interprets `$` sequences — use a function when the replacement is data.",
        },
        {
          prompt: "Formatting `1234567.891` for a German reader should use…",
          options: ["`toFixed(3)` and manual dots", "`new Intl.NumberFormat(\"de-DE\").format(n)` → `1.234.567,891`", "`toLocaleString()` with no locale", "String replacement of `.` with `,`"],
          answer: 1,
          explanation: "Always pass a locale; create the formatter once and reuse it.",
        },
        {
          prompt: "`\"abc\".substring(2, 0)` is…",
          options: ["`\"\"`", "`\"ab\"` — `substring` swaps reversed arguments; `slice(2, 0)` would give `\"\"`", "`\"c\"`", "An error"],
          answer: 1,
          explanation: "Prefer `slice`; it also supports negative indices.",
        },
      ],
    },
    {
      slug: "regular-expressions",
      file: "03-regular-expressions.md",
      exercises: [
        {
          title: "One regex, every method",
          prompt: `Line 1 is a pattern, line 2 its flags (\`-\` for none), the rest are subjects. Build the regex and print \`regex=<String(re)> global=<re.global> unicode=<re.unicode>\`. For each subject, using a **fresh** regex object each time, print \`<JSON subject>: test=<bool> match=<JSON of the match array or null>\` plus \` groups=<JSON>\` when the match has named groups. Finally call \`test\` on the **same** regex object three times against the first subject and print \`sameRegexThrice=<results> lastIndex=<lastIndex after each>\`.

Example: \`(?<user>\\w+)@(?<host>[\\w.]+)\` with flags \`g\`, subjects \`ada@example.com and bob@x.io\` and \`nobody here\` →
\`\`\`
regex=/(?<user>\\w+)@(?<host>[\\w.]+)/g global=true unicode=false
"ada@example.com and bob@x.io": test=true match=["ada@example.com","bob@x.io"]
"nobody here": test=false match=null
sameRegexThrice=true,true,false lastIndex=15,28,0
\`\`\`
With \`g\`, \`match\` returns whole matches only (no groups), and \`test\` on a reused regex walks through the string and then fails.`,
          starterFile: "code/regex-lab.starter.js",
          solutionFile: "code/regex-lab.solution.js",
          hints: ["new RegExp(pattern, flags) inside the loop gives each subject a clean lastIndex.", "match(...) returns an array with extra properties; JSON.stringify([...m]) prints just the elements."],
          cases: [
            { stdin: "(?<user>\\w+)@(?<host>[\\w.]+)\ng\nada@example.com and bob@x.io\nnobody here\n", expected: "regex=/(?<user>\\w+)@(?<host>[\\w.]+)/g global=true unicode=false\n\"ada@example.com and bob@x.io\": test=true match=[\"ada@example.com\",\"bob@x.io\"]\n\"nobody here\": test=false match=null\nsameRegexThrice=true,true,false lastIndex=15,28,0\n" },
            { stdin: "^a.c$\ni\nabc\nAXC\na-c\nabcd\n", expected: "regex=/^a.c$/i global=false unicode=false\n\"abc\": test=true match=[\"abc\"]\n\"AXC\": test=true match=[\"AXC\"]\n\"a-c\": test=true match=[\"a-c\"]\n\"abcd\": test=false match=null\nsameRegexThrice=true,true,true lastIndex=0,0,0\n", hidden: true },
            { stdin: "colou?r\n-\ncolor colour\n", expected: "regex=/colou?r/ global=false unicode=false\n\"color colour\": test=true match=[\"color\"]\nsameRegexThrice=true,true,true lastIndex=0,0,0\n", hidden: true },
          ],
        },
        {
          title: "Dates with named groups and matchAll",
          prompt: `With \`DATE = /(?<y>\\d{4})-(?<m>\\d{2})-(?<d>\\d{2})/g\`, print: \`dates=<count>: <match@index …>\` from \`matchAll\`; \`british=<text with every date rewritten as $<d>/$<m>/$<y>>\`; \`years=<comma list> latest=<max date string or none>\`; \`numbers=<JSON of every \\d+ run as numbers>\`; \`parts=<JSON of text.split(/\\s*[,;]\\s*/)>\`; and \`matchWithG=<JSON of text.match(DATE)> firstExec=<JSON of the groups from exec with a non-global copy, or null>\`.

Example: \`release 2024-03-15, patch 2024-04-02; eol 2025-01-31 (build 77)\` →
\`\`\`
dates=3: 2024-03-15@8 2024-04-02@26 2025-01-31@42
british=release 15/03/2024, patch 02/04/2024; eol 31/01/2025 (build 77)
years=2024,2024,2025 latest=2025-01-31
numbers=[2024,3,15,2024,4,2,2025,1,31,77]
parts=["release 2024-03-15","patch 2024-04-02","eol 2025-01-31 (build 77)"]
matchWithG=["2024-03-15","2024-04-02","2025-01-31"] firstExec={"y":"2024","m":"03","d":"15"}
\`\`\``,
          starterFile: "code/matchall-dates.starter.js",
          solutionFile: "code/matchall-dates.solution.js",
          hints: ["[...text.matchAll(DATE)] gives every match with .index and .groups.", "new RegExp(DATE.source) drops the g flag so exec returns the first match with groups."],
          cases: [
            { stdin: "release 2024-03-15, patch 2024-04-02; eol 2025-01-31 (build 77)\n", expected: "dates=3: 2024-03-15@8 2024-04-02@26 2025-01-31@42\nbritish=release 15/03/2024, patch 02/04/2024; eol 31/01/2025 (build 77)\nyears=2024,2024,2025 latest=2025-01-31\nnumbers=[2024,3,15,2024,4,2,2025,1,31,77]\nparts=[\"release 2024-03-15\",\"patch 2024-04-02\",\"eol 2025-01-31 (build 77)\"]\nmatchWithG=[\"2024-03-15\",\"2024-04-02\",\"2025-01-31\"] firstExec={\"y\":\"2024\",\"m\":\"03\",\"d\":\"15\"}\n" },
            { stdin: "no dates here 123\n", expected: "dates=0: \nbritish=no dates here 123\nyears= latest=none\nnumbers=[123]\nparts=[\"no dates here 123\"]\nmatchWithG=null firstExec=null\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "`/a/g.test(\"a\")` twice on the same regex object gives…",
          options: ["`true, true`", "`true, false` — the `g` flag makes `test` resume from `lastIndex`", "`false, true`", "An error"],
          answer: 1,
          explanation: "Never reuse a global regex for `test`; use a fresh one or reset `lastIndex`.",
        },
        {
          prompt: "`\"<a><b>\".match(/<.+>/)[0]` is…",
          options: ["`\"<a>\"`", "`\"<a><b>\"` — greedy `.+` takes as much as possible; `<[^>]+>` (or lazy `.+?`) gives `\"<a>\"`", "`\"<b>\"`", "`null`"],
          answer: 1,
          explanation: "A negated class is usually better than a lazy quantifier.",
        },
        {
          prompt: "`str.match(/(\\d+)-(\\d+)/g)` returns…",
          options: ["Every match with its groups", "Only the whole matches — with `g`, `match` drops groups; use `matchAll` for groups", "The first match with groups", "`null` always"],
          answer: 1,
          explanation: "`matchAll` requires the `g` flag and yields full match objects.",
        },
        {
          prompt: "`\\w` and `\\b` in a regex with the `u` flag match…",
          options: ["Letters in every language", "ASCII word characters only — use `\\p{L}` (with `u`) for international letters", "Emoji", "Whitespace"],
          answer: 1,
          explanation: "`u` fixes code-point handling and `\\p{…}`, not the ASCII classes.",
        },
        {
          prompt: "`(?<year>\\d{4})` can be referenced in a replacement as…",
          options: ["`\\year`", "`$<year>` in a replacement string, `m.groups.year` in a match, `\\k<year>` inside the pattern", "`%year`", "`{year}`"],
          answer: 1,
          explanation: "Named groups make patterns readable and replacements robust to reordering.",
        },
      ],
    },
    {
      slug: "regex-in-practice",
      file: "04-regex-in-practice.md",
      exercises: [
        {
          title: "Lookarounds, Unicode properties and a validation table",
          prompt: `Line 1: numbers — print \`grouped=<each with thousands separators via \\B(?=(\\d{3})+(?!\\d))>\`. Line 2: text — print \`letters=<\\p{L} count> asciiWordChars=<\\w count> digits=<\\p{Nd} count> words=<runs of [\\p{L}\\p{M}]+>\` (all with the \`u\` flag). Line 3: candidate passwords — print \`passwords=<pw:bool …>\` for \`/^(?=.*\\d)(?=.*[a-z])(?=.*[A-Z]).{8,}$/\`. Remaining lines \`<kind> <value>\` validate against: \`hex\` \`^#(?:[0-9a-f]{3}){1,2}$\` (case-insensitive), \`ipv4\` (each octet 0–255), \`date\` (\`YYYY-MM-DD\` shape with month 01–12 and day 01–31), \`slug\` \`^[a-z0-9]+(?:-[a-z0-9]+)*$\`; print \`<kind> <value>: <bool>\`.

Example (excerpt):
\`\`\`
grouped=1,234,567 42 1,000 999,999
letters=11 asciiWordChars=9 digits=2 words=3
passwords=abc12345:false Passw0rdX:true short1A:false
hex #12345g: false
ipv4 256.1.1.1: false
date 2024-02-30: true
\`\`\`
The date regex validates shape, not the calendar — \`2024-02-30\` passes; a \`Date\` would reject it.`,
          starterFile: "code/lookarounds-and-unicode.starter.js",
          solutionFile: "code/lookarounds-and-unicode.solution.js",
          hints: ["(text.match(/\\p{L}/gu) ?? []).length counts letters in any script; \\w counts only ASCII.", "Stack independent lookaheads at the start of the password pattern, then .{8,} for the length."],
          cases: [
            { stdin: "1234567 42 1000 999999\ncaf\u00e9 \u65e5\u672c 42 na\u00efve\nabc12345 Passw0rdX short1A\nhex #fff\nhex #12345g\nipv4 192.168.1.255\nipv4 256.1.1.1\ndate 2024-02-30\ndate 2024-13-01\nslug hello-world-2\nslug Hello_World\n", expected: "grouped=1,234,567 42 1,000 999,999\nletters=11 asciiWordChars=9 digits=2 words=3\npasswords=abc12345:false Passw0rdX:true short1A:false\nhex #fff: true\nhex #12345g: false\nipv4 192.168.1.255: true\nipv4 256.1.1.1: false\ndate 2024-02-30: true\ndate 2024-13-01: false\nslug hello-world-2: true\nslug Hello_World: false\n" },
          ],
        },
        {
          title: "Escape the query, flag the dangerous pattern",
          prompt: `Line 1 is a user's search query; the following lines are texts to search, except lines starting with \`pattern \` which are regex sources to inspect. Escape the query with \`escapeRegExp\` (in the starter), build a case-insensitive global regex, and print each text with matches wrapped in \`[…]\` followed by \`(<count>)\`. Then try the **unescaped** query as a regex and print \`unescaped: matches <total across texts> (<source>)\` or \`unescaped: <error constructor name>\` if it does not compile. Finally, for each \`pattern\`, print \`pattern <p>: suspicious\` when a quantified group contains a quantifier or two open-ended quantified pieces (\`\\w+\`, \`.*\`, \`\\s+\`…) sit next to each other, else \`ok\`.

Example: query \`a.c\`, texts \`abc a.c aXc\` and \`A.C matches?\`, patterns \`(\\w+\\s?)*$\`, \`^[a-z]+$\`, \`(a+)+b\`, \`\\d{1,5}-\\d{1,5}\` →
\`\`\`
abc [a.c] aXc (1)
[A.C] matches? (1)
unescaped: matches 5 (a.c)
pattern (\\w+\\s?)*$: suspicious
pattern ^[a-z]+$: ok
pattern (a+)+b: suspicious
pattern \\d{1,5}-\\d{1,5}: ok
\`\`\`
Unescaped, the dot matched \`abc\`, \`aXc\` and more — five hits instead of two.`,
          starterFile: "code/safe-search.starter.js",
          solutionFile: "code/safe-search.solution.js",
          hints: ["Wrap new RegExp(rawQuery) in try/catch — an unbalanced parenthesis throws a SyntaxError.", "The heuristic can be simple: /\\([^()]*[+*][^()]*\\)[+*{]/ catches (…+)+ and (…*)*; it is a linter, not a proof."],
          cases: [
            { stdin: "a.c\nabc a.c aXc\nA.C matches?\npattern (\\w+\\s?)*$\npattern ^[a-z]+$\npattern (a+)+b\npattern \\d{1,5}-\\d{1,5}\n", expected: "abc [a.c] aXc (1)\n[A.C] matches? (1)\nunescaped: matches 5 (a.c)\npattern (\\w+\\s?)*$: suspicious\npattern ^[a-z]+$: ok\npattern (a+)+b: suspicious\npattern \\d{1,5}-\\d{1,5}: ok\n" },
            { stdin: "(x\nnothing (x here\n", expected: "nothing [(x] here (1)\nunescaped: SyntaxError\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "`x(?=y)` matches…",
          options: ["`xy`", "`x` only when followed by `y`, without consuming `y` — a zero-width lookahead", "`y`", "`x` or `y`"],
          answer: 1,
          explanation: "Stacked lookaheads at the start express \"all of these must hold\".",
        },
        {
          prompt: "`/^(\\w+\\s?)*$/` on a long non-matching string…",
          options: ["Fails instantly", "Can take exponential time — overlapping quantifiers make the engine try every split (catastrophic backtracking / ReDoS)", "Matches anyway", "Throws"],
          answer: 1,
          explanation: "Make each repetition consume something unambiguous: `\\w+(\\s\\w+)*`.",
        },
        {
          prompt: "Before `new RegExp(userInput)` you must…",
          options: ["Lower-case it", "Escape regex metacharacters — otherwise `.` matches anything and `(` throws", "Trim it", "Nothing"],
          answer: 1,
          explanation: "`s.replace(/[.*+?^${}()|[\\]\\\\]/g, \"\\\\$&\")`.",
        },
        {
          prompt: "A `replace` callback's return value…",
          options: ["Interprets `$1`", "Is inserted literally — `$` sequences are **not** interpreted, which makes it the safe form for data-driven replacements", "Must be a regex", "Is ignored"],
          answer: 1,
          explanation: "The callback receives `(match, ...groups, offset, input, namedGroups)`.",
        },
        {
          prompt: "Parsing HTML with a regex…",
          options: ["Is fine for small pages", "Breaks on nesting, attributes, comments and whitespace — use a parser; regex is for tokens", "Is faster and correct", "Is required by browsers"],
          answer: 1,
          explanation: "Same for JSON (`JSON.parse`), URLs (`new URL`) and balanced parentheses.",
        },
      ],
    },
    {
      slug: "parsing-text",
      file: "05-parsing-text.md",
      exercises: [
        {
          title: "A CSV line parser",
          prompt: `Implement \`parseCsvLine(line)\` following RFC 4180: fields separated by commas; a field may be wrapped in double quotes, inside which commas are literal and a quote is written as two quotes; an unterminated quoted field throws \`SyntaxError("unterminated quoted field")\`. Print each line's fields as JSON, or \`error: <message>\`.

Example:
\`\`\`
ada,36,London
"Smith, John",41,"He said ""hi"""
,,
"unterminated,1
plain
\`\`\`
→
\`\`\`
["ada","36","London"]
["Smith, John","41","He said \\"hi\\""]
["","",""]
error: unterminated quoted field
["plain"]
\`\`\``,
          starterFile: "code/csv-parser.starter.js",
          solutionFile: "code/csv-parser.solution.js",
          hints: ["A character loop with an inQuotes flag: inside quotes, a quote followed by a quote is a literal quote; otherwise it closes the field.", "Push the final field after the loop — a line ending in a comma has an empty last field."],
          cases: [
            { stdin: "ada,36,London\n\"Smith, John\",41,\"He said \"\"hi\"\"\"\n,,\n\"unterminated,1\nplain", expected: "[\"ada\",\"36\",\"London\"]\n[\"Smith, John\",\"41\",\"He said \\\"hi\\\"\"]\n[\"\",\"\",\"\"]\nerror: unterminated quoted field\n[\"plain\"]\n" },
            { stdin: "\"a\",\"b\"\n", expected: "[\"a\",\"b\"]\n", hidden: true },
          ],
        },
        {
          title: "Tokenize and evaluate arithmetic",
          prompt: `Write \`tokenize(src)\` with the starter's sticky regex (numbers and the operators \`+ - * / ( )\`), recording each token's position and appending an \`eof\` token; an unexpected character throws \`SyntaxError("unexpected character '<c>' at <pos>")\`. Then a recursive-descent \`evaluate\` over \`expr := term (('+'|'-') term)*\`, \`term := factor (('*'|'/') factor)*\`, \`factor := '-' factor | number | '(' expr ')'\`, throwing \`RangeError("division by zero at <pos of />")\`, \`SyntaxError("expected ')' but found <'tok' or end of input> at <pos>")\` and \`SyntaxError("unexpected <'tok' or end of input> at <pos>")\` (also for leftover tokens). Print \`<expression> = <value>\` or \`<Name>: <message>\` per line.

Example:
\`\`\`
2 + 3 * (4 - 1)
-(2 + 3) * 2
1 / 0
2 +
(1 + 2
3 $ 4
1 2
\`\`\`
→
\`\`\`
2 + 3 * (4 - 1) = 11
-(2 + 3) * 2 = -10
RangeError: division by zero at 2
SyntaxError: unexpected end of input at 3
SyntaxError: expected ')' but found end of input at 6
SyntaxError: unexpected character '$' at 2
SyntaxError: unexpected '2' at 2
\`\`\``,
          starterFile: "code/expression-evaluator.starter.js",
          solutionFile: "code/expression-evaluator.solution.js",
          hints: ["Precedence comes from the call structure: expr calls term, term calls factor.", "A token's position is m.index + m[0].length - value.length (the regex absorbs leading whitespace)."],
          cases: [
            { stdin: "2 + 3 * (4 - 1)\n-(2 + 3) * 2\n10 / 4\n1 / 0\n2 +\n(1 + 2\n3 $ 4\n1 2\n7\n", expected: "2 + 3 * (4 - 1) = 11\n-(2 + 3) * 2 = -10\n10 / 4 = 2.5\nRangeError: division by zero at 2\nSyntaxError: unexpected end of input at 3\nSyntaxError: expected ')' but found end of input at 6\nSyntaxError: unexpected character '$' at 2\nSyntaxError: unexpected '2' at 2\n7 = 7\n" },
            { stdin: "1.5 * 4\n-(-3)\n", expected: "1.5 * 4 = 6\n-(-3) = 3\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "The sticky flag `y` makes `exec`…",
          options: ["Match anywhere after `lastIndex`", "Match only at exactly `lastIndex` and advance it — the tokenizer primitive", "Match all occurrences", "Ignore case"],
          answer: 1,
          explanation: "A failed match at a position means an illegal character, and you know where.",
        },
        {
          prompt: "In a recursive-descent parser, `*` binds tighter than `+` because…",
          options: ["Of an operator table", "`expr` calls `term` for its operands and `term` calls `factor` — precedence is the nesting of the grammar functions", "Of left-to-right scanning", "It is hard-coded in `Math`"],
          answer: 1,
          explanation: "Left-associativity comes from the `while` loop; right-associativity from recursing on the right.",
        },
        {
          prompt: "`split(\",\")` cannot parse CSV because…",
          options: ["It is too slow", "Quoted fields may contain commas and doubled quotes — you need a state machine over characters", "CSV uses semicolons", "It drops empty fields"],
          answer: 1,
          explanation: "Multi-line quoted fields need the machine to run over the whole text, not per line.",
        },
        {
          prompt: "Why append an `eof` token?",
          options: ["Performance", "So the parser can check nothing is left over and report `unexpected '2'` instead of silently ignoring trailing input", "It is required by regex", "To mark line breaks"],
          answer: 1,
          explanation: "`1 2` should be an error, not `1`.",
        },
        {
          prompt: "Good parse errors…",
          options: ["Say \"invalid input\"", "Name the unexpected token and its position — converted to line/column for multi-line input", "List the grammar", "Are thrown only at the end"],
          answer: 1,
          explanation: "First error for a language; all errors for independent records.",
        },
      ],
    },
    {
      slug: "strings-checkpoint",
      file: "06-checkpoint.md",
      kind: "test",
      passMark: 70,
      exercises: [
        {
          title: "Unicode-aware word statistics",
          prompt: `Read the whole input. Extract words with \`Intl.Segmenter("en", { granularity: "word" })\` keeping segments where \`isWordLike\` is true, normalise each to NFC and lower-case. Print \`words=<count> unique=<distinct>\`; \`top=<three most frequent as word=n, ties by localeCompare>\`; \`longest=<the distinct word with the most graphemes, ties by localeCompare> graphemes=<n> codeUnits=<length>\`; \`letters=<\\p{L} count> digits=<\\p{Nd} count> emoji=<\\p{Extended_Pictographic} count>\` over the raw input; and \`sorted=<distinct words sorted with an Intl.Collator("en")>\`.

Example: \`The café was the CAFÉ we loved; the 日本語 menu had 3 items 😀\` →
\`\`\`
words=13 unique=10
top=the=3 café=2 3=1
longest=items graphemes=5 codeUnits=5
letters=42 digits=1 emoji=1
sorted=3 café had items loved menu the was we 日本語
\`\`\`
The two spellings of café (precomposed and decomposed) became one word after normalisation.`,
          starterFile: "code/word-stats.starter.js",
          solutionFile: "code/word-stats.solution.js",
          hints: ["[...segmenter.segment(text)].filter((s) => s.isWordLike).map((s) => s.segment) — punctuation and spaces are segments too, without isWordLike.", "Measure length with a grapheme segmenter so 日本語 counts 3 and an emoji sequence counts 1."],
          cases: [
            { stdin: "The caf\u00e9 was the CAFE\u0301 we loved; the \u65e5\u672c\u8a9e menu had 3 items \u{1F600}\n", expected: "words=13 unique=10\ntop=the=3 caf\u00e9=2 3=1\nlongest=items graphemes=5 codeUnits=5\nletters=42 digits=1 emoji=1\nsorted=3 caf\u00e9 had items loved menu the was we \u65e5\u672c\u8a9e\n" },
            { stdin: "one\n", expected: "words=1 unique=1\ntop=one=1\nlongest=one graphemes=3 codeUnits=3\nletters=3 digits=0 emoji=0\nsorted=one\n", hidden: true },
          ],
        },
        {
          title: "A template renderer built on replace",
          prompt: `Line 1 is a JSON context; the rest is a template. Implement \`render(tpl, ctx)\` with three passes of \`replace\` with functions: \`{{#each key}}…{{/each}}\` repeats the body for each array element with \`this\` and \`index\` added to the context (rendering the body recursively); \`{{#if key}}…{{/if}}\` keeps the body when the value is truthy; \`{{ path | filter | filter:arg }}\` looks up a dotted path and applies filters \`upper\`, \`lower\`, \`money\` (USD via Intl) and \`default:<text>\` (used when the value is undefined, null or empty); an unknown filter throws. Missing values render as empty. Print the result.

Example context \`{"name":"Ada","items":["pen","ink"],"total":12.5,"vip":true,"nick":""}\` and template
\`\`\`
Hello {{ name | upper }}!
{{#if vip}}Welcome back.{{/if}}
{{#each items}}- {{ this | upper }} ({{ index }})
{{/each}}Total: {{ total | money }} for {{ nick | default:friend }}{{#if missing}} never{{/if}}
\`\`\`
→
\`\`\`
Hello ADA!
Welcome back.
- PEN (0)
- INK (1)
Total: $12.50 for friend
\`\`\``,
          starterFile: "code/template-renderer.starter.js",
          solutionFile: "code/template-renderer.solution.js",
          hints: ["Blocks first (each, then if) with a lazy [\\s\\S]*? body so the closing tag is the nearest one; variables last.", "Split the filter chain on | and each filter on : for its argument."],
          cases: [
            { stdin: "{\"name\":\"Ada\",\"items\":[\"pen\",\"ink\"],\"total\":12.5,\"vip\":true,\"nick\":\"\"}\nHello {{ name | upper }}!\n{{#if vip}}Welcome back.{{/if}}\n{{#each items}}- {{ this | upper }} ({{ index }})\n{{/each}}Total: {{ total | money }} for {{ nick | default:friend }}{{#if missing}} never{{/if}}\n", expected: "Hello ADA!\nWelcome back.\n- PEN (0)\n- INK (1)\nTotal: $12.50 for friend\n" },
            { stdin: "{\"name\":\"bob\",\"items\":[],\"vip\":false}\n{{ name | lower }}{{#if vip}} vip{{/if}}{{#each items}}x{{/each}}|{{ absent }}|{{ name | default:z }}\n", expected: "bob||bob\n", hidden: true },
          ],
        },
        {
          title: "A calculator with variables and exponents",
          prompt: `Extend the expression evaluator: tokens are numbers, identifiers and \`+ - * / ^ ( ) =\`. A line is either \`name = expr\` (store the value in a \`Map\`, print \`name = value\`) or an expression (print its value). Grammar: \`term := unary (('*'|'/') unary)*\`, \`unary := '-' unary | power\`, \`power := primary ('^' unary)?\` — so \`^\` is right-associative, binds tighter than unary minus (\`-2 ^ 2\` is −4) and allows a negative exponent. An unknown variable throws \`ReferenceError("unknown variable 'z' at <pos>")\`; other errors as in the previous exercise. Variables persist across lines.

Example:
\`\`\`
x = 3 + 4
y = x * 2
y - x
2 ^ 3 ^ 2
-2 ^ 2
z + 1
\`\`\`
→
\`\`\`
x = 7
y = 14
7
512
-4
ReferenceError: unknown variable 'z' at 0
\`\`\``,
          starterFile: "code/calculator-with-variables.starter.js",
          solutionFile: "code/calculator-with-variables.solution.js",
          hints: ["Detect an assignment by looking at tokens[0].type === \"id\" && tokens[1].value === \"=\" before parsing an expression.", "power recurses into unary on the right (base ** unary()) — that is what makes 2 ^ 3 ^ 2 = 2 ^ 9."],
          cases: [
            { stdin: "x = 3 + 4\ny = x * 2\ny - x\n2 ^ 3 ^ 2\n-2 ^ 2\n(x + 1) / 0\nz + 1\nx = \n4 4\nx @ 2\n", expected: "x = 7\ny = 14\n7\n512\n-4\nRangeError: division by zero at 8\nReferenceError: unknown variable 'z' at 0\nSyntaxError: unexpected end of input at 4\nSyntaxError: unexpected '4' at 2\nSyntaxError: unexpected character '@' at 2\n" },
            { stdin: "a = 2\na ^ 10\n", expected: "a = 2\n1024\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "`[...\"👨‍👩‍👧\"].length` versus its grapheme count:",
          options: ["Both 1", "5 code points (three people and two joiners) but 1 grapheme", "8 and 1", "1 and 5"],
          answer: 1,
          explanation: "`.length` would say 8 code units.",
        },
        {
          prompt: "`\"e\\u0301\".normalize(\"NFC\")` is…",
          options: ["Unchanged", "`\"\\u00e9\"` — NFC composes base + combining mark into the precomposed character", "`\"e\"`", "An error"],
          answer: 1,
          explanation: "NFD does the reverse; NFKC additionally folds compatibility characters.",
        },
        {
          prompt: "A reused `Intl.NumberFormat` matters because…",
          options: ["Formatting differs per call", "Construction loads locale data and is slow; `format` is cheap — build once, call many times", "It caches results", "Locales change"],
          answer: 1,
          explanation: "Also pass an explicit locale (and `timeZone` for dates).",
        },
        {
          prompt: "`String.raw\\`\\\\n\\`` is…",
          options: ["A newline", "The two characters backslash and `n` — the raw literal text", "An empty string", "`\"\\\\\\\\n\"`"],
          answer: 1,
          explanation: "Every tag receives `strings.raw` alongside the cooked parts.",
        },
        {
          prompt: "`/a|ab/.exec(\"ab\")[0]` is…",
          options: ["`\"ab\"`", "`\"a\"` — alternation tries alternatives left to right and takes the first that matches", "`null`", "`\"b\"`"],
          answer: 1,
          explanation: "Put longer alternatives first when they share a prefix.",
        },
        {
          prompt: "A capturing group inside a quantifier, `(\\d,)+` on `1,2,3,`, captures…",
          options: ["All three", "Only the last iteration, `3,` — use `matchAll` to collect every repetition", "The first", "Nothing"],
          answer: 1,
          explanation: "Groups hold one value each.",
        },
        {
          prompt: "`(?<=\\$)\\d+`…",
          options: ["Matches `$` and digits", "Matches digits preceded by `$` without including the `$` — a lookbehind", "Is invalid", "Matches digits followed by `$`"],
          answer: 1,
          explanation: "Lookbehind arrived in ES2018 and V8 supports variable length.",
        },
        {
          prompt: "To make `(\\w+\\s?)*` safe you would…",
          options: ["Add the `u` flag", "Rewrite it so each repetition is unambiguous, e.g. `\\w+(\\s\\w+)*`, and anchor it", "Add `i`", "Use `.*` instead"],
          answer: 1,
          explanation: "Negated classes, anchors and bounded repeats are the other tools.",
        },
        {
          prompt: "The `d` flag adds…",
          options: ["Digit matching", "`.indices` on match results — start/end offsets for each group", "Dot-all", "Debug output"],
          answer: 1,
          explanation: "Handy for highlighting and for error positions.",
        },
        {
          prompt: "Right-associativity of `^` in a recursive-descent parser is achieved by…",
          options: ["A `while` loop", "Recursing on the right operand (`base ** power()`) instead of looping", "Reversing the tokens", "A lookup table"],
          answer: 1,
          explanation: "Loops give left-associativity — right for `+` and `*`.",
        },
        {
          prompt: "Separating the tokenizer from the parser means…",
          options: ["Two files", "The parser sees typed tokens with positions and never raw characters; whitespace and comments vanish in the tokenizer", "Slower parsing", "No error messages"],
          answer: 1,
          explanation: "`peek`/`next`/`expect` are then the only ways the parser touches input.",
        },
        {
          prompt: "`\"\".split(\",\")` returns…",
          options: ["`[]`", "`[\"\"]` — one empty field", "`null`", "`[\",\"]`"],
          answer: 1,
          explanation: "A recurring surprise when parsing empty lines.",
        },
      ],
    },
  ],
});

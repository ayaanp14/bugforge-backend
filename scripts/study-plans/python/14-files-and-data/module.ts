import { defineModule } from "../../dsl.js";

export default defineModule(import.meta.url, {
  slug: "files-and-data",
  title: "Files and data formats",
  blurb: "open with modes, encodings and with; pathlib for building, querying and listing paths; CSV with DictReader/DictWriter; JSON with custom encoders and dataclass round trips; bytes with struct, byte order, base64 and hashlib; and sqlite3 with parameters, transactions and aggregation.",
  icon: "disk",
  overview: `Programs live on data that arrives in files and formats, and Python's standard library handles the formats that matter without a third-party package: text files with an explicit encoding, paths as objects, CSV with its quoting rules, JSON with hooks for the types it does not know, fixed binary layouts with \`struct\`, and a real SQL database in \`sqlite3\`. This module teaches each on the terms that keep data safe — state the encoding, close the file, quote the field, parameterise the query, order the output — and uses the judge's writable working directory so that every exercise creates, reads and removes real files.

Reading and writing files covers \`open\`'s modes and encoding, \`with\`, line iteration versus \`read\`, \`write\` versus \`print(file=)\`, safe replacement and \`io.StringIO\`. pathlib covers joining with \`/\`, the parts, queries, \`read_text\`/\`write_text\`, \`iterdir\`/\`glob\`/\`rglob\` (sorted), creating and deleting, and pure paths. CSV covers \`reader\`/\`writer\`, \`DictReader\`/\`DictWriter\`, \`newline=""\`, delimiters and quoting, and reading from stdin and strings. JSON in depth covers \`default=\`, \`asdict\` round trips, \`object_hook\`, \`parse_float=Decimal\`, validation, JSON Lines, \`tomllib\` and \`configparser\`. Bytes covers \`bytes\`/\`bytearray\`, byte order, \`struct\`, binary files, \`base64\` and \`hashlib\`. sqlite3 covers connecting, parameters, queries, \`Row\`, transactions with \`with con:\`, \`GROUP BY\` and joins.

The exercises are whole programs: a file written and read back with its byte size, an append-only log, path decomposition with pure paths, a directory tree built and globbed, CSV totals by category, a quoting round trip, a custom JSON encoder, JSON Lines validated into dataclasses, packed records verified by a digest, byte orders and base64, an inventory in SQLite and a sales join. The checkpoint adds a CSV-to-JSON converter, a binary record store with a SHA-256 check, and a grouped SQLite report with a rolled-back transaction.`,
  lessons: [
    {
      slug: "reading-and-writing-files",
      file: "01-reading-and-writing-files.md",
      exercises: [
        {
          title: "Write, then read back",
          prompt: `Read lines from standard input and write them to a file \`out_demo.txt\` (UTF-8, one line each, inside a \`with\`). Print the file's size in bytes (\`os.path.getsize\`). Then reopen it for reading, iterate its lines and print each numbered from 1 with the newline stripped, followed by \`lines <n>\`. Delete the file at the end (in a \`finally\`).

**Input:** zero or more lines.
**Output:** \`bytes <n>\`, then \`<i>: <line>\` per line, then \`lines <n>\`.

\`\`\`text
héllo
world
\`\`\`
prints
\`\`\`text
bytes 13
1: héllo
2: world
lines 2
\`\`\``,
          starter: String.raw`import os
import sys

PATH = "out_demo.txt"
lines = [line.rstrip("\n") for line in sys.stdin]
try:
    # TODO: write, print the size, read back
    pass
finally:
    if os.path.exists(PATH):
        os.remove(PATH)
`,
          solution: String.raw`import os
import sys

PATH = "out_demo.txt"
lines = [line.rstrip("\n") for line in sys.stdin]
try:
    with open(PATH, "w", encoding="utf-8") as f:
        for line in lines:
            f.write(line + "\n")
    print(f"bytes {os.path.getsize(PATH)}")
    count = 0
    with open(PATH, encoding="utf-8") as f:
        for i, line in enumerate(f, start=1):
            print(f"{i}: {line.rstrip(chr(10))}")
            count += 1
    print(f"lines {count}")
finally:
    if os.path.exists(PATH):
        os.remove(PATH)
`,
          hints: [
            "`write` adds no newline — append `\"\\n\"` yourself; the `with` flushes and closes before the size is read.",
            "`é` is two bytes in UTF-8, which is why the size is 13, not 12.",
          ],
          cases: [
            { stdin: "héllo\nworld\n", expected: "bytes 13\n1: héllo\n2: world\nlines 2\n" },
            { stdin: "", expected: "bytes 0\nlines 0\n", hidden: true },
            { stdin: "a\n\nb\n", expected: "bytes 5\n1: a\n2: \n3: b\nlines 3\n", hidden: true },
          ],
        },
        {
          title: "An append-only log",
          prompt: `Maintain \`app_demo.log\` from commands: \`log <text>\` appends one line using \`print(..., file=f)\` on a file opened in append mode; \`show\` prints the file's lines numbered; \`count\` prints the number of lines by iterating the file; \`clear\` truncates it by opening in \`"w"\` mode. Delete the file at the end.

**Input:** commands.
**Output:** the lines of \`show\` and \`count\`.

\`\`\`text
log first
log second, with comma
show
count
clear
count
\`\`\`
prints
\`\`\`text
1: first
2: second, with comma
2
0
\`\`\``,
          starter: String.raw`import os
import sys

PATH = "app_demo.log"
open(PATH, "w", encoding="utf-8").close()   # start empty
try:
    for line in sys.stdin:
        cmd, _, text = line.rstrip("\n").partition(" ")
        # TODO
finally:
    os.remove(PATH)
`,
          solution: String.raw`import os
import sys

PATH = "app_demo.log"
open(PATH, "w", encoding="utf-8").close()   # start empty
try:
    for line in sys.stdin:
        cmd, _, text = line.rstrip("\n").partition(" ")
        if cmd == "log":
            with open(PATH, "a", encoding="utf-8") as f:
                print(text, file=f)
        elif cmd == "show":
            with open(PATH, encoding="utf-8") as f:
                for i, entry in enumerate(f, start=1):
                    print(f"{i}: {entry.rstrip(chr(10))}")
        elif cmd == "count":
            with open(PATH, encoding="utf-8") as f:
                print(sum(1 for _ in f))
        elif cmd == "clear":
            open(PATH, "w", encoding="utf-8").close()
finally:
    os.remove(PATH)
`,
          hints: [
            "Append mode never truncates; each `with` block flushes its writes before the next command reads.",
            "Opening in `\"w\"` and closing immediately is the idiom for truncating a file.",
          ],
          cases: [
            { stdin: "log first\nlog second, with comma\nshow\ncount\nclear\ncount\n", expected: "1: first\n2: second, with comma\n2\n0\n" },
            { stdin: "count\nshow\n", expected: "0\n", hidden: true },
            { stdin: "log x\nclear\nlog y\nshow\n", expected: "1: y\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "What does opening an existing file with mode `\"w\"` do?",
          options: ["Appends", "Truncates it to empty before writing", "Raises `FileExistsError`", "Opens read-only"],
          answer: 1,
          explanation: "`\"a\"` appends; `\"x\"` refuses to overwrite; `\"w\"` discards the old contents.",
        },
        {
          prompt: "Why pass `encoding=\"utf-8\"` to `open` for text?",
          options: ["It is required syntax", "The default is the platform's preferred encoding, which differs between systems", "It makes reading faster", "Only for binary files"],
          answer: 1,
          explanation: "A file written with one default and read with another produces `UnicodeDecodeError` or mojibake.",
        },
        {
          prompt: "Which reads a large file with the least memory?",
          options: ["`f.read()`", "`f.readlines()`", "`for line in f:`", "`list(f)`"],
          answer: 2,
          explanation: "Iterating the file object yields one line at a time; the others load everything.",
        },
        {
          prompt: "What guarantees a file is closed and its buffer flushed?",
          options: ["Garbage collection", "The `with` statement", "Calling `read()`", "Nothing is needed"],
          answer: 1,
          explanation: "`__exit__` calls `close()` on every path; relying on GC is unreliable and warns under `-X dev`.",
        },
        {
          prompt: "What is `io.StringIO` for?",
          options: ["Reading binary files", "An in-memory file object: capturing output or testing code that takes a file", "Formatting strings", "Encoding text"],
          answer: 1,
          explanation: "Anything that accepts a file-like object accepts it; `getvalue()` returns what was written.",
        },
      ],
    },
    {
      slug: "pathlib",
      file: "02-pathlib.md",
      exercises: [
        {
          title: "Path parts",
          prompt: `Read POSIX path strings, one per line, and decompose each with \`PurePosixPath\` (no file system involved): print \`name\`, \`stem\`, \`suffix\`, all \`suffixes\` joined with \`+\` (or \`-\` if none), \`parent\`, and the path with its suffix replaced by \`.bak\`.

**Input:** lines.
**Output:** \`name=<n> stem=<s> suffix=<x> suffixes=<a+b> parent=<p> bak=<q>\` per line.

\`\`\`text
/home/ada/data/report.tar.gz
\`\`\`
prints
\`\`\`text
name=report.tar.gz stem=report.tar suffix=.gz suffixes=.tar+.gz parent=/home/ada/data bak=/home/ada/data/report.tar.bak
\`\`\``,
          starter: String.raw`import sys
from pathlib import PurePosixPath

for line in sys.stdin:
    p = PurePosixPath(line.strip())
    # TODO
`,
          solution: String.raw`import sys
from pathlib import PurePosixPath

for line in sys.stdin:
    p = PurePosixPath(line.strip())
    suffixes = "+".join(p.suffixes) if p.suffixes else "-"
    print(f"name={p.name} stem={p.stem} suffix={p.suffix} suffixes={suffixes} parent={p.parent} bak={p.with_suffix('.bak')}")
`,
          hints: [
            "`stem` and `suffix` split at the last dot; `suffixes` lists every dotted extension.",
            "`with_suffix` replaces only the last suffix.",
          ],
          cases: [
            { stdin: "/home/ada/data/report.tar.gz\n", expected: "name=report.tar.gz stem=report.tar suffix=.gz suffixes=.tar+.gz parent=/home/ada/data bak=/home/ada/data/report.tar.bak\n" },
            { stdin: "notes\nsrc/main.py\n", expected: "name=notes stem=notes suffix= suffixes=- parent=. bak=notes.bak\nname=main.py stem=main suffix=.py suffixes=.py parent=src bak=src/main.bak\n", hidden: true },
          ],
        },
        {
          title: "Build a tree and search it",
          prompt: `Create a directory \`tree_demo\` next to this script and populate it from \`mk <relative/path>\` lines (creating parent directories with \`mkdir(parents=True, exist_ok=True)\` and empty files with \`touch\`). Then for each \`find <pattern>\` line print the matching paths from \`rglob\` relative to the root, sorted, one per line (or \`none\`), and for \`count\` print the number of files in the tree. Remove the tree at the end with \`shutil.rmtree\`.

**Input:** commands.
**Output:** the results of \`find\` and \`count\`.

\`\`\`text
mk docs/a.md
mk docs/sub/b.md
mk src/main.py
find *.md
count
\`\`\`
prints
\`\`\`text
docs/a.md
docs/sub/b.md
3
\`\`\``,
          starter: String.raw`import shutil
import sys
from pathlib import Path

root = Path(__file__).resolve().parent / "tree_demo"
root.mkdir(exist_ok=True)
try:
    for line in sys.stdin:
        cmd, *args = line.split()
        # TODO: mk / find / count
finally:
    shutil.rmtree(root, ignore_errors=True)
`,
          solution: String.raw`import shutil
import sys
from pathlib import Path

root = Path(__file__).resolve().parent / "tree_demo"
root.mkdir(exist_ok=True)
try:
    for line in sys.stdin:
        cmd, *args = line.split()
        if cmd == "mk":
            target = root / args[0]
            target.parent.mkdir(parents=True, exist_ok=True)
            target.touch()
        elif cmd == "find":
            hits = sorted(p.relative_to(root).as_posix() for p in root.rglob(args[0]) if p.is_file())
            print("\n".join(hits) if hits else "none")
        elif cmd == "count":
            print(sum(1 for p in root.rglob("*") if p.is_file()))
finally:
    shutil.rmtree(root, ignore_errors=True)
`,
          hints: [
            "`rglob` yields in file-system order — sort the relative paths before printing.",
            "`relative_to(root).as_posix()` gives forward-slash paths whatever the platform.",
          ],
          cases: [
            { stdin: "mk docs/a.md\nmk docs/sub/b.md\nmk src/main.py\nfind *.md\ncount\n", expected: "docs/a.md\ndocs/sub/b.md\n3\n" },
            { stdin: "find *\ncount\nmk x.txt\nfind *.md\n", expected: "none\n0\nnone\n", hidden: true },
            { stdin: "mk a/b/c/d.py\nmk a/e.py\nfind *.py\n", expected: "a/b/c/d.py\na/e.py\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "What does `Path(\"a\") / \"b\" / \"c.txt\"` produce?",
          options: ["A string", "`Path('a/b/c.txt')` with the platform's separator", "An error", "`Path('a')`"],
          answer: 1,
          explanation: "The `/` operator joins path components portably.",
        },
        {
          prompt: "What is `Path(\"x.tar.gz\").suffix`?",
          options: ["`'.tar.gz'`", "`'.gz'`", "`'.tar'`", "`''`"],
          answer: 1,
          explanation: "`suffix` is the last extension; `suffixes` gives `['.tar', '.gz']`.",
        },
        {
          prompt: "Which creates `out/logs` including missing parents without failing if it exists?",
          options: ["`Path(\"out/logs\").mkdir()`", "`Path(\"out/logs\").mkdir(parents=True, exist_ok=True)`", "`Path(\"out/logs\").touch()`", "`os.mkdir(\"out/logs\")`"],
          answer: 1,
          explanation: "Without the flags, a missing parent or an existing directory raises.",
        },
        {
          prompt: "What order does `Path.iterdir()` yield in?",
          options: ["Alphabetical", "File-system order — arbitrary; sort it", "Creation order", "Size order"],
          answer: 1,
          explanation: "Judged and tested output must not depend on directory order.",
        },
        {
          prompt: "What are `PurePosixPath` and `PureWindowsPath` for?",
          options: ["Faster I/O", "Manipulating paths without touching the file system, including paths for another OS", "Network paths", "They are deprecated"],
          answer: 1,
          explanation: "Pure paths parse, join and decompose; the concrete `Path` adds the I/O methods.",
        },
      ],
    },
    {
      slug: "csv",
      file: "03-csv.md",
      exercises: [
        {
          title: "Totals by category",
          prompt: `Read a CSV document from standard input with \`csv.DictReader\` — columns \`name\`, \`category\`, \`qty\`, \`price\` — and total \`qty * price\` per category. Write the result as CSV to standard output with \`csv.writer(sys.stdout)\`: a header \`category,total\` then one row per category in name order, totals with two decimals.

**Input:** a CSV document.
**Output:** a CSV document.

\`\`\`text
name,category,qty,price
bolt,hardware,10,0.5
nut,hardware,4,0.25
glue,supplies,1,3
\`\`\`
prints
\`\`\`text
category,total
hardware,6.00
supplies,3.00
\`\`\``,
          starter: String.raw`import csv
import sys
from collections import defaultdict

totals = defaultdict(float)
# TODO: read with DictReader, accumulate, write with csv.writer(sys.stdout, lineterminator="\n")
`,
          solution: String.raw`import csv
import sys
from collections import defaultdict

totals = defaultdict(float)
for row in csv.DictReader(sys.stdin):
    totals[row["category"]] += int(row["qty"]) * float(row["price"])
writer = csv.writer(sys.stdout, lineterminator="\n")
writer.writerow(["category", "total"])
for category in sorted(totals):
    writer.writerow([category, f"{totals[category]:.2f}"])
`,
          hints: [
            "Every field from the reader is a string; convert `qty` and `price` before multiplying.",
            "`lineterminator=\"\\n\"` keeps the writer from emitting `\\r\\n`, which would not match on the judge.",
          ],
          cases: [
            { stdin: "name,category,qty,price\nbolt,hardware,10,0.5\nnut,hardware,4,0.25\nglue,supplies,1,3\n", expected: "category,total\nhardware,6.00\nsupplies,3.00\n" },
            { stdin: "name,category,qty,price\n", expected: "category,total\n", hidden: true },
            { stdin: "name,category,qty,price\n\"a, b\",\"x\",2,1.5\n", expected: "category,total\nx,3.00\n", hidden: true },
          ],
        },
        {
          title: "Quoting round trip",
          prompt: `Each input line is \`name|note\` where the note may contain commas and double quotes. Write the pairs to \`notes_demo.csv\` with \`csv.writer\` (\`newline=""\`), then print the file's **raw** lines as \`repr\` strings to show how the writer quoted them, then read the file back with \`csv.reader\` and print \`name -> note\` per row. Delete the file at the end.

**Input:** lines.
**Output:** the raw lines as reprs, then the parsed rows.

\`\`\`text
ada|says, "hi"
bob|plain
\`\`\`
prints
\`\`\`text
'ada,"says, ""hi"""'
'bob,plain'
ada -> says, "hi"
bob -> plain
\`\`\``,
          starter: String.raw`import csv
import os
import sys

PATH = "notes_demo.csv"
pairs = [line.rstrip("\n").split("|", 1) for line in sys.stdin if line.strip()]
try:
    # TODO: write, print raw lines, read back
    pass
finally:
    if os.path.exists(PATH):
        os.remove(PATH)
`,
          solution: String.raw`import csv
import os
import sys

PATH = "notes_demo.csv"
pairs = [line.rstrip("\n").split("|", 1) for line in sys.stdin if line.strip()]
try:
    with open(PATH, "w", newline="", encoding="utf-8") as f:
        csv.writer(f, lineterminator="\n").writerows(pairs)
    with open(PATH, encoding="utf-8") as f:
        for raw in f:
            print(repr(raw.rstrip("\n")))
    with open(PATH, newline="", encoding="utf-8") as f:
        for name, note in csv.reader(f):
            print(f"{name} -> {note}")
finally:
    if os.path.exists(PATH):
        os.remove(PATH)
`,
          hints: [
            "The writer quotes a field containing a comma or a quote and doubles the inner quotes.",
            "Reading back with `csv.reader` undoes the quoting exactly; a hand-written split would not.",
          ],
          cases: [
            { stdin: "ada|says, \"hi\"\nbob|plain\n", expected: "'ada,\"says, \"\"hi\"\"\"'\n'bob,plain'\nada -> says, \"hi\"\nbob -> plain\n" },
            { stdin: "x|a,b,c\n", expected: "'x,\"a,b,c\"'\nx -> a,b,c\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "Why open a CSV file with `newline=\"\"`?",
          options: ["To speed up reading", "So the `csv` module controls line endings — quoted fields may contain newlines, and writers avoid doubled `\\r\\n`", "It is required by `open`", "To disable quoting"],
          answer: 1,
          explanation: "The module's documentation requires it for both reading and writing.",
        },
        {
          prompt: "What type is a field returned by `csv.reader`?",
          options: ["Whatever it looks like", "Always `str`", "`int` for digits", "`bytes`"],
          answer: 1,
          explanation: "CSV carries no types; convert at the edge.",
        },
        {
          prompt: "What does `DictWriter` require?",
          options: ["Nothing", "`fieldnames`, to fix the column order", "A header already in the file", "Sorted rows"],
          answer: 1,
          explanation: "`writeheader()` then writes them; a row with an unknown key raises unless `extrasaction=\"ignore\"`.",
        },
        {
          prompt: "How does a CSV writer represent the field `say \"hi\"`?",
          options: ["`say \\\"hi\\\"`", "`\"say \"\"hi\"\"\"` — quoted, inner quotes doubled", "Unquoted", "It raises"],
          answer: 1,
          explanation: "Doubling is the CSV escape; the reader reverses it.",
        },
        {
          prompt: "Which encoding strips an Excel byte-order mark on read?",
          options: ["`utf-8`", "`utf-8-sig`", "`ascii`", "`latin-1`"],
          answer: 1,
          explanation: "Without it, the first header name starts with `\\ufeff`.",
        },
      ],
    },
    {
      slug: "json-in-depth",
      file: "04-json-in-depth.md",
      exercises: [
        {
          title: "A custom encoder",
          prompt: `Build a document from typed lines — \`date <iso>\`, \`set <words…>\`, \`decimal <number>\`, \`int <n>\`, \`text <words…>\` — storing each under its key (the first word; a repeated key overwrites) as a real \`date\`, \`set\`, \`Decimal\`, \`int\` or \`str\`. Serialise it with \`json.dumps(doc, default=to_json, sort_keys=True)\` where \`to_json\` renders dates as ISO strings, sets as sorted lists and decimals as strings, and raises \`TypeError\` for anything else.

**Input:** lines.
**Output:** one JSON line.

\`\`\`text
date 2024-05-01
set b a c
decimal 1.50
int 7
text hello world
\`\`\`
prints
\`\`\`text
{"date": "2024-05-01", "decimal": "1.50", "int": 7, "set": ["a", "b", "c"], "text": "hello world"}
\`\`\``,
          starter: String.raw`import json
import sys
from datetime import date
from decimal import Decimal


def to_json(o):
    # TODO
    raise TypeError(f"not serializable: {type(o).__name__}")


doc = {}
for line in sys.stdin:
    kind, _, rest = line.rstrip("\n").partition(" ")
    # TODO: build the typed value
print(json.dumps(doc, default=to_json, sort_keys=True))
`,
          solution: String.raw`import json
import sys
from datetime import date
from decimal import Decimal


def to_json(o):
    if isinstance(o, date):
        return o.isoformat()
    if isinstance(o, set):
        return sorted(o)
    if isinstance(o, Decimal):
        return str(o)
    raise TypeError(f"not serializable: {type(o).__name__}")


doc = {}
for line in sys.stdin:
    kind, _, rest = line.rstrip("\n").partition(" ")
    if kind == "date":
        doc[kind] = date.fromisoformat(rest)
    elif kind == "set":
        doc[kind] = set(rest.split())
    elif kind == "decimal":
        doc[kind] = Decimal(rest)
    elif kind == "int":
        doc[kind] = int(rest)
    elif kind == "text":
        doc[kind] = rest
print(json.dumps(doc, default=to_json, sort_keys=True))
`,
          hints: [
            "`default` is called only for objects the encoder cannot handle; return a JSON-compatible value.",
            "Sorting the set gives a deterministic list; `str(Decimal)` keeps the exact digits.",
          ],
          cases: [
            { stdin: "date 2024-05-01\nset b a c\ndecimal 1.50\nint 7\ntext hello world\n", expected: "{\"date\": \"2024-05-01\", \"decimal\": \"1.50\", \"int\": 7, \"set\": [\"a\", \"b\", \"c\"], \"text\": \"hello world\"}\n" },
            { stdin: "set\nint -1\n", expected: "{\"int\": -1, \"set\": []}\n", hidden: true },
            { stdin: "date 2000-02-29\ndate 1999-12-31\n", expected: "{\"date\": \"1999-12-31\"}\n", hidden: true },
          ],
        },
        {
          title: "JSON Lines into dataclasses",
          prompt: `Each input line is a JSON document meant to be \`{"name": str, "qty": int}\` with \`qty >= 0\`. Parse each with \`json.loads\` (a \`JSONDecodeError\` counts as invalid), validate the shape with a \`match\` pattern, build a frozen \`Item\` dataclass for the valid ones, and at the end print the valid items as a JSON array of \`asdict\` results with \`sort_keys=True\`, then \`invalid <n>\`.

**Input:** JSON lines.
**Output:** one JSON line, then \`invalid <n>\`.

\`\`\`text
{"name": "bolt", "qty": 3}
{"name": "nut", "qty": -1}
not json
{"qty": 2, "name": "glue", "extra": true}
\`\`\`
prints
\`\`\`text
[{"name": "bolt", "qty": 3}, {"name": "glue", "qty": 2}]
invalid 2
\`\`\``,
          starter: String.raw`import json
import sys
from dataclasses import asdict, dataclass


@dataclass(frozen=True)
class Item:
    name: str
    qty: int


items, invalid = [], 0
for line in sys.stdin:
    # TODO: parse, validate with match, build
    pass
print(json.dumps([asdict(i) for i in items], sort_keys=True))
print(f"invalid {invalid}")
`,
          solution: String.raw`import json
import sys
from dataclasses import asdict, dataclass


@dataclass(frozen=True)
class Item:
    name: str
    qty: int


items, invalid = [], 0
for line in sys.stdin:
    if not line.strip():
        continue
    try:
        doc = json.loads(line)
    except json.JSONDecodeError:
        invalid += 1
        continue
    match doc:
        case {"name": str(name), "qty": int(qty)} if qty >= 0 and not isinstance(qty, bool):
            items.append(Item(name, qty))
        case _:
            invalid += 1
print(json.dumps([asdict(i) for i in items], sort_keys=True))
print(f"invalid {invalid}")
`,
          hints: [
            "A mapping pattern ignores extra keys, so `\"extra\": true` does not disqualify a document.",
            "`int(qty)` in the pattern checks the type; the guard checks the range.",
          ],
          cases: [
            { stdin: "{\"name\": \"bolt\", \"qty\": 3}\n{\"name\": \"nut\", \"qty\": -1}\nnot json\n{\"qty\": 2, \"name\": \"glue\", \"extra\": true}\n", expected: "[{\"name\": \"bolt\", \"qty\": 3}, {\"name\": \"glue\", \"qty\": 2}]\ninvalid 2\n" },
            { stdin: "{\"name\": 5, \"qty\": 1}\n{\"name\": \"x\", \"qty\": \"1\"}\n", expected: "[]\ninvalid 2\n", hidden: true },
            { stdin: "{\"name\": \"a\", \"qty\": 0}\n", expected: "[{\"name\": \"a\", \"qty\": 0}]\ninvalid 0\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "What does `json.dumps(date.today())` do without help?",
          options: ["Produces an ISO string", "Raises `TypeError: Object of type date is not JSON serializable`", "Produces a timestamp", "Produces `null`"],
          answer: 1,
          explanation: "Supply `default=` (or a `JSONEncoder` subclass) that converts unknown types.",
        },
        {
          prompt: "How do you read JSON numbers as `Decimal`?",
          options: ["`json.loads(s, decimal=True)`", "`json.loads(s, parse_float=Decimal)`", "Cast afterwards", "Not possible"],
          answer: 1,
          explanation: "The hook receives the numeric text and builds the exact value; casting afterwards would already have lost precision.",
        },
        {
          prompt: "What is JSON Lines good for?",
          options: ["Pretty printing", "Streams and logs: one record per line, appendable and readable incrementally", "Nested documents", "Binary data"],
          answer: 1,
          explanation: "A single giant array cannot be processed until fully read; lines can.",
        },
        {
          prompt: "Which file mode does `tomllib.load` require?",
          options: ["`\"r\"`", "`\"rb\"`", "`\"w\"`", "Any"],
          answer: 1,
          explanation: "It reads bytes and decodes UTF-8 itself.",
        },
        {
          prompt: "What does `json.loads` guarantee about the parsed document?",
          options: ["That it has the shape your code expects", "Only that the text was valid JSON — shape must be validated separately", "That all numbers are ints", "That keys are unique and sorted"],
          answer: 1,
          explanation: "Validate at the boundary with `match` or explicit checks.",
        },
      ],
    },
    {
      slug: "bytes-and-binary-data",
      file: "05-bytes-and-binary-data.md",
      exercises: [
        {
          title: "Packed records",
          prompt: `Read records \`name age score\` and pack each with \`struct\` as \`<8sHi\` (an 8-byte name padded with NULs, a little-endian \`uint16\` age, an \`int32\` score) into \`records_demo.bin\`. Print the file size. Read the file back in fixed-size chunks with \`struct.unpack\`, printing each record with the NUL padding stripped from the name, then the SHA-256 hex digest of the file's bytes. Delete the file at the end.

**Input:** lines \`name age score\` (names of at most 8 ASCII characters).
**Output:** \`size <bytes>\`, the records as \`<name> <age> <score>\`, then \`sha256 <hex>\`.

\`\`\`text
ada 36 -5
bob 20 100
\`\`\`
prints
\`\`\`text
size 28
ada 36 -5
bob 20 100
sha256 be0a9402f32060565cc8920ff8e7a9f5685da720c79ffe7879e0646c9363736f
\`\`\``,
          starter: String.raw`import hashlib
import os
import struct
import sys

PATH = "records_demo.bin"
FMT = "<8sHi"
SIZE = struct.calcsize(FMT)
records = [line.split() for line in sys.stdin if line.strip()]
try:
    # TODO: write, size, read back, digest
    pass
finally:
    if os.path.exists(PATH):
        os.remove(PATH)
`,
          solution: String.raw`import hashlib
import os
import struct
import sys

PATH = "records_demo.bin"
FMT = "<8sHi"
SIZE = struct.calcsize(FMT)
records = [line.split() for line in sys.stdin if line.strip()]
try:
    with open(PATH, "wb") as f:
        for name, age, score in records:
            f.write(struct.pack(FMT, name.encode("ascii"), int(age), int(score)))
    print(f"size {os.path.getsize(PATH)}")
    digest = hashlib.sha256()
    with open(PATH, "rb") as f:
        while chunk := f.read(SIZE):
            digest.update(chunk)
            raw_name, age, score = struct.unpack(FMT, chunk)
            print(raw_name.rstrip(b"\x00").decode("ascii"), age, score)
    print(f"sha256 {digest.hexdigest()}")
finally:
    if os.path.exists(PATH):
        os.remove(PATH)
`,
          hints: [
            "`8s` pads a shorter bytes value with NULs on pack; strip them with `rstrip(b\"\\x00\")` on unpack.",
            "Feeding each chunk to `digest.update` hashes the file in the same pass that reads it.",
          ],
          cases: [
            { stdin: "ada 36 -5\nbob 20 100\n", expected: "size 28\nada 36 -5\nbob 20 100\nsha256 " + "be0a9402f32060565cc8920ff8e7a9f5685da720c79ffe7879e0646c9363736f" + "\n" },
            { stdin: "", expected: "size 0\nsha256 e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855\n", hidden: true },
            { stdin: "eightchr 65535 -2147483648\n", expected: "size 14\neightchr 65535 -2147483648\nsha256 " + "2175c477a78e8a97f613f67dfdb7330787a304c7b383a7436aee49315a5d3f6d" + "\n", hidden: true },
          ],
        },
        {
          title: "Byte orders and base64",
          prompt: `For each integer on the input line print: its 4-byte big-endian hex, its 4-byte little-endian hex (both signed), the value read back from the big-endian bytes, the standard base64 of the big-endian bytes, and the SHA-256 hex digest of the integer's decimal text, truncated to 12 characters.

**Input:** one line of integers that fit in a signed 32-bit word.
**Output:** \`<n>: big=<hex> little=<hex> back=<n> b64=<text> sha=<12 hex>\` per integer.

\`\`\`text
1 -1
\`\`\`
prints
\`\`\`text
1: big=00000001 little=01000000 back=1 b64=AAAAAQ== sha=6b86b273ff34
-1: big=ffffffff little=ffffffff back=-1 b64=/////w== sha=1bad6b8cf971
\`\`\``,
          starter: String.raw`import base64
import hashlib

for tok in input().split():
    n = int(tok)
    # TODO
`,
          solution: String.raw`import base64
import hashlib

for tok in input().split():
    n = int(tok)
    big = n.to_bytes(4, "big", signed=True)
    little = n.to_bytes(4, "little", signed=True)
    back = int.from_bytes(big, "big", signed=True)
    b64 = base64.b64encode(big).decode("ascii")
    sha = hashlib.sha256(tok.encode("ascii")).hexdigest()[:12]
    print(f"{n}: big={big.hex()} little={little.hex()} back={back} b64={b64} sha={sha}")
`,
          hints: [
            "`to_bytes(4, order, signed=True)` uses two's complement for negatives; `.hex()` renders the bytes.",
            "`b64encode` returns bytes — decode to ASCII for printing.",
          ],
          cases: [
            { stdin: "1 -1\n", expected: "1: big=00000001 little=01000000 back=1 b64=AAAAAQ== sha=6b86b273ff34\n-1: big=ffffffff little=ffffffff back=-1 b64=/////w== sha=1bad6b8cf971\n" },
            { stdin: "256\n", expected: "256: big=00000100 little=00010000 back=256 b64=AAABAA== sha=51e8ea280b44\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "What is `b\"abc\"[0]`?",
          options: ["`b'a'`", "`97`", "`'a'`", "`TypeError`"],
          answer: 1,
          explanation: "Indexing bytes gives an int; slicing `b[0:1]` gives `b'a'`.",
        },
        {
          prompt: "What does `(1).to_bytes(2, \"big\")` produce?",
          options: ["`b'\\x01\\x00'`", "`b'\\x00\\x01'`", "`b'1'`", "`b'\\x01'`"],
          answer: 1,
          explanation: "Big-endian puts the most significant byte first; little-endian would give `01 00`.",
        },
        {
          prompt: "Why always give `struct` a byte-order prefix?",
          options: ["It is required syntax", "The native default adds platform-dependent alignment padding and order", "For speed", "To allow floats"],
          answer: 1,
          explanation: "`<`, `>` or `!` make the layout portable across machines.",
        },
        {
          prompt: "What is base64 for?",
          options: ["Encryption", "Carrying arbitrary bytes through a text-only channel", "Compression", "Hashing"],
          answer: 1,
          explanation: "It is reversible and public; it costs about a third more space.",
        },
        {
          prompt: "How is a large file hashed without loading it entirely?",
          options: ["`hashlib.sha256(f.read())`", "Create the hash object and call `update` on successive chunks", "It cannot be", "`hashlib.file(path)`"],
          answer: 1,
          explanation: "The digest is the same as hashing the whole contents at once.",
        },
      ],
    },
    {
      slug: "sqlite3",
      file: "06-sqlite3.md",
      exercises: [
        {
          title: "Inventory in SQLite",
          prompt: `Keep an inventory in an in-memory \`sqlite3\` database with a table \`items(name TEXT PRIMARY KEY, price_cents INTEGER, category TEXT)\`. Commands: \`add name price category\` inserts or replaces (\`INSERT OR REPLACE\`, with \`?\` parameters); \`report\` prints \`<category> <count> <total>\` per category from one \`GROUP BY\` query ordered by category; \`find name\` prints the item's price and category or \`missing\`.

**Input:** commands.
**Output:** the report rows and the finds.

\`\`\`text
add bolt 5 hardware
add nut 2 hardware
add glue 300 supplies
add bolt 6 hardware
report
find nut
find screw
\`\`\`
prints
\`\`\`text
hardware 2 8
supplies 1 300
2 hardware
missing
\`\`\``,
          starter: String.raw`import sqlite3
import sys

con = sqlite3.connect(":memory:")
con.execute("CREATE TABLE items (name TEXT PRIMARY KEY, price_cents INTEGER NOT NULL, category TEXT NOT NULL)")
for line in sys.stdin:
    cmd, *args = line.split()
    # TODO
`,
          solution: String.raw`import sqlite3
import sys

con = sqlite3.connect(":memory:")
con.execute("CREATE TABLE items (name TEXT PRIMARY KEY, price_cents INTEGER NOT NULL, category TEXT NOT NULL)")
for line in sys.stdin:
    cmd, *args = line.split()
    if cmd == "add":
        con.execute("INSERT OR REPLACE INTO items (name, price_cents, category) VALUES (?, ?, ?)", (args[0], int(args[1]), args[2]))
    elif cmd == "report":
        for category, count, total in con.execute(
            "SELECT category, COUNT(*), SUM(price_cents) FROM items GROUP BY category ORDER BY category"
        ):
            print(category, count, total)
    elif cmd == "find":
        row = con.execute("SELECT price_cents, category FROM items WHERE name = ?", (args[0],)).fetchone()
        print(f"{row[0]} {row[1]}" if row else "missing")
`,
          hints: [
            "`?` placeholders with a tuple of values — never an f-string in the SQL.",
            "`GROUP BY category ORDER BY category` gives one deterministic row per category.",
          ],
          cases: [
            { stdin: "add bolt 5 hardware\nadd nut 2 hardware\nadd glue 300 supplies\nadd bolt 6 hardware\nreport\nfind nut\nfind screw\n", expected: "hardware 2 8\nsupplies 1 300\n2 hardware\nmissing\n" },
            { stdin: "report\nfind x\n", expected: "missing\n", hidden: true },
            { stdin: "add a 1 z\nadd b 1 a\nreport\n", expected: "a 1 1\nz 1 1\n", hidden: true },
          ],
        },
        {
          title: "Revenue by join",
          prompt: `Two tables: \`items(id INTEGER PRIMARY KEY, name TEXT, price_cents INTEGER)\` and \`sales(item_id INTEGER, qty INTEGER)\`. Lines \`item <name> <price>\` insert items (ids assigned automatically); lines \`sale <name> <qty>\` insert a sale by looking up the item's id (\`unknown item\` if absent). At the end run one \`JOIN\` + \`GROUP BY\` query and print \`<name> <units> <revenue>\` per item that has sales, ordered by revenue descending then name, followed by \`total <sum>\`.

**Input:** lines.
**Output:** the error lines as they occur, then the report.

\`\`\`text
item bolt 5
item nut 2
sale bolt 10
sale nut 100
sale screw 1
sale bolt 5
\`\`\`
prints
\`\`\`text
unknown item
nut 100 200
bolt 15 75
total 275
\`\`\``,
          starter: String.raw`import sqlite3
import sys

con = sqlite3.connect(":memory:")
con.executescript("""
    CREATE TABLE items (id INTEGER PRIMARY KEY, name TEXT UNIQUE, price_cents INTEGER);
    CREATE TABLE sales (item_id INTEGER REFERENCES items(id), qty INTEGER);
""")
for line in sys.stdin:
    cmd, name, number = line.split()
    # TODO
# TODO: the join query and the total
`,
          solution: String.raw`import sqlite3
import sys

con = sqlite3.connect(":memory:")
con.executescript("""
    CREATE TABLE items (id INTEGER PRIMARY KEY, name TEXT UNIQUE, price_cents INTEGER);
    CREATE TABLE sales (item_id INTEGER REFERENCES items(id), qty INTEGER);
""")
for line in sys.stdin:
    cmd, name, number = line.split()
    if cmd == "item":
        con.execute("INSERT INTO items (name, price_cents) VALUES (?, ?)", (name, int(number)))
    elif cmd == "sale":
        row = con.execute("SELECT id FROM items WHERE name = ?", (name,)).fetchone()
        if row is None:
            print("unknown item")
        else:
            con.execute("INSERT INTO sales (item_id, qty) VALUES (?, ?)", (row[0], int(number)))
total = 0
for name, units, revenue in con.execute("""
    SELECT i.name, SUM(s.qty), SUM(s.qty * i.price_cents) AS revenue
    FROM sales AS s JOIN items AS i ON i.id = s.item_id
    GROUP BY i.id
    ORDER BY revenue DESC, i.name
"""):
    print(name, units, revenue)
    total += revenue
print(f"total {total}")
`,
          hints: [
            "Look the id up with a parameterised `SELECT`; `fetchone()` is `None` when the item does not exist.",
            "The `JOIN … ON` links each sale to its item; `GROUP BY i.id` collapses the sales per item.",
          ],
          cases: [
            { stdin: "item bolt 5\nitem nut 2\nsale bolt 10\nsale nut 100\nsale screw 1\nsale bolt 5\n", expected: "unknown item\nnut 100 200\nbolt 15 75\ntotal 275\n" },
            { stdin: "item a 1\n", expected: "total 0\n", hidden: true },
            { stdin: "item a 3\nitem b 3\nsale b 1\nsale a 1\n", expected: "a 1 3\nb 1 3\ntotal 6\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "Why is `con.execute(f\"SELECT * FROM t WHERE name = '{name}'\")` wrong?",
          options: ["It is slow", "It allows SQL injection and breaks on a quote in the name; use `?` parameters", "SQLite does not support `WHERE`", "f-strings cannot contain SQL"],
          answer: 1,
          explanation: "The driver quotes parameter values correctly; string formatting cannot.",
        },
        {
          prompt: "What does `with con:` do for a `sqlite3` connection?",
          options: ["Closes it", "Wraps a transaction: commit on success, rollback on exception — without closing", "Opens a cursor", "Nothing"],
          answer: 1,
          explanation: "Close separately, or use `contextlib.closing`.",
        },
        {
          prompt: "What happens to a file database's changes without `commit()`?",
          options: ["They are saved automatically", "They are lost when the connection closes", "They are saved on the next `execute`", "SQLite raises"],
          answer: 1,
          explanation: "`with con:` commits for you; explicit `commit()` otherwise.",
        },
        {
          prompt: "Why add `ORDER BY` to a query whose rows are printed?",
          options: ["For speed", "SQL guarantees no row order without it", "It is required by `sqlite3`", "To enable `GROUP BY`"],
          answer: 1,
          explanation: "Unordered output can change between runs and versions.",
        },
        {
          prompt: "What does `con.row_factory = sqlite3.Row` enable?",
          options: ["Faster queries", "Access to columns by name as well as by index", "Automatic commits", "Type conversion"],
          answer: 1,
          explanation: "`row[\"name\"]`, `row.keys()` and `dict(row)` become available.",
        },
      ],
    },
    {
      slug: "files-checkpoint",
      file: "07-checkpoint.md",
      kind: "test",
      passMark: 70,
      exercises: [
        {
          title: "CSV to JSON and back",
          prompt: `Read a CSV document (\`name,qty,price\`) from standard input with \`DictReader\`, convert each row to a dict with \`qty\` as \`int\` and \`price\` as a string, and write the list as JSON (\`indent=2\`, \`sort_keys=True\`) to \`items_demo.json\` using \`pathlib.Path.write_text\`. Print the file's size. Read it back with \`json.loads(path.read_text())\`, print \`<name> x<qty> = <qty * price>\` per item with two decimals (use \`Decimal\` for the price), then \`total <sum>\`. Delete the file at the end.

**Input:** a CSV document.
**Output:** \`size <bytes>\`, the item lines, \`total <sum>\`.

\`\`\`text
name,qty,price
bolt,3,0.50
nut,10,0.25
\`\`\`
prints
\`\`\`text
size 128
bolt x3 = 1.50
nut x10 = 2.50
total 4.00
\`\`\``,
          starter: String.raw`import csv
import json
import sys
from decimal import Decimal
from pathlib import Path

path = Path("items_demo.json")
try:
    # TODO
    pass
finally:
    path.unlink(missing_ok=True)
`,
          solution: String.raw`import csv
import json
import sys
from decimal import Decimal
from pathlib import Path

path = Path("items_demo.json")
try:
    rows = [{"name": r["name"], "qty": int(r["qty"]), "price": r["price"]} for r in csv.DictReader(sys.stdin)]
    path.write_text(json.dumps(rows, indent=2, sort_keys=True), encoding="utf-8")
    print(f"size {path.stat().st_size}")
    total = Decimal("0")
    for item in json.loads(path.read_text(encoding="utf-8")):
        line_total = item["qty"] * Decimal(item["price"])
        total += line_total
        print(f"{item['name']} x{item['qty']} = {line_total:.2f}")
    print(f"total {total:.2f}")
finally:
    path.unlink(missing_ok=True)
`,
          hints: [
            "Keep the price as text through JSON so `Decimal(item[\"price\"])` is exact on the way back.",
            "`Path.write_text`/`read_text` are the one-call file operations; `stat().st_size` is the byte count.",
          ],
          cases: [
            { stdin: "name,qty,price\nbolt,3,0.50\nnut,10,0.25\n", expected: "size 128\nbolt x3 = 1.50\nnut x10 = 2.50\ntotal 4.00\n" },
            { stdin: "name,qty,price\n", expected: "size 2\ntotal 0.00\n", hidden: true },
            { stdin: "name,qty,price\n\"a, b\",1,10.00\n", expected: "size 66\na, b x1 = 10.00\ntotal 10.00\n", hidden: true },
          ],
        },
        {
          title: "Binary record store",
          prompt: `Write records \`id score\` packed as \`>Ii\` (big-endian \`uint32\` id, \`int32\` score) to \`store_demo.bin\`; print the file size and its SHA-256 hex digest. Then answer \`get <index>\` queries by seeking directly to \`index * record_size\` and unpacking one record (\`missing\` when the index is out of range). Delete the file at the end.

**Input:** \`n\`, then \`n\` record lines, then query lines.
**Output:** \`size <bytes>\`, \`sha256 <hex>\`, then one line per query: \`<id> <score>\` or \`missing\`.

\`\`\`text
2
7 -3
9 42
get 1
get 5
\`\`\`
prints
\`\`\`text
size 16
sha256 78f35ff4e3885e4f72f4593cda25699a3c3250086cfedc6ef28e4d03a05c8913
9 42
missing
\`\`\``,
          starter: String.raw`import hashlib
import os
import struct
import sys

PATH = "store_demo.bin"
FMT = ">Ii"
SIZE = struct.calcsize(FMT)
n = int(input())
records = [tuple(map(int, input().split())) for _ in range(n)]
try:
    # TODO: write, size + digest, then queries with seek
    pass
finally:
    if os.path.exists(PATH):
        os.remove(PATH)
`,
          solution: String.raw`import hashlib
import os
import struct
import sys

PATH = "store_demo.bin"
FMT = ">Ii"
SIZE = struct.calcsize(FMT)
n = int(input())
records = [tuple(map(int, input().split())) for _ in range(n)]
try:
    with open(PATH, "wb") as f:
        for rid, score in records:
            f.write(struct.pack(FMT, rid, score))
    data = open(PATH, "rb").read()
    print(f"size {len(data)}")
    print(f"sha256 {hashlib.sha256(data).hexdigest()}")
    with open(PATH, "rb") as f:
        for line in sys.stdin:
            _, index = line.split()
            index = int(index)
            if not 0 <= index < n:
                print("missing")
                continue
            f.seek(index * SIZE)
            rid, score = struct.unpack(FMT, f.read(SIZE))
            print(rid, score)
finally:
    if os.path.exists(PATH):
        os.remove(PATH)
`,
          hints: [
            "Fixed-size records make random access arithmetic: `seek(index * SIZE)` then `read(SIZE)`.",
            "The digest of the whole file identifies its exact contents — any change to any record changes it.",
          ],
          cases: [
            { stdin: "2\n7 -3\n9 42\nget 1\nget 5\n", expected: "size 16\nsha256 78f35ff4e3885e4f72f4593cda25699a3c3250086cfedc6ef28e4d03a05c8913\n9 42\nmissing\n" },
            { stdin: "0\nget 0\n", expected: "size 0\nsha256 e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855\nmissing\n", hidden: true },
            { stdin: "1\n4294967295 -1\nget 0\n", expected: "size 8\nsha256 12a3ae445661ce5dee78d0650d33362dec29c4f82af05e7e57fb595bbbacf0ca\n4294967295 -1\n", hidden: true },
          ],
        },
        {
          title: "Grouped report with a rollback",
          prompt: `Build an in-memory \`sqlite3\` table \`expenses(person TEXT, category TEXT, cents INTEGER)\` from \`add person category cents\` lines, committing each one immediately with \`con.commit()\`. A line \`batch-fail\` starts a transaction with \`with con:\` in which the next lines up to \`end\` are inserted and then a \`RuntimeError\` is raised, so the whole batch is rolled back (print \`rolled back\`). Finally print \`<person> <category> <total>\` rows from a \`GROUP BY person, category\` query ordered by person then category, and \`grand <total>\`.

**Input:** lines.
**Output:** \`rolled back\` lines as they occur, then the report.

\`\`\`text
add ada food 500
add ada travel 1200
batch-fail
add bob food 999
end
add bob food 300
\`\`\`
prints
\`\`\`text
rolled back
ada food 500
ada travel 1200
bob food 300
grand 2000
\`\`\``,
          starter: String.raw`import sqlite3
import sys

con = sqlite3.connect(":memory:")
con.execute("CREATE TABLE expenses (person TEXT, category TEXT, cents INTEGER)")
INSERT = "INSERT INTO expenses VALUES (?, ?, ?)"
lines = [line.split() for line in sys.stdin if line.strip()]
i = 0
while i < len(lines):
    parts = lines[i]
    # TODO: add / batch-fail ... end
    i += 1
# TODO: report
`,
          solution: String.raw`import sqlite3
import sys

con = sqlite3.connect(":memory:")
con.execute("CREATE TABLE expenses (person TEXT, category TEXT, cents INTEGER)")
INSERT = "INSERT INTO expenses VALUES (?, ?, ?)"
lines = [line.split() for line in sys.stdin if line.strip()]
i = 0
while i < len(lines):
    parts = lines[i]
    if parts[0] == "add":
        con.execute(INSERT, (parts[1], parts[2], int(parts[3])))
        con.commit()
        i += 1
    elif parts[0] == "batch-fail":
        j = i + 1
        try:
            with con:
                while lines[j][0] != "end":
                    _, person, category, cents = lines[j]
                    con.execute(INSERT, (person, category, int(cents)))
                    j += 1
                raise RuntimeError("batch failed")
        except RuntimeError:
            print("rolled back")
        i = j + 1
    else:
        i += 1
grand = 0
for person, category, total in con.execute(
    "SELECT person, category, SUM(cents) FROM expenses GROUP BY person, category ORDER BY person, category"
):
    print(person, category, total)
    grand += total
print(f"grand {grand}")
`,
          hints: [
            "Raising inside `with con:` makes the connection roll back every statement of the block.",
            "`with con:` rolls back everything since the last commit — including earlier uncommitted inserts — so commit the plain adds before a batch that may abort.",
          ],
          cases: [
            { stdin: "add ada food 500\nadd ada travel 1200\nbatch-fail\nadd bob food 999\nend\nadd bob food 300\n", expected: "rolled back\nada food 500\nada travel 1200\nbob food 300\ngrand 2000\n" },
            { stdin: "batch-fail\nadd x y 1\nend\n", expected: "rolled back\ngrand 0\n", hidden: true },
            { stdin: "add a b 1\nadd a b 2\nadd a a 5\n", expected: "a a 5\na b 3\ngrand 8\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "What does `for line in f:` yield for a text file?",
          options: ["Lines without newlines", "Lines with their trailing newline", "Words", "Bytes"],
          answer: 1,
          explanation: "Strip with `rstrip(\"\\n\")` when the newline is unwanted.",
        },
        {
          prompt: "Which `Path` method writes a string to a file in one call?",
          options: ["`Path.write()`", "`Path.write_text(text, encoding=…)`", "`Path.save()`", "`Path.dump()`"],
          answer: 1,
          explanation: "It creates or truncates the file; `read_text` is the inverse.",
        },
        {
          prompt: "What does `csv.DictReader` use as keys?",
          options: ["Column indexes", "The first row's values (or `fieldnames=`)", "Sorted column names", "Nothing — it returns lists"],
          answer: 1,
          explanation: "Each subsequent row becomes a dict keyed by the header.",
        },
        {
          prompt: "What does `json.dumps(obj, default=f)` do with an unsupported object?",
          options: ["Skips it", "Calls `f(obj)` and serialises the return value", "Raises immediately", "Uses `str(obj)`"],
          answer: 1,
          explanation: "`f` must return something JSON can encode, or raise `TypeError`.",
        },
        {
          prompt: "Which is the correct dataclass-to-JSON round trip?",
          options: ["`json.dumps(obj)` / `json.loads`", "`json.dumps(asdict(obj))` / `Cls(**json.loads(text))`", "`pickle`", "`str(obj)`"],
          answer: 1,
          explanation: "Dataclasses are not JSON-serialisable directly; `asdict` produces the plain dict.",
        },
        {
          prompt: "What does `struct.calcsize(\"<Ii\")` return?",
          options: ["`4`", "`8`", "`2`", "`16`"],
          answer: 1,
          explanation: "A `uint32` plus an `int32`, no padding with an explicit byte-order prefix.",
        },
        {
          prompt: "How do you read a binary file record by record?",
          options: ["`for line in f:`", "`f.read(size)` in a loop until it returns empty bytes", "`f.readlines()`", "`json.load(f)`"],
          answer: 1,
          explanation: "Binary files have no lines; fixed-size reads (or `seek` for random access) are the idiom.",
        },
        {
          prompt: "What is `hashlib.sha256(b\"\").hexdigest()[:8]`?",
          options: ["`00000000`", "`e3b0c442`", "`ffffffff`", "It raises"],
          answer: 1,
          explanation: "The empty input has a well-known digest beginning `e3b0c442…`; any input has a fixed-size digest.",
        },
        {
          prompt: "Which SQL placeholder style does `sqlite3` use?",
          options: ["`%s`", "`?` (or named `:name`)", "`{}`", "`$1`"],
          answer: 1,
          explanation: "Pass the values as a tuple (or a dict for named placeholders).",
        },
        {
          prompt: "What does `INSERT OR REPLACE` do on a primary-key conflict?",
          options: ["Raises `IntegrityError`", "Deletes the old row and inserts the new one", "Ignores the new row", "Merges the rows"],
          answer: 1,
          explanation: "`INSERT OR IGNORE` would keep the old row; a plain `INSERT` raises.",
        },
        {
          prompt: "Why keep money as integer cents in SQLite?",
          options: ["SQLite has no REAL type", "Column types are advisory and floats carry rounding error; integers are exact", "Integers are smaller", "It is required by `GROUP BY`"],
          answer: 1,
          explanation: "The same reasoning as in Python: exact arithmetic for money.",
        },
        {
          prompt: "What happens to a `\"w\"`-mode file if the program crashes halfway through writing?",
          options: ["The old contents are restored", "The file holds partial data — write a temporary file and `os.replace` it to be safe", "Nothing is written", "The file is locked"],
          answer: 1,
          explanation: "Truncate-then-write loses the original on failure; rename-over is atomic on most systems.",
        },
      ],
    },
  ],
});

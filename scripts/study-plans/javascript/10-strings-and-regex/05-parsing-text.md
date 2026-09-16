---
title: Parsing text by hand — tokenizers, recursive descent, CSV and error positions
minutes: 14
---
Regexes stop where structure starts: nesting, quoting rules, grammars. For those you write a **parser**, and the good news is that the two techniques covering almost every case fit in a page each. A **tokenizer** turns characters into a list of typed tokens using one sticky regex; a **recursive-descent parser** turns tokens into a tree (or a value) with one function per grammar rule. Add position tracking and you get error messages that point at the problem. This lesson builds both for arithmetic expressions, walks through the quoting rules of CSV — the format everyone thinks is trivial and nobody parses right the first time — and ends with a small key/value grammar and the design habits that make hand-written parsers maintainable.

## Tokenizing with a sticky regex

```js
const TOKEN = /\s*(?:(?<num>\d+(?:\.\d+)?)|(?<id>[A-Za-z_]\w*)|(?<op>[-+*/()=,]))/y;
function tokenize(src) {
  const tokens = [];
  TOKEN.lastIndex = 0;
  while (TOKEN.lastIndex < src.length) {
    const start = TOKEN.lastIndex;
    const m = TOKEN.exec(src);
    if (!m) {
      if (/^\s*$/.test(src.slice(start))) break;                   // only trailing whitespace left
      throw new SyntaxError(`unexpected character '${src[start + (src.slice(start).match(/^\s*/)[0].length)]}' at ${start}`);
    }
    const type = Object.keys(m.groups).find((k) => m.groups[k] !== undefined);
    tokens.push({ type, value: m.groups[type], pos: m.index + m[0].length - m.groups[type].length });
  }
  tokens.push({ type: "eof", value: "", pos: src.length });
  return tokens;
}
```

The `y` flag makes `exec` match **only at `lastIndex`** and advance it — the pattern is an alternation of every token type, longest/most-specific alternatives first, with leading whitespace absorbed. A failed match at a position means an illegal character, and you know exactly where. Named groups tell you which alternative won. The `eof` sentinel saves every consumer a bounds check.

## Recursive descent

Write the grammar with precedence built in — lower precedence at the top, one function per rule, each returning a value (or an AST node):

```
expr   := term (("+" | "-") term)*
term   := factor (("*" | "/") factor)*
factor := "-" factor | number | "(" expr ")"
```

```js
function parse(tokens) {
  let i = 0;
  const peek = () => tokens[i];
  const next = () => tokens[i++];
  const expect = (value) => {
    const t = next();
    if (t.value !== value) throw new SyntaxError(`expected '${value}' but found '${t.value || "end of input"}' at ${t.pos}`);
    return t;
  };
  function expr() {
    let left = term();
    while (peek().value === "+" || peek().value === "-") { const op = next().value; const right = term(); left = op === "+" ? left + right : left - right; }
    return left;
  }
  function term() {
    let left = factor();
    while (peek().value === "*" || peek().value === "/") {
      const op = next(); const right = factor();
      if (op.value === "/" && right === 0) throw new RangeError(`division by zero at ${op.pos}`);
      left = op.value === "*" ? left * right : left / right;
    }
    return left;
  }
  function factor() {
    const t = peek();
    if (t.value === "-") { next(); return -factor(); }
    if (t.type === "num") { next(); return Number(t.value); }
    if (t.value === "(") { next(); const v = expr(); expect(")"); return v; }
    throw new SyntaxError(`unexpected '${t.value || "end of input"}' at ${t.pos}`);
  }
  const value = expr();
  if (peek().type !== "eof") throw new SyntaxError(`unexpected '${peek().value}' at ${peek().pos}`);
  return value;
}
```

Each function consumes exactly the tokens of its rule and returns. Precedence falls out of the nesting: `term` binds tighter than `expr` because `expr` calls `term` for its operands. Left-associativity comes from the `while` loop accumulating into `left`; right-associativity (exponent) would recurse instead. Adding a rule — comparison operators, function calls, variables — is adding one function and one line in the caller. This is how real language front-ends are written; the technique scales from a calculator to a JSON parser to a programming language.

## CSV — the trivial format that is not

RFC 4180: fields separated by commas; a field may be quoted with `"`; inside quotes, commas and newlines are literal and `"` is written `""`. A `split(",")` parser fails on the second rule. A character-by-character state machine handles all of them:

```js
function parseCsvLine(line) {
  const fields = [];
  let field = "", inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') { field += '"'; i++; }      // escaped quote
        else inQuotes = false;                              // closing quote
      } else field += ch;
    } else if (ch === '"') inQuotes = true;
    else if (ch === ",") { fields.push(field); field = ""; }
    else field += ch;
  }
  if (inQuotes) throw new SyntaxError("unterminated quoted field");
  fields.push(field);
  return fields;
}
```

Fields spanning lines need the state machine to run over the whole text rather than line by line — one more reason real projects use a library (`csv-parse`, `papaparse`) and the hand version is for understanding. The same state-machine shape parses INI files, `.env` files, query strings and log formats.

## Errors that point somewhere

Every `throw` above carries a **position**. Turn it into line and column for multi-line input (`text.slice(0, pos).split("\n")` → line count and last segment length) and print the offending line with a caret underneath; that is what compilers do and what saves a user twenty minutes. Fail on the **first** error for a language (the rest is noise after a missing bracket); collect errors for a data file where each record is independent (module 7's rule).

## Design habits

- **Separate lexing from parsing.** The parser reads tokens, never characters; whitespace and comments vanish in the tokenizer.
- **One function per rule, named after the rule**, with the grammar written in a comment above the parser.
- **`peek`/`next`/`expect`** as the only ways to touch the token stream.
- **Return values or AST nodes, not both**; an AST (`{ type: "binary", op, left, right }`) lets you evaluate, pretty-print and analyse with separate walkers.
- **Sentinel `eof`**; **positions on every token and every error**.
- Know when to stop: a real grammar with many precedence levels wants a Pratt parser or a generator (PEG.js, Chevrotain, ANTLR), and a real data format wants its library.

## Common mistakes

- Tokenizing with `split` and losing positions and quoted content.
- Precedence by hand-ordering `if`s instead of by grammar structure; associativity backwards.
- Forgetting the `eof` check, so `1 2` parses as `1` with garbage ignored.
- CSV by `split(",")`; not handling `""` or unterminated quotes.
- Errors without positions ("invalid input").
- Reaching for a hand parser when `JSON.parse`, `new URL` or a library exists.

## Interview angle

- *"How would you evaluate `2 + 3 * (4 - 1)` from a string?"* Tokenize with a sticky regex, then recursive descent with `expr`/`term`/`factor` so precedence is structural.
- *"Why can't `split(',')` parse CSV?"* Quoted fields contain commas and doubled quotes; you need a state machine.
- *"What does the sticky flag do?"* Matches only at `lastIndex` and advances it — the tokenizer primitive.
- *"How do you produce good parse errors?"* Carry positions on tokens; report the unexpected token and where; convert to line/column.
- *"When do you stop writing parsers by hand?"* Many precedence levels or a standard format: use a Pratt parser, a generator, or the library.

## Key takeaways

- Tokenizer: one sticky alternation with named groups, positions on tokens, an `eof` sentinel, an error for illegal characters.
- Recursive descent: one function per grammar rule; precedence from nesting, associativity from loops versus recursion; `peek`/`next`/`expect`.
- CSV and similar formats are state machines over characters with quoting rules — not `split`.
- Every error carries a position; first-error for languages, all-errors for independent records.
- Regex for tokens, code for structure, libraries for standard formats.

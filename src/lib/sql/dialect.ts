/**
 * What a learner's query may be, and the MySQL spellings it may use.
 *
 * SQL problems run on SQLite (sql.js — SQLite compiled to WebAssembly, on a
 * worker thread: lib/sql/engine.ts), but the placement rounds and the
 * interview questions they prepare for are written in MySQL. Three things
 * close most of that gap without a MySQL server per sitting:
 *
 *  - functions SQLite lacks are registered on every connection
 *    (lib/sql/mysql-functions.ts: IF, DATEDIFF, YEAR, DATE_FORMAT, LEFT, MOD…);
 *  - a handful of MySQL *syntax* forms that no function can stand in for are
 *    rewritten here, on tokens, before the query runs: `/` divides as a
 *    decimal (SQLite's 5/2 is 2, MySQL's 2.5 — every "percentage" problem
 *    would read as a wrong answer), `DIV` is integer division,
 *    `GROUP_CONCAT(x ORDER BY y SEPARATOR ';')` is moved into SQLite's
 *    argument order, `INTERVAL n DAY` inside DATE_ADD/DATE_SUB becomes two
 *    arguments, `TIMESTAMPDIFF(DAY, …)`'s unit becomes a string,
 *    `CAST(x AS SIGNED)` becomes an integer cast, and `<=>` becomes `IS`;
 *  - everything that is not one read-only statement is refused with a
 *    sentence, before it reaches the engine.
 *
 * The refusal is not the sandbox — each run gets a fresh in-memory database
 * on a thread that is killed past its deadline — but PRAGMA must never reach
 * the engine: `PRAGMA hard_heap_limit = 0` would lift the memory cap the
 * worker sets. Pure and pinned by dialect.test.ts.
 */

export type TokenKind = "word" | "string" | "ident" | "number" | "punct" | "space" | "comment";

export interface Token {
  kind: TokenKind;
  text: string;
}

const MULTI_PUNCT = ["<=>", "<=", ">=", "<>", "!=", "==", "||", "<<", ">>"];

/** SQL text → tokens. Lossless: joining every token's text gives the input back. */
export function tokenize(sql: string): Token[] {
  const out: Token[] = [];
  let i = 0;
  const n = sql.length;
  while (i < n) {
    const c = sql[i]!;
    // Whitespace
    if (/\s/.test(c)) {
      let j = i + 1;
      while (j < n && /\s/.test(sql[j]!)) j++;
      out.push({ kind: "space", text: sql.slice(i, j) });
      i = j;
      continue;
    }
    // -- line comment (MySQL also takes #)
    if ((c === "-" && sql[i + 1] === "-") || c === "#") {
      let j = i;
      while (j < n && sql[j] !== "\n") j++;
      out.push({ kind: "comment", text: sql.slice(i, j) });
      i = j;
      continue;
    }
    // /* block comment */ — unterminated runs to the end
    if (c === "/" && sql[i + 1] === "*") {
      const end = sql.indexOf("*/", i + 2);
      const j = end === -1 ? n : end + 2;
      out.push({ kind: "comment", text: sql.slice(i, j) });
      i = j;
      continue;
    }
    // Quoted: 'string', "ident", `ident`, [ident]
    if (c === "'" || c === '"' || c === "`" || c === "[") {
      const close = c === "[" ? "]" : c;
      let j = i + 1;
      while (j < n) {
        if (sql[j] === close) {
          if (close !== "]" && sql[j + 1] === close) { j += 2; continue; } // doubled quote = escaped
          j++;
          break;
        }
        // MySQL also escapes with a backslash inside strings
        if (c === "'" && sql[j] === "\\" && j + 1 < n) { j += 2; continue; }
        j++;
      }
      // A string in double quotes is a string in MySQL; SQLite would read an
      // identifier, find no such column, and *then* fall back to the string —
      // the same answer, so it stays an ident token and is left untouched.
      out.push({ kind: c === "'" ? "string" : "ident", text: sql.slice(i, j) });
      i = j;
      continue;
    }
    // Numbers: 12, 1.5, .5, 1e3
    if (/[0-9]/.test(c) || (c === "." && /[0-9]/.test(sql[i + 1] ?? ""))) {
      const m = /^(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?/.exec(sql.slice(i))!;
      out.push({ kind: "number", text: m[0] });
      i += m[0].length;
      continue;
    }
    // Words: keywords, names, functions
    if (/[A-Za-z_]/.test(c)) {
      const m = /^[A-Za-z_][A-Za-z0-9_$]*/.exec(sql.slice(i))!;
      out.push({ kind: "word", text: m[0] });
      i += m[0].length;
      continue;
    }
    const multi = MULTI_PUNCT.find((p) => sql.startsWith(p, i));
    const text = multi ?? c;
    out.push({ kind: "punct", text });
    i += text.length;
  }
  return out;
}

const upper = (t: Token | undefined) => (t && t.kind === "word" ? t.text.toUpperCase() : "");
const significant = (tokens: Token[]) => tokens.filter((t) => t.kind !== "space" && t.kind !== "comment");

/** Words that change the database or the engine. REPLACE only when it is not the replace() function. */
const FORBIDDEN = new Set([
  "INSERT", "UPDATE", "DELETE", "MERGE", "UPSERT", "CREATE", "DROP", "ALTER", "TRUNCATE_TABLE",
  "ATTACH", "DETACH", "PRAGMA", "VACUUM", "REINDEX", "ANALYZE", "SAVEPOINT", "RELEASE",
  "BEGIN", "COMMIT", "ROLLBACK", "GRANT", "REVOKE", "LOAD", "HANDLER", "CALL", "LOCK", "UNLOCK",
]);

export type StatementCheck = { ok: true } | { ok: false; error: string };

/** One read-only statement, or a sentence saying why not. */
export function checkStatement(sql: string): StatementCheck {
  if (sql.length > 20_000) return { ok: false, error: "That query is over 20,000 characters." };
  const tokens = significant(tokenize(sql));
  if (tokens.length === 0) return { ok: false, error: "Write a query first." };
  // Unterminated quote: the tokenizer ran it to the end of the text.
  const last = tokens[tokens.length - 1]!;
  if ((last.kind === "string" || last.kind === "ident") && last.text.length >= 1) {
    const q = last.text[0]!;
    const close = q === "[" ? "]" : q;
    if (last.text.length === 1 || last.text[last.text.length - 1] !== close) {
      return { ok: false, error: `A quote (${q}) is never closed.` };
    }
  }
  // Statements are separated by `;` — a trailing one is fine.
  const statements: Token[][] = [[]];
  for (const t of tokens) {
    if (t.kind === "punct" && t.text === ";") statements.push([]);
    else statements[statements.length - 1]!.push(t);
  }
  const nonEmpty = statements.filter((s) => s.length > 0);
  if (nonEmpty.length === 0) return { ok: false, error: "Write a query first." };
  if (nonEmpty.length > 1) return { ok: false, error: "Run one statement at a time — this problem is answered by a single query." };
  const stmt = nonEmpty[0]!;
  const first = upper(stmt[0]);
  if (first !== "SELECT" && first !== "WITH" && !(stmt[0]?.kind === "punct" && stmt[0].text === "(")) {
    return { ok: false, error: "Only a SELECT query runs here — the problem asks for a result, not a change to the tables." };
  }
  for (let i = 0; i < stmt.length; i++) {
    const w = upper(stmt[i]);
    if (!w) continue;
    if (w === "REPLACE" && stmt[i + 1]?.kind === "punct" && stmt[i + 1]!.text === "(") continue;
    if (w === "REPLACE" || FORBIDDEN.has(w)) {
      return { ok: false, error: `${w} is not allowed here — the query must only read the tables.` };
    }
  }
  return { ok: true };
}

/** Index of the `)` closing the `(` at `open`, over significant tokens; -1 if unbalanced. */
function closingParen(tokens: Token[], open: number): number {
  let depth = 0;
  for (let i = open; i < tokens.length; i++) {
    const t = tokens[i]!;
    if (t.kind !== "punct") continue;
    if (t.text === "(") depth++;
    else if (t.text === ")") {
      depth--;
      if (depth === 0) return i;
    }
  }
  return -1;
}

const word = (text: string): Token => ({ kind: "word", text });
const punct = (text: string): Token => ({ kind: "punct", text });
const space: Token = { kind: "space", text: " " };

const DATE_ARITH = new Set(["DATE_ADD", "DATE_SUB", "ADDDATE", "SUBDATE"]);

/**
 * MySQL syntax → SQLite syntax, token by token. Comments are dropped (a `--`
 * comment would otherwise swallow anything appended after it); every other
 * token keeps its text unless a rule below names it.
 */
export function rewriteMysql(sql: string): string {
  let tokens = tokenize(sql).filter((t) => t.kind !== "comment");

  // GROUP_CONCAT([DISTINCT] x [ORDER BY …] SEPARATOR 's') → group_concat(x, 's' [ORDER BY …])
  for (let i = 0; i < tokens.length; i++) {
    if (upper(tokens[i]) !== "GROUP_CONCAT") continue;
    let open = i + 1;
    while (tokens[open]?.kind === "space") open++;
    if (tokens[open]?.text !== "(") continue;
    const close = closingParen(tokens, open);
    if (close === -1) continue;
    let sepAt = -1;
    let orderAt = -1;
    let distinct = false;
    let depth = 0;
    for (let j = open + 1; j < close; j++) {
      const t = tokens[j]!;
      if (t.kind === "punct" && t.text === "(") depth++;
      else if (t.kind === "punct" && t.text === ")") depth--;
      else if (depth === 0) {
        const w = upper(t);
        if (w === "SEPARATOR") sepAt = j;
        else if (w === "ORDER" && orderAt === -1) orderAt = j;
        else if (w === "DISTINCT") distinct = true;
      }
    }
    if (sepAt === -1) continue;
    let litAt = sepAt + 1;
    while (tokens[litAt]?.kind === "space") litAt++;
    const lit = tokens[litAt];
    if (!lit || lit.kind !== "string") continue;
    // SQLite refuses a second argument next to DISTINCT; its default separator is MySQL's own ','.
    const sepTokens: Token[] = distinct && lit.text === "','" ? [] : [punct(","), space, lit];
    const without = [...tokens.slice(0, sepAt), ...tokens.slice(litAt + 1, close)];
    // Positions before sepAt are unchanged; ORDER BY (if any) sits before SEPARATOR in MySQL.
    const insertAt = orderAt !== -1 && orderAt < sepAt ? orderAt : without.length;
    const inner = [...without.slice(0, insertAt), ...sepTokens, ...(insertAt < without.length ? [space] : []), ...without.slice(insertAt)];
    tokens = [...inner, ...tokens.slice(close)];
  }

  // DATE_ADD(d, INTERVAL n UNIT) → DATE_ADD(d, n, 'UNIT')
  for (let i = 0; i < tokens.length; i++) {
    if (!DATE_ARITH.has(upper(tokens[i]))) continue;
    let open = i + 1;
    while (tokens[open]?.kind === "space") open++;
    if (tokens[open]?.text !== "(") continue;
    const close = closingParen(tokens, open);
    if (close === -1) continue;
    let intervalAt = -1;
    let depth = 0;
    for (let j = open + 1; j < close; j++) {
      const t = tokens[j]!;
      if (t.kind === "punct" && t.text === "(") depth++;
      else if (t.kind === "punct" && t.text === ")") depth--;
      else if (depth === 0 && upper(t) === "INTERVAL") { intervalAt = j; break; }
    }
    if (intervalAt === -1) continue;
    let unitAt = close - 1;
    while (unitAt > intervalAt && tokens[unitAt]!.kind === "space") unitAt--;
    const unit = tokens[unitAt]!;
    if (unit.kind !== "word" || unitAt === intervalAt) continue;
    const amount = tokens.slice(intervalAt + 1, unitAt);
    tokens = [
      ...tokens.slice(0, intervalAt),
      ...amount,
      punct(","), space,
      { kind: "string", text: `'${unit.text.toUpperCase()}'` },
      ...tokens.slice(close),
    ];
  }

  // CAST(x AS DATE) → date(x): SQLite gives the type name DATE numeric affinity, so the
  // cast would turn '2024-01-05' into 2024. DATETIME/TIMESTAMP and TIME likewise.
  for (let i = 0; i < tokens.length; i++) {
    if (upper(tokens[i]) !== "CAST") continue;
    let open = i + 1;
    while (tokens[open]?.kind === "space") open++;
    if (tokens[open]?.text !== "(") continue;
    const close = closingParen(tokens, open);
    if (close === -1) continue;
    let asAt = -1;
    let depth = 0;
    for (let j = open + 1; j < close; j++) {
      const t = tokens[j]!;
      if (t.kind === "punct" && t.text === "(") depth++;
      else if (t.kind === "punct" && t.text === ")") depth--;
      else if (depth === 0 && upper(t) === "AS") asAt = j;
    }
    if (asAt === -1) continue;
    const typeWords = tokens.slice(asAt + 1, close).filter((t) => t.kind !== "space");
    const type = typeWords.length === 1 ? upper(typeWords[0]) : "";
    const fn = type === "DATE" ? "date" : type === "DATETIME" || type === "TIMESTAMP" ? "datetime" : type === "TIME" ? "time" : "";
    if (!fn) continue;
    tokens = [...tokens.slice(0, i), word(fn), punct("("), ...tokens.slice(open + 1, asAt), punct(")"), ...tokens.slice(close + 1)];
  }

  const out: Token[] = [];
  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i]!;
    const w = upper(t);
    // MySQL string escapes ('It\'s', '\\.' in a REGEXP) → SQLite, which has none but ''.
    if (t.kind === "string") {
      out.push({ kind: "string", text: mysqlStringToSqlite(t.text) });
      continue;
    }
    // MySQL's `/` is decimal division.
    if (t.kind === "punct" && t.text === "/") {
      out.push(punct("*"), word("1.0"), punct("/"));
      continue;
    }
    // MySQL's DIV is integer division: CAST((a) / (b) AS INTEGER) would need the
    // operands; SQLite's own `/` on two integers truncates the same way.
    if (w === "DIV") {
      out.push(punct("/"));
      continue;
    }
    if (t.kind === "punct" && t.text === "<=>") {
      out.push(word("IS"));
      continue;
    }
    // CAST(x AS SIGNED [INTEGER]) / UNSIGNED → INTEGER
    if ((w === "SIGNED" || w === "UNSIGNED") && upper(prevSignificant(out)) === "AS") {
      out.push(word("INTEGER"));
      let k = i + 1;
      while (tokens[k]?.kind === "space") k++;
      if (upper(tokens[k]) === "INTEGER" || upper(tokens[k]) === "INT") i = k;
      continue;
    }
    // TIMESTAMPDIFF(DAY, a, b) → TIMESTAMPDIFF('DAY', a, b)
    if (t.kind === "word" && upper(prevSignificant(out)) === "(" && upper(prevSignificant(out, 2)) === "TIMESTAMPDIFF") {
      out.push({ kind: "string", text: `'${t.text.toUpperCase()}'` });
      continue;
    }
    out.push(t);
  }
  return out.map((t) => t.text).join("");
}

const MYSQL_ESCAPES: Record<string, string> = { "0": "\0", "'": "'", '"': '"', b: "\b", n: "\n", r: "\r", t: "\t", Z: "\x1a", "\\": "\\", "%": "\\%", _: "\\_" };

/**
 * A MySQL single-quoted literal as SQLite reads the same characters. MySQL
 * takes backslash escapes inside strings (`'\\.'` is the two characters
 * `\.`, which a REGEXP reads as a literal dot); SQLite takes none, so the
 * same text there was `\\.` — "a backslash, then any character" — and a
 * correct query read as a wrong answer. `\%` and `\_` stay escaped (they
 * mean something to LIKE); any other `\x` is `x`, as in MySQL.
 */
export function mysqlStringToSqlite(text: string): string {
  if (!text.includes("\\")) return text;
  const inner = text.slice(1, text.endsWith("'") && text.length > 1 ? -1 : undefined);
  let raw = "";
  for (let i = 0; i < inner.length; i++) {
    const c = inner[i]!;
    if (c === "\\" && i + 1 < inner.length) {
      const next = inner[++i]!;
      raw += MYSQL_ESCAPES[next] ?? next;
    } else if (c === "'" && inner[i + 1] === "'") {
      raw += "'";
      i++;
    } else {
      raw += c;
    }
  }
  return `'${raw.replace(/'/g, "''")}'`;
}

/** The nth significant token from the end of `out` (1 = last), uppercased if a word, its text otherwise. */
function prevSignificant(out: Token[], nth = 1): Token | undefined {
  let seen = 0;
  for (let i = out.length - 1; i >= 0; i--) {
    const t = out[i]!;
    if (t.kind === "space" || t.kind === "comment") continue;
    seen++;
    if (seen === nth) return t.kind === "punct" ? { kind: "word", text: t.text } : t;
  }
  return undefined;
}

/** A value as SQL text, for the INSERTs that load a dataset. */
export function sqlLiteral(v: string | number | boolean | null): string {
  if (v === null) return "NULL";
  if (typeof v === "boolean") return v ? "1" : "0";
  if (typeof v === "number") {
    if (!Number.isFinite(v)) throw new Error(`Not a finite number: ${v}`);
    return String(v);
  }
  return `'${v.replace(/'/g, "''")}'`;
}

/** Quote a table or column name for SQLite. */
export const quoteIdent = (name: string): string => `"${name.replace(/"/g, '""')}"`;

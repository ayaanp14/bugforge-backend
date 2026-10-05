/**
 * MySQL's functions, for SQLite (lib/sql/dialect.ts says why the SQL
 * problems run on SQLite and what else closes the gap). Registered on every
 * connection the SQL worker opens, before the tables load.
 *
 * Measured on the bundled build (sql.js 1.14, SQLite 3.49.1, 2026-10-05):
 * window functions, `concat`, `iif`, `group_concat(x, sep ORDER BY …)`,
 * FULL/RIGHT JOIN and backtick names are built in; the math functions are
 * not compiled in (no `mod`, `pow`, `ceil`), nor `char_length`, `left`,
 * `right`, or any MySQL date function. Where SQLite has a function by the
 * same name with other semantics, the MySQL one replaces it at the arities
 * MySQL uses: CONCAT (MySQL: any NULL argument makes the result NULL;
 * SQLite skips it) and FORMAT(x, d) (MySQL: thousands separators; SQLite:
 * printf).
 *
 * Every function takes SQL values (number | string | null | Uint8Array)
 * and must return one; a NULL argument gives NULL wherever MySQL does.
 * Dates are the 'YYYY-MM-DD[ HH:MM:SS]' text the problems store, read as
 * UTC. Pure functions, no state — they run inside the worker thread.
 */

export type SqlValue = number | string | null | Uint8Array;
type Fn = (...args: SqlValue[]) => SqlValue;

const isNull = (v: SqlValue | undefined): v is null | undefined => v === null || v === undefined;
const num = (v: SqlValue): number => {
  if (typeof v === "number") return v;
  if (typeof v === "string") {
    const m = /^\s*[-+]?(\d+\.?\d*|\.\d+)(e[-+]?\d+)?/i.exec(v);
    return m ? Number(m[0]) : 0;
  }
  return 0;
};
const str = (v: SqlValue): string => (typeof v === "string" ? v : typeof v === "number" ? String(v) : v instanceof Uint8Array ? new TextDecoder().decode(v) : "");
const truthy = (v: SqlValue): boolean => !isNull(v) && num(v) !== 0;
const pad = (n: number, w = 2) => String(Math.trunc(Math.abs(n))).padStart(w, "0");

interface Parsed {
  d: Date;
  hasTime: boolean;
}

/** 'YYYY-MM-DD', 'YYYY-MM-DD HH:MM[:SS]' or 'YYYY-MM-DDTHH:MM[:SS]' → a UTC Date; null when it is no date. */
export function parseDate(v: SqlValue): Parsed | null {
  if (isNull(v)) return null;
  const m = /^\s*(\d{4})-(\d{1,2})-(\d{1,2})(?:[ T](\d{1,2}):(\d{2})(?::(\d{2})(?:\.\d+)?)?)?\s*$/.exec(str(v));
  if (!m) return null;
  const [y, mo, da] = [Number(m[1]), Number(m[2]), Number(m[3])];
  if (mo < 1 || mo > 12 || da < 1 || da > 31) return null;
  const d = new Date(Date.UTC(y, mo - 1, da, Number(m[4] ?? 0), Number(m[5] ?? 0), Number(m[6] ?? 0)));
  // Date.UTC rolls 2024-02-30 into March; MySQL calls that no date.
  if (d.getUTCMonth() !== mo - 1) return null;
  return { d, hasTime: m[4] !== undefined };
}

const ymd = (d: Date) => `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
const ymdhms = (d: Date) => `${ymd(d)} ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())}`;
const DAY_MS = 86_400_000;
const dayNumber = (d: Date) => Math.floor(d.getTime() / DAY_MS);
const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const MONTH_NAMES = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const daysInMonth = (y: number, m0: number) => new Date(Date.UTC(y, m0 + 1, 0)).getUTCDate();

/** Add months the MySQL way: the day is clamped to the target month's last day (Jan 31 + 1 month = Feb 29 in 2024). */
function addMonths(d: Date, months: number): Date {
  const total = d.getUTCFullYear() * 12 + d.getUTCMonth() + Math.trunc(months);
  const y = Math.floor(total / 12);
  const m0 = total - y * 12;
  const day = Math.min(d.getUTCDate(), daysInMonth(y, m0));
  return new Date(Date.UTC(y, m0, day, d.getUTCHours(), d.getUTCMinutes(), d.getUTCSeconds()));
}

const UNIT_MS: Record<string, number> = { SECOND: 1000, MINUTE: 60_000, HOUR: 3_600_000, DAY: DAY_MS, WEEK: 7 * DAY_MS };

function dateArith(sign: 1 | -1): (args: SqlValue[]) => SqlValue {
  return ([date = null, amount = null, unit = "DAY"]) => {
    const p = parseDate(date);
    if (!p || isNull(amount) || isNull(unit)) return null;
    const u = str(unit).toUpperCase();
    const n = num(amount) * sign;
    let out: Date;
    if (u === "MONTH") out = addMonths(p.d, n);
    else if (u === "QUARTER") out = addMonths(p.d, n * 3);
    else if (u === "YEAR") out = addMonths(p.d, n * 12);
    else if (UNIT_MS[u]) out = new Date(p.d.getTime() + Math.trunc(n) * UNIT_MS[u]!);
    else return null;
    const timeUnit = u === "SECOND" || u === "MINUTE" || u === "HOUR";
    return p.hasTime || timeUnit ? ymdhms(out) : ymd(out);
  };
}

/** Whole months from a to b, MySQL's TIMESTAMPDIFF(MONTH…): a partial month does not count. */
function monthsBetween(a: Date, b: Date): number {
  let months = (b.getUTCFullYear() - a.getUTCFullYear()) * 12 + (b.getUTCMonth() - a.getUTCMonth());
  const aRest = a.getTime() - Date.UTC(a.getUTCFullYear(), a.getUTCMonth(), 1);
  const bRest = b.getTime() - Date.UTC(b.getUTCFullYear(), b.getUTCMonth(), 1);
  if (months > 0 && bRest < aRest) months--;
  if (months < 0 && bRest > aRest) months++;
  return months;
}

function dateFormat(date: SqlValue, fmt: SqlValue): SqlValue {
  const p = parseDate(date);
  if (!p || isNull(fmt)) return null;
  const d = p.d;
  const h = d.getUTCHours();
  const yday = dayNumber(d) - dayNumber(new Date(Date.UTC(d.getUTCFullYear(), 0, 1))) + 1;
  return str(fmt).replace(/%(.)/g, (_, c: string) => {
    switch (c) {
      case "Y": return String(d.getUTCFullYear());
      case "y": return pad(d.getUTCFullYear() % 100);
      case "m": return pad(d.getUTCMonth() + 1);
      case "c": return String(d.getUTCMonth() + 1);
      case "d": return pad(d.getUTCDate());
      case "e": return String(d.getUTCDate());
      case "H": return pad(h);
      case "k": return String(h);
      case "h": case "I": return pad(h % 12 === 0 ? 12 : h % 12);
      case "l": return String(h % 12 === 0 ? 12 : h % 12);
      case "i": return pad(d.getUTCMinutes());
      case "s": case "S": return pad(d.getUTCSeconds());
      case "p": return h < 12 ? "AM" : "PM";
      case "M": return MONTH_NAMES[d.getUTCMonth()]!;
      case "b": return MONTH_NAMES[d.getUTCMonth()]!.slice(0, 3);
      case "W": return DAY_NAMES[d.getUTCDay()]!;
      case "a": return DAY_NAMES[d.getUTCDay()]!.slice(0, 3);
      case "w": return String(d.getUTCDay());
      case "j": return pad(yday, 3);
      case "T": return `${pad(h)}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())}`;
      case "%": return "%";
      default: return c;
    }
  });
}

const datePart = (pick: (d: Date) => number): Fn => (v) => {
  const p = parseDate(v);
  return p ? pick(p.d) : null;
};

const math1 = (f: (x: number) => number): Fn => (x) => {
  if (isNull(x)) return null;
  const r = f(num(x));
  return Number.isFinite(r) ? r : null;
};

function thousands(x: SqlValue, decimals: SqlValue): SqlValue {
  if (isNull(x) || isNull(decimals)) return null;
  const d = Math.max(0, Math.min(30, Math.trunc(num(decimals))));
  const fixed = Math.abs(num(x)).toFixed(d);
  const [int, frac] = fixed.split(".");
  const grouped = int!.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return `${num(x) < 0 && Number(fixed) !== 0 ? "-" : ""}${grouped}${frac ? `.${frac}` : ""}`;
}

/** Fixed-arity functions: name → implementation. sql.js registers each at its declared arity. */
export const MYSQL_FUNCTIONS: ReadonlyArray<[string, Fn]> = [
  ["IF", (c, a, b) => (truthy(c) ? (a ?? null) : (b ?? null))],
  ["ISNULL", (v) => (isNull(v) ? 1 : 0)],
  // Dates
  ["YEAR", datePart((d) => d.getUTCFullYear())],
  ["MONTH", datePart((d) => d.getUTCMonth() + 1)],
  ["DAY", datePart((d) => d.getUTCDate())],
  ["DAYOFMONTH", datePart((d) => d.getUTCDate())],
  ["DAYOFWEEK", datePart((d) => d.getUTCDay() + 1)],
  ["WEEKDAY", datePart((d) => (d.getUTCDay() + 6) % 7)],
  ["DAYOFYEAR", datePart((d) => dayNumber(d) - dayNumber(new Date(Date.UTC(d.getUTCFullYear(), 0, 1))) + 1)],
  ["QUARTER", datePart((d) => Math.floor(d.getUTCMonth() / 3) + 1)],
  ["HOUR", datePart((d) => d.getUTCHours())],
  ["MINUTE", datePart((d) => d.getUTCMinutes())],
  ["SECOND", datePart((d) => d.getUTCSeconds())],
  ["DAYNAME", (v) => { const p = parseDate(v); return p ? DAY_NAMES[p.d.getUTCDay()]! : null; }],
  ["MONTHNAME", (v) => { const p = parseDate(v); return p ? MONTH_NAMES[p.d.getUTCMonth()]! : null; }],
  ["LAST_DAY", (v) => { const p = parseDate(v); return p ? ymd(new Date(Date.UTC(p.d.getUTCFullYear(), p.d.getUTCMonth() + 1, 0))) : null; }],
  ["DATEDIFF", (a, b) => {
    const pa = parseDate(a);
    const pb = parseDate(b);
    return pa && pb ? dayNumber(pa.d) - dayNumber(pb.d) : null;
  }],
  ["TIMESTAMPDIFF", (unit, a, b) => {
    const pa = parseDate(a);
    const pb = parseDate(b);
    if (!pa || !pb || isNull(unit)) return null;
    const u = str(unit).toUpperCase();
    if (u === "MONTH") return monthsBetween(pa.d, pb.d);
    if (u === "QUARTER") return Math.trunc(monthsBetween(pa.d, pb.d) / 3);
    if (u === "YEAR") return Math.trunc(monthsBetween(pa.d, pb.d) / 12);
    const ms = UNIT_MS[u];
    return ms ? Math.trunc((pb.d.getTime() - pa.d.getTime()) / ms) : null;
  }],
  ["DATE_FORMAT", dateFormat],
  ["CURDATE", () => ymd(new Date())],
  ["NOW", () => ymdhms(new Date())],
  // Strings
  ["LEFT", (s, n) => (isNull(s) || isNull(n) ? null : [...str(s)].slice(0, Math.max(0, Math.trunc(num(n)))).join(""))],
  ["RIGHT", (s, n) => {
    if (isNull(s) || isNull(n)) return null;
    const k = Math.max(0, Math.trunc(num(n)));
    const chars = [...str(s)];
    return k === 0 ? "" : chars.slice(-k).join("");
  }],
  ["LCASE", (s) => (isNull(s) ? null : str(s).toLowerCase())],
  ["UCASE", (s) => (isNull(s) ? null : str(s).toUpperCase())],
  ["CHAR_LENGTH", (s) => (isNull(s) ? null : [...str(s)].length)],
  ["CHARACTER_LENGTH", (s) => (isNull(s) ? null : [...str(s)].length)],
  ["REVERSE", (s) => (isNull(s) ? null : [...str(s)].reverse().join(""))],
  ["REPEAT", (s, n) => (isNull(s) || isNull(n) ? null : str(s).repeat(Math.max(0, Math.min(10_000, Math.trunc(num(n))))))],
  ["SPACE", (n) => (isNull(n) ? null : " ".repeat(Math.max(0, Math.min(10_000, Math.trunc(num(n))))))],
  ["LPAD", (s, n, p) => {
    if (isNull(s) || isNull(n) || isNull(p)) return null;
    const len = Math.max(0, Math.min(10_000, Math.trunc(num(n))));
    const chars = [...str(s)];
    if (chars.length >= len) return chars.slice(0, len).join("");
    const fill = str(p);
    if (!fill) return null;
    return (fill.repeat(Math.ceil((len - chars.length) / fill.length)).slice(0, len - chars.length)) + chars.join("");
  }],
  ["RPAD", (s, n, p) => {
    if (isNull(s) || isNull(n) || isNull(p)) return null;
    const len = Math.max(0, Math.min(10_000, Math.trunc(num(n))));
    const chars = [...str(s)];
    if (chars.length >= len) return chars.slice(0, len).join("");
    const fill = str(p);
    if (!fill) return null;
    return chars.join("") + fill.repeat(Math.ceil((len - chars.length) / fill.length)).slice(0, len - chars.length);
  }],
  ["SUBSTRING_INDEX", (s, delim, count) => {
    if (isNull(s) || isNull(delim) || isNull(count)) return null;
    const text = str(s);
    const d = str(delim);
    const n = Math.trunc(num(count));
    if (!d || n === 0) return "";
    const parts = text.split(d);
    return n > 0 ? parts.slice(0, n).join(d) : parts.slice(n).join(d);
  }],
  ["FORMAT", thousands],
  ["REGEXP", (pattern, value) => {
    if (isNull(pattern) || isNull(value)) return null;
    try {
      return new RegExp(str(pattern), "i").test(str(value)) ? 1 : 0;
    } catch {
      return null;
    }
  }],
  ["REGEXP_LIKE", (value, pattern) => {
    if (isNull(pattern) || isNull(value)) return null;
    try {
      return new RegExp(str(pattern), "i").test(str(value)) ? 1 : 0;
    } catch {
      return null;
    }
  }],
  // Numbers (SQLite's math functions are not compiled into sql.js)
  ["MOD", (a, b) => (isNull(a) || isNull(b) || num(b) === 0 ? null : num(a) % num(b))],
  ["POW", (a, b) => (isNull(a) || isNull(b) ? null : Math.pow(num(a), num(b)))],
  ["POWER", (a, b) => (isNull(a) || isNull(b) ? null : Math.pow(num(a), num(b)))],
  ["CEIL", math1(Math.ceil)],
  ["CEILING", math1(Math.ceil)],
  ["FLOOR", math1(Math.floor)],
  ["SQRT", math1((x) => (x < 0 ? NaN : Math.sqrt(x)))],
  ["LN", math1((x) => (x <= 0 ? NaN : Math.log(x)))],
  ["LOG2", math1((x) => (x <= 0 ? NaN : Math.log2(x)))],
  ["LOG10", math1((x) => (x <= 0 ? NaN : Math.log10(x)))],
  ["EXP", math1(Math.exp)],
  ["SIGN", math1(Math.sign)],
  ["PI", () => Math.PI],
  ["TRUNCATE", (x, d) => {
    if (isNull(x) || isNull(d)) return null;
    const f = Math.pow(10, Math.trunc(num(d)));
    return Math.trunc(num(x) * f) / f;
  }],
];

/**
 * Functions taking a varying number of arguments. sql.js keeps one callback
 * per function *name* (registering a name again frees the earlier one), so
 * these are registered once with arity -1 (variadic) and check their own
 * argument count — [name, implementation, fewest, most].
 */
export const MYSQL_VARIADIC: ReadonlyArray<[string, (args: SqlValue[]) => SqlValue, number, number]> = [
  // MySQL: NULL if any argument is NULL. SQLite's concat() skips NULLs.
  ["CONCAT", (args) => (args.some(isNull) ? null : args.map(str).join("")), 1, 255],
  ["CONCAT_WS", (args) => (isNull(args[0]) ? null : args.slice(1).filter((a) => !isNull(a)).map(str).join(str(args[0]!))), 2, 255],
  ["GREATEST", (args) => (args.some(isNull) ? null : args.reduce((m, v) => (compareValues(v, m) > 0 ? v : m))), 2, 255],
  ["LEAST", (args) => (args.some(isNull) ? null : args.reduce((m, v) => (compareValues(v, m) < 0 ? v : m))), 2, 255],
  ["FIELD", (args) => {
    if (isNull(args[0])) return 0;
    const i = args.slice(1).findIndex((v) => !isNull(v) && compareValues(v, args[0]!) === 0);
    return i + 1;
  }, 2, 255],
  // LOG(x) is ln; LOG(b, x) is log base b.
  ["LOG", (args) => {
    if (args.length === 1) return isNull(args[0]) || num(args[0]!) <= 0 ? null : Math.log(num(args[0]!));
    const [b, x] = args;
    return isNull(b) || isNull(x) || num(b!) <= 0 || num(b!) === 1 || num(x!) <= 0 ? null : Math.log(num(x!)) / Math.log(num(b!));
  }, 1, 2],
  // DATE_ADD(d, n, unit) after lib/sql/dialect rewrote INTERVAL n UNIT; ADDDATE(d, n) adds days.
  ["DATE_ADD", dateArith(1), 2, 3],
  ["DATE_SUB", dateArith(-1), 2, 3],
  ["ADDDATE", dateArith(1), 2, 3],
  ["SUBDATE", dateArith(-1), 2, 3],
  // LOCATE(sub, s[, pos])
  ["LOCATE", (args) => {
    const [sub, s, pos] = args;
    if (isNull(sub) || isNull(s)) return null;
    const from = args.length === 3 ? Math.max(1, Math.trunc(num(pos ?? 1))) : 1;
    const at = str(s!).toLowerCase().indexOf(str(sub!).toLowerCase(), from - 1);
    return at + 1;
  }, 2, 3],
];

/** MySQL compares numbers as numbers and anything else as text. */
function compareValues(a: SqlValue, b: SqlValue): number {
  if (typeof a === "number" && typeof b === "number") return a - b;
  if (typeof a === "number" || typeof b === "number") return num(a) - num(b);
  return str(a) < str(b) ? -1 : str(a) > str(b) ? 1 : 0;
}

/** A function of `fn`'s body with a declared arity — sql.js reads `length` to register it. */
export function withArity<T extends (...args: never[]) => unknown>(fn: T, arity: number): T {
  Object.defineProperty(fn, "length", { value: arity });
  return fn;
}

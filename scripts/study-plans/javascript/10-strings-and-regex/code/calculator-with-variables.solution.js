"use strict";
const lines = require("fs").readFileSync(0, "utf8").split("\n").filter((l) => l.trim() !== "");
const TOKEN = /\s*(?:(?<num>\d+(?:\.\d+)?)|(?<id>[A-Za-z_]\w*)|(?<op>[-+*/^()=]))/y;
const vars = new Map();
function tokenize(src) {
  const tokens = [];
  TOKEN.lastIndex = 0;
  while (TOKEN.lastIndex < src.length) {
    const start = TOKEN.lastIndex;
    const m = TOKEN.exec(src);
    if (!m) {
      const rest = src.slice(start);
      if (/^\s*$/.test(rest)) break;
      const at = start + rest.match(/^\s*/)[0].length;
      throw new SyntaxError(`unexpected character '${src[at]}' at ${at}`);
    }
    const type = Object.keys(m.groups).find((k) => m.groups[k] !== undefined);
    tokens.push({ type, value: m.groups[type], pos: m.index + m[0].length - m.groups[type].length });
  }
  tokens.push({ type: "eof", value: "", pos: src.length });
  return tokens;
}
function run(src) {
  const tokens = tokenize(src);
  let i = 0;
  const peek = () => tokens[i];
  const next = () => tokens[i++];
  const describe = (t) => (t.type === "eof" ? "end of input" : `'${t.value}'`);
  function statement() {
    if (tokens[0].type === "id" && tokens[1].value === "=") {
      const name = next().value; next();
      const value = expr();
      vars.set(name, value);
      return `${name} = ${value}`;
    }
    return String(expr());
  }
  function expr() {
    let left = term();
    while (peek().value === "+" || peek().value === "-") { const op = next().value; const right = term(); left = op === "+" ? left + right : left - right; }
    return left;
  }
  function term() {
    let left = unary();
    while (peek().value === "*" || peek().value === "/") {
      const op = next(); const right = unary();
      if (op.value === "/" && right === 0) throw new RangeError(`division by zero at ${op.pos}`);
      left = op.value === "*" ? left * right : left / right;
    }
    return left;
  }
  function unary() {
    if (peek().value === "-") { next(); return -unary(); }       // binds looser than ^: -2 ^ 2 is -(2 ^ 2)
    return power();
  }
  function power() {
    const base = primary();
    if (peek().value === "^") { next(); return base ** unary(); }   // right-associative, and the exponent may be negative
    return base;
  }
  function primary() {
    const t = peek();
    if (t.type === "num") { next(); return Number(t.value); }
    if (t.type === "id") {
      next();
      if (!vars.has(t.value)) throw new ReferenceError(`unknown variable '${t.value}' at ${t.pos}`);
      return vars.get(t.value);
    }
    if (t.value === "(") {
      next();
      const v = expr();
      if (peek().value !== ")") throw new SyntaxError(`expected ')' but found ${describe(peek())} at ${peek().pos}`);
      next();
      return v;
    }
    throw new SyntaxError(`unexpected ${describe(t)} at ${t.pos}`);
  }
  const result = statement();
  if (peek().type !== "eof") throw new SyntaxError(`unexpected ${describe(peek())} at ${peek().pos}`);
  return result;
}
for (const line of lines) {
  try { console.log(run(line)); }
  catch (err) { console.log(`${err.name}: ${err.message}`); }
}

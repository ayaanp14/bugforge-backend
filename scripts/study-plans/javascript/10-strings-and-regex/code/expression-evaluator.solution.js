"use strict";
const lines = require("fs").readFileSync(0, "utf8").split("\n").filter((l) => l.trim() !== "");
const TOKEN = /\s*(?:(?<num>\d+(?:\.\d+)?)|(?<op>[-+*/()]))/y;
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
    const type = m.groups.num !== undefined ? "num" : "op";
    tokens.push({ type, value: m.groups[type], pos: m.index + m[0].length - m.groups[type].length });
  }
  tokens.push({ type: "eof", value: "", pos: src.length });
  return tokens;
}
function evaluate(src) {
  const tokens = tokenize(src);
  let i = 0;
  const peek = () => tokens[i];
  const next = () => tokens[i++];
  const describe = (t) => (t.type === "eof" ? "end of input" : `'${t.value}'`);
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
    if (t.value === "(") {
      next();
      const v = expr();
      if (peek().value !== ")") throw new SyntaxError(`expected ')' but found ${describe(peek())} at ${peek().pos}`);
      next();
      return v;
    }
    throw new SyntaxError(`unexpected ${describe(t)} at ${t.pos}`);
  }
  const value = expr();
  if (peek().type !== "eof") throw new SyntaxError(`unexpected ${describe(peek())} at ${peek().pos}`);
  return value;
}
for (const line of lines) {
  try { console.log(`${line.trim()} = ${evaluate(line)}`); }
  catch (err) { console.log(`${err.name}: ${err.message}`); }
}

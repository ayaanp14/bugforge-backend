"use strict";
const lines = require("fs").readFileSync(0, "utf8").split("\n").filter((l) => l.trim() !== "");
const escapeHtml = (v) => String(v).replace(/[&<>"']/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[ch]);
function html(strings, ...values) {
  return strings.reduce((out, str, i) => out + str + (i < values.length ? escapeHtml(values[i]) : ""), "");
}
function sql(strings, ...values) {
  const text = strings.reduce((out, str, i) => out + str + (i < values.length ? `$${i + 1}` : ""), "");
  return { text, values };
}
const [name, comment, id] = lines.map((l) => l.trim());
console.log(html`<p class="by">${name}</p><blockquote>${comment}</blockquote>`);
const q = sql`SELECT * FROM comments WHERE author = ${name} AND id = ${Number(id)}`;
console.log(`${q.text} -- ${JSON.stringify(q.values)}`);
const parts = (strings, ...values) => `strings=${JSON.stringify(strings)} raw=${JSON.stringify(strings.raw)} values=${JSON.stringify(values)}`;
console.log(parts`a\n${1}b${2}`);
console.log(`raw=${String.raw`C:\new\table`} interpolated=${`C:\new`.length}`);

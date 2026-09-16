"use strict";
const lines = require("fs").readFileSync(0, "utf8").split("\n").filter((l) => l.trim() !== "");
class Node { constructor(value, next = null) { this.value = value; this.next = next; } }
class LinkedList {
  #head = null;
  #size = 0;
  get size() { return this.#size; }
  static from(iterable) {
    const list = new LinkedList();
    for (const v of iterable) list.push(v);
    return list;
  }
  #nodeAt(i) {
    let node = this.#head;
    for (let k = 0; k < i; k++) node = node.next;
    return node;
  }
  push(value) { return this.insertAt(this.#size, value); }
  unshift(value) { return this.insertAt(0, value); }
  insertAt(i, value) {
    if (i < 0 || i > this.#size) throw new RangeError("index out of range");
    if (i === 0) this.#head = new Node(value, this.#head);
    else { const prev = this.#nodeAt(i - 1); prev.next = new Node(value, prev.next); }
    this.#size++;
    return this;
  }
  removeAt(i) {
    if (i < 0 || i >= this.#size) throw new RangeError("index out of range");
    let removed;
    if (i === 0) { removed = this.#head; this.#head = removed.next; }
    else { const prev = this.#nodeAt(i - 1); removed = prev.next; prev.next = removed.next; }
    this.#size--;
    return removed.value;
  }
  indexOf(value) {
    let i = 0;
    for (const v of this) { if (v === value) return i; i++; }
    return -1;
  }
  reverse() {
    let prev = null, node = this.#head;
    while (node !== null) { const next = node.next; node.next = prev; prev = node; node = next; }
    this.#head = prev;
    return this;
  }
  *[Symbol.iterator]() { for (let n = this.#head; n !== null; n = n.next) yield n.value; }
  toString() { return `[${[...this].join(" -> ")}] size=${this.#size}`; }
}
const list = new LinkedList();
for (const line of lines) {
  const [cmd, a, b] = line.trim().split(/\s+/);
  try {
    if (cmd === "push") list.push(Number(a));
    else if (cmd === "unshift") list.unshift(Number(a));
    else if (cmd === "insert") list.insertAt(Number(a), Number(b));
    else if (cmd === "remove") console.log(`removed=${list.removeAt(Number(a))}`);
    else if (cmd === "find") console.log(`index=${list.indexOf(Number(a))}`);
    else if (cmd === "reverse") list.reverse();
    else if (cmd === "show") console.log(String(list));
    else if (cmd === "sum") console.log(`sum=${[...list].reduce((s, v) => s + v, 0)}`);
  } catch (e) {
    console.log(`error: ${e.message}`);
  }
}

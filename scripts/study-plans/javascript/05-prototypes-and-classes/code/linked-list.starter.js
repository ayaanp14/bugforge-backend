"use strict";
const lines = require("fs").readFileSync(0, "utf8").split("\n").filter((l) => l.trim() !== "");
class Node { constructor(value, next = null) { this.value = value; this.next = next; } }
class LinkedList {
  #head = null;
  #size = 0;
  // TODO: get size, push, unshift, insertAt(i, v), removeAt(i), indexOf(v), reverse(), toString(), [Symbol.iterator], static from(iterable)
}
const list = new LinkedList();
for (const line of lines) {
  const [cmd, a, b] = line.trim().split(/\s+/);
  // TODO: push v | unshift v | insert i v | remove i | find v | reverse | show | sum
}

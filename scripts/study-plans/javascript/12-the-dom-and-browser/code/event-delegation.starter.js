"use strict";
const lines = require("fs").readFileSync(0, "utf8").split("\n").filter((l) => l.trim() !== "");
// The container holds items; a click lands on a path like `item3.icon` (the icon span inside item 3) or `item3` or `gap`.
const items = new Map();   // id -> { id, action }
let listenerCount = 0;
// TODO: one delegated listener on the container, an `once` listener for the first click, commands add/remove/click

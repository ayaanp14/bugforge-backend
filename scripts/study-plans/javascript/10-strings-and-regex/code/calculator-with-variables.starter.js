"use strict";
const lines = require("fs").readFileSync(0, "utf8").split("\n").filter((l) => l.trim() !== "");
const TOKEN = /\s*(?:(?<num>\d+(?:\.\d+)?)|(?<id>[A-Za-z_]\w*)|(?<op>[-+*/^()=]))/y;
const vars = new Map();
// TODO: tokenizer; statement := id '=' expr | expr; term := unary (('*'|'/') unary)*; unary := '-' unary | power; power := primary ('^' unary)?

"use strict";
const input = require("fs").readFileSync(0, "utf8");
const text = input.trim();
const DATE = /(?<y>\d{4})-(?<m>\d{2})-(?<d>\d{2})/g;
// TODO: matchAll with positions, reformat with $<name>, all numbers, split on , or ;

"use strict";
const input = require("fs").readFileSync(0, "utf8");
const plan = JSON.parse(input);       // { routes: { name: [modules] }, sizes: { module: kb }, vendor: [modules] }
// TODO: vendor chunk, shared chunk (modules used by 2+ routes, not vendor), one chunk per route; manifest with sizes; initial load per route

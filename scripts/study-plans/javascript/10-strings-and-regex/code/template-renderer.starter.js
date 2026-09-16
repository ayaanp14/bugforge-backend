"use strict";
const input = require("fs").readFileSync(0, "utf8");
const [contextLine, ...templateLines] = input.split("\n");
const context = JSON.parse(contextLine);
const template = templateLines.join("\n").trimEnd();
const filters = {
  // TODO: upper, lower, money, default:<text>
};
function render(tpl, ctx) {
  // TODO: {{#each list}}...{{/each}} with {{this}}, {{#if key}}...{{/if}}, {{ key | filter }} — via replace with functions
}
console.log(render(template, context));

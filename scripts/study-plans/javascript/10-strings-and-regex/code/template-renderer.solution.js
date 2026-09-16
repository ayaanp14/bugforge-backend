"use strict";
const input = require("fs").readFileSync(0, "utf8");
const [contextLine, ...templateLines] = input.split("\n");
const context = JSON.parse(contextLine);
const template = templateLines.join("\n").trimEnd();
const filters = {
  upper: (v) => String(v).toUpperCase(),
  lower: (v) => String(v).toLowerCase(),
  money: (v) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(Number(v)),
  default: (v, arg) => (v === undefined || v === null || v === "" ? arg : v),
};
const lookup = (ctx, path) => path.split(".").reduce((o, k) => (o === undefined || o === null ? undefined : o[k]), ctx);
function render(tpl, ctx) {
  let out = tpl.replace(/\{\{#each (\w+)\}\}([\s\S]*?)\{\{\/each\}\}/g, (_, key, body) => {
    const list = lookup(ctx, key);
    return Array.isArray(list) ? list.map((item, i) => render(body, { ...ctx, this: item, index: i })).join("") : "";
  });
  out = out.replace(/\{\{#if (\w+)\}\}([\s\S]*?)\{\{\/if\}\}/g, (_, key, body) => (lookup(ctx, key) ? render(body, ctx) : ""));
  out = out.replace(/\{\{\s*([\w.]+)((?:\s*\|\s*\w+(?::[^|}]+)?)*)\s*\}\}/g, (_, path, pipes) => {
    let value = lookup(ctx, path);
    for (const step of pipes.split("|").map((s) => s.trim()).filter(Boolean)) {
      const [name, arg] = step.split(":");
      if (!filters[name]) throw new SyntaxError(`unknown filter '${name}'`);
      value = filters[name](value, arg);
    }
    return value === undefined || value === null ? "" : String(value);
  });
  return out;
}
console.log(render(template, context));

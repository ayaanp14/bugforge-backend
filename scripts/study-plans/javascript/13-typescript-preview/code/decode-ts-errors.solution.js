"use strict";
const lines = require("fs").readFileSync(0, "utf8").split("\n").filter((l) => l.trim() !== "");
const rules = [
  [/^TS2322: Type '(.+?)' is not assignable to type '(.+?)'/, (m) => `a '${m[1]}' was given where a '${m[2]}' is expected - fix the value or the type, do not cast`],
  [/^TS2345: Argument of type '(.+?)' is not assignable to parameter of type '(.+?)'/, (m) => `the argument is a '${m[1]}' but the parameter wants '${m[2]}'`],
  [/^TS2339: Property '(.+?)' does not exist on type '(.+?)'/, (m) => `no '${m[1]}' on '${m[2]}' - a typo, or narrow the union first`],
  [/^TS7006: Parameter '(.+?)' implicitly has an 'any' type/, (m) => `annotate parameter '${m[1]}' (noImplicitAny)`],
  [/^TS(?:2531|18047|18048): (?:Object is possibly|'(.+?)' is possibly) '(null|undefined)'/, (m) => `${m[1] ? `'${m[1]}'` : "the value"} may be ${m[2]} - check it, use ?. / ??, or handle the case (strictNullChecks)`],
  [/^TS2307: Cannot find module '(.+?)'/, (m) => `install '${m[1]}' (and its @types), or fix the path/extension, or add a declaration`],
  [/^TS2564: Property '(.+?)' has no initializer/, (m) => `initialise '${m[1]}' in the constructor, make it optional, or use ! when a framework assigns it`],
  [/^TS2352: Conversion of type '(.+?)' to type '(.+?)' may be a mistake/, (m) => `'${m[1]}' and '${m[2]}' do not overlap - the 'as' is hiding a logic error`],
  [/^TS1259: Module '(.+?)' can only be default-imported using the 'esModuleInterop' flag/, (m) => `enable esModuleInterop or use import * as x from '${m[1]}'`],
];
for (const line of lines) {
  const text = line.trim();
  const code = /^TS\d+/.exec(text)?.[0] ?? "TS????";
  const hit = rules.map(([re, hint]) => { const m = re.exec(text); return m && hint(m); }).find(Boolean);
  console.log(`${code}: ${hit ?? "no rule - read the last 'is not assignable' line of the message for the real mismatch"}`);
}

"use strict";
const obj = JSON.parse(require("fs").readFileSync(0, "utf8"));
obj.u = undefined;
obj.f = () => 1;
obj.d = new Date(0);
obj.n = NaN;
// TODO: stringify, parse back, report what survived

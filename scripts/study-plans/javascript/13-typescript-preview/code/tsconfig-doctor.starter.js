"use strict";
const input = require("fs").readFileSync(0, "utf8");
const config = JSON.parse(input);
const opts = config.compilerOptions ?? {};
const findings = [];
// TODO: strict, noUncheckedIndexedAccess, skipLibCheck, isolatedModules, target vs Node 16, module/moduleResolution, esModuleInterop, include, outDir/rootDir

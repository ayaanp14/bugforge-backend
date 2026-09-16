"use strict";
const cfg = Object.freeze(JSON.parse(require("fs").readFileSync(0, "utf8")));
let top;
try { cfg.retries = 99; top = "changed"; } catch (e) { top = e.constructor.name; }
let nested;
try { cfg.hosts.push("z"); nested = `changed to ${cfg.hosts.length}`; } catch (e) { nested = e.constructor.name; }
console.log(`top=${top} nested=${nested}`);
console.log(`frozen=${Object.isFrozen(cfg)} nestedFrozen=${Object.isFrozen(cfg.hosts)}`);
console.log(`retries=${cfg.retries} hosts=${JSON.stringify(cfg.hosts)}`);

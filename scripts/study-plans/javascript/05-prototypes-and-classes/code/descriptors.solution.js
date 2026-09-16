"use strict";
const record = JSON.parse(require("fs").readFileSync(0, "utf8"));
Object.defineProperty(record, "id", { value: "rec-1" });                       // writable/enumerable/configurable all default to false
Object.defineProperty(record, "size", { get() { return Object.keys(this).length; }, enumerable: true });
console.log(`keys=${Object.keys(record).join(",")}`);
console.log(`names=${Object.getOwnPropertyNames(record).join(",")}`);
console.log(`json=${JSON.stringify(record)}`);
let write;
try { record.id = "other"; write = "changed"; } catch (e) { write = e.constructor.name; }
let remove;
try { delete record.id; remove = "deleted"; } catch (e) { remove = e.constructor.name; }
console.log(`writeId=${write} deleteId=${remove} id=${record.id}`);
const d = Object.getOwnPropertyDescriptor(record, "id");
console.log(`descriptor(id)=${JSON.stringify(d)}`);
Object.freeze(record);
let add;
try { record.extra = 1; add = "added"; } catch (e) { add = e.constructor.name; }
console.log(`frozen=${Object.isFrozen(record)} add=${add} sizeStillComputed=${record.size}`);

"use strict";
const lines = require("fs").readFileSync(0, "utf8").split("\n").filter((l) => l.trim() !== "");
const values = lines[0].trim().split(/\s+/).map(Number);
const i8 = Int8Array.from(values), u8c = Uint8ClampedArray.from(values), f32 = Float32Array.from(values), f64 = Float64Array.from(values);
console.log(`Int8Array=${JSON.stringify([...i8])} (wraps modulo 256)`);
console.log(`Uint8ClampedArray=${JSON.stringify([...u8c])} (clamps to 0..255, rounds)`);
console.log(`Float32Array=${JSON.stringify([...f32])} exact=${[...f32].every((v, i) => v === values[i])}`);
console.log(`bytes: i8=${i8.byteLength} f32=${f32.byteLength} f64=${f64.byteLength} elements=${values.length}`);
const plainSum = values.reduce((a, b) => a + b, 0), typedSum = f64.reduce((a, b) => a + b, 0);
console.log(`sum plain=${plainSum} typed=${typedSum} equal=${plainSum === typedSum}`);
const view = f64.subarray(0, 2);
view[0] = -1;                                                       // subarray shares the buffer: the original changes
const copy = f64.slice(0, 2);
copy[1] = -2;                                                       // slice copies: the original does not
console.log(`after subarray write: f64[0]=${f64[0]} sharedBuffer=${view.buffer === f64.buffer} | after slice write: f64[1]=${f64[1]} copyBuffer=${copy.buffer === f64.buffer}`);
const dv = new DataView(new ArrayBuffer(4));
dv.setUint16(0, 258);                                               // default big-endian: 0x01 0x02
console.log(`DataView: bytes=${[...new Uint8Array(dv.buffer, 0, 2)].join(",")} readBE=${dv.getUint16(0)} readLE=${dv.getUint16(0, true)}`);
let holey;
try { new Float64Array(3)[7] = 1; holey = "ignored (no holes, no growth)"; } catch (err) { holey = err.name; }
console.log(`out-of-range write on a typed array: ${holey}; length after: ${new Float64Array(3).length}`);

"use strict";
const lines = require("fs").readFileSync(0, "utf8").split("\n").filter((l) => l.trim() !== "");
const values = lines[0].trim().split(/\s+/).map(Number);
// TODO: Int8Array wrap-around, Uint8ClampedArray clamping, Float32Array precision, byteLength, sums, subarray (shared) vs slice (copy), DataView endianness

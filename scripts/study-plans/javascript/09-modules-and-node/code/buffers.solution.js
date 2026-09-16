"use strict";
const lines = require("fs").readFileSync(0, "utf8").split("\n").filter((l) => l.trim() !== "");
const { StringDecoder } = require("node:string_decoder");
const [b64, hex] = lines;
const fromB64 = Buffer.from(b64.trim(), "base64");
console.log(`base64 -> ${JSON.stringify(fromB64.toString("utf8"))} bytes=${fromB64.length} hex=${fromB64.toString("hex")}`);
const fromHex = Buffer.from(hex.trim(), "hex");
console.log(`hex -> ${JSON.stringify(fromHex.toString("utf8"))} base64=${fromHex.toString("base64")} uint16be=${fromHex.length >= 2 ? fromHex.readUInt16BE(0) : "n/a"}`);
const accent = String.fromCodePoint(0xe9);              // one character, two UTF-8 bytes
const word = `caf${accent}`;
const bytes = Buffer.from(word, "utf8");
console.log(`length=${word.length} byteLength=${Buffer.byteLength(word)} bytes=${bytes.toString("hex")}`);
const chunks = [bytes.subarray(0, 4), bytes.subarray(4)];  // the boundary splits the two-byte character
const naive = chunks.map((c) => c.toString("utf8")).join("");
const decoder = new StringDecoder("utf8");
const careful = chunks.map((c) => decoder.write(c)).join("") + decoder.end();
const codes = (s) => [...s].map((ch) => ch.codePointAt(0).toString(16)).join(" ");
console.log(`naive=${codes(naive)} careful=${codes(careful)} equal=${careful === word}`);
console.log(`compare=${Buffer.compare(Buffer.from("a"), Buffer.from("b"))} equals=${Buffer.from("hi").equals(Buffer.from("hi"))} concat=${Buffer.concat([Buffer.from("ab"), Buffer.from("cd")]).toString()}`);

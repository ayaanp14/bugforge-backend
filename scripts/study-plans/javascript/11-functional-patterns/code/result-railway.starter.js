"use strict";
const lines = require("fs").readFileSync(0, "utf8").split("\n").filter((l) => l.trim() !== "");
const Ok = (value) => ({ ok: true, value, map: (f) => Ok(f(value)), mapErr: () => Ok(value), flatMap: (f) => f(value), getOrElse: () => value, match: ({ ok }) => ok(value) });
const Err = (error) => ({ ok: false, error, map: () => Err(error), mapErr: (f) => Err(f(error)), flatMap: () => Err(error), getOrElse: (fb) => fb, match: ({ err }) => err(error) });
const attempt = (fn) => { try { return Ok(fn()); } catch (e) { return Err(e); } };
// TODO: parseJson -> requireObject -> requireAge -> normalise, chained with flatMap/map; then collect all outcomes

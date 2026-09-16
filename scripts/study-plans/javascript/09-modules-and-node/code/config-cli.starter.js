"use strict";
const input = require("fs").readFileSync(0, "utf8");
const DEFAULTS = { port: 3000, host: "localhost", debug: false, workers: 1 };
const ENV_KEYS = { port: "APP_PORT", host: "APP_HOST", debug: "APP_DEBUG", workers: "APP_WORKERS" };
// TODO: parse argv (line 1) and KEY=VALUE env lines; merge flag > env > default with coercion; validate; report sources

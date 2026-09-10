/**
 * Offline compile gate for the catalog's typed-language solutions.
 *
 *   npx tsx scripts/catalog-compilecheck.mts [--only slug,slug] [--lang rust,java]
 *
 * Runs the real `applyDriver` output for each problem through the compilers
 * that exist on this machine — rustc and javac — without executing anything.
 * That catches the failures the remote validator is slowest and most
 * expensive to surface: a Rust cast that parses as a generic argument, a Java
 * type error, a name that collides with the driver. Compiling is a few hundred
 * milliseconds; a round trip to the judge is forty-five seconds per problem.
 *
 * The other eleven languages have no local toolchain here, so
 * `seed-catalog.ts --validate --lang all` remains the authoritative gate. This
 * just makes the common mistakes cheap to find.
 */

import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { applyDriver, type Language } from "../src/lib/driver-codegen.js";
import { CATALOG } from "./catalog/index.js";

const args = process.argv.slice(2);
const opt = (n: string) => {
  const i = args.indexOf(`--${n}`);
  return i >= 0 && args[i + 1] ? args[i + 1] : null;
};
const ONLY = opt("only")?.split(",").map((s) => s.trim()).filter(Boolean) ?? null;
const LANGS = (opt("lang")?.split(",").map((s) => s.trim()) ?? ["rust", "java"]) as Language[];

const has = (bin: string) => {
  try {
    execFileSync(bin, ["--version"], { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
};

const available: Partial<Record<Language, boolean>> = {
  rust: has("rustc"),
  java: has("javac"),
};

const workDir = fs.mkdtempSync(path.join(os.tmpdir(), "catalog-compile-"));

/** Compile one file, returning the compiler's complaint or null when clean. */
function compile(lang: Language, source: string): string | null {
  try {
    if (lang === "rust") {
      const file = path.join(workDir, "main.rs");
      fs.writeFileSync(file, source);
      // --emit=metadata type-checks and borrow-checks without invoking the
      // platform linker, which is both faster and free of Windows link.exe noise.
      execFileSync("rustc", ["--edition", "2018", "--emit=metadata", "--out-dir", workDir, file], {
        stdio: ["ignore", "ignore", "pipe"],
      });
      return null;
    }
    if (lang === "java") {
      const file = path.join(workDir, "Main.java");
      fs.writeFileSync(file, source);
      execFileSync("javac", ["-nowarn", "-d", workDir, file], { stdio: ["ignore", "ignore", "pipe"] });
      return null;
    }
    return null;
  } catch (e) {
    const err = e as { stderr?: Buffer };
    return (err.stderr?.toString() ?? String(e)).split("\n").slice(0, 6).join("\n");
  }
}

const list = CATALOG.filter((p) => !ONLY || ONLY.includes(p.slug));
const wanted = LANGS.filter((l) => {
  if (!available[l]) { console.log(`SKIP ${l} — no local toolchain`); return false; }
  return true;
});

let pass = 0;
const failures: string[] = [];
const t0 = Date.now();
for (const spec of list) {
  for (const lang of wanted) {
    const solution = spec.solutions[lang];
    if (!solution) continue;
    const err = compile(lang, applyDriver(lang, spec.signature, solution));
    if (err) {
      failures.push(`FAIL ${spec.slug} [${lang}]\n${err}`);
      console.log(`FAIL ${spec.slug} [${lang}]`);
    } else {
      pass++;
    }
  }
}
for (const f of failures) console.log(`\n${f}`);
console.log(`\n== ${pass} compiled, ${failures.length} failed (${Math.round((Date.now() - t0) / 1000)}s)`);
fs.rmSync(workDir, { recursive: true, force: true });
if (failures.length) process.exitCode = 1;

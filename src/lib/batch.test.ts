import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { gzipSync } from "node:zlib";
import { BEGIN_MARKER, GZIP_MARKER, MAX_DECODED_STDOUT_BYTES, decodeBatchStdout, isolateDriverOutput } from "./batch.js";

const gzBlock = (text: string | Buffer) => `${GZIP_MARKER}${gzipSync(text).toString("base64")}`;

describe("batch stdout decoding", () => {
  it("inflates an honest gzipped block", () => {
    const answers = "[1,2]\n__CASE__\n[3,4]\n";
    assert.equal(decodeBatchStdout(gzBlock(answers)), answers);
  });

  it("refuses a block that would inflate past the cap, and leaves it raw", () => {
    // What user code can print after its own BEGIN line before exiting: a
    // few hundred kilobytes that inflate far past anything a suite answers.
    const bomb = gzBlock(Buffer.alloc(MAX_DECODED_STDOUT_BYTES + 1024 * 1024));
    assert.ok(bomb.length < 100_000, "the bomb fits under Paiza's stdout cap");
    assert.equal(decodeBatchStdout(bomb), bomb);
  });

  it("decodes only what follows the last BEGIN line", () => {
    const forged = `${BEGIN_MARKER}\nnot the driver\n`;
    const { driver, user } = isolateDriverOutput(`${forged}${BEGIN_MARKER}\n${gzBlock("ok\n")}`);
    assert.equal(decodeBatchStdout(driver), "ok\n");
    assert.ok(user?.includes("not the driver"));
  });
});

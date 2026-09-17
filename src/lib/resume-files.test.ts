import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { MAX_RESUME_BYTES, ResumeFileError, safeFilename, sniffFormat, storageKeyFor, titleFromFilename, validateResumeUpload } from "./resume-files.js";

/**
 * Upload validation: the bytes decide the format, not the name or the
 * declared type; size bounds; filenames that cannot escape or lie.
 *
 * Run with: npm test
 */

const pdfBytes = (n = 400) => Buffer.concat([Buffer.from("%PDF-1.7\n"), Buffer.alloc(n, 0x20)]);
const zipBytes = (n = 400) => Buffer.concat([Buffer.from([0x50, 0x4b, 0x03, 0x04]), Buffer.alloc(n, 0)]);

describe("sniffFormat", () => {
  it("reads the magic bytes", () => {
    assert.equal(sniffFormat(pdfBytes()), "pdf");
    assert.equal(sniffFormat(zipBytes()), "docx");
    assert.equal(sniffFormat(Buffer.from("<html><body>resume</body></html>")), null);
    assert.equal(sniffFormat(Buffer.from("%PD")), null);
  });
});

describe("validateResumeUpload", () => {
  it("accepts a PDF whatever the declared type says", () => {
    assert.equal(validateResumeUpload(pdfBytes(), "application/octet-stream"), "pdf");
    assert.equal(validateResumeUpload(zipBytes(), "application/pdf"), "docx");
  });
  it("refuses a file that is not a PDF or a zip, wording the .doc case", () => {
    assert.throws(() => validateResumeUpload(Buffer.from("plain text resume ".repeat(30)), "text/plain"), (e: ResumeFileError) => e.status === 415 && /PDF and DOCX/.test(e.message));
    assert.throws(() => validateResumeUpload(Buffer.from("\xd0\xcf\x11\xe0".repeat(100), "latin1"), "application/msword"), (e: ResumeFileError) => e.status === 415 && /\.doc/.test(e.message));
  });
  it("refuses tiny and oversized files", () => {
    assert.throws(() => validateResumeUpload(Buffer.from("%PDF-1.4"), "application/pdf"), (e: ResumeFileError) => e.status === 400);
    assert.throws(() => validateResumeUpload(Buffer.alloc(MAX_RESUME_BYTES + 1, 0x25), "application/pdf"), (e: ResumeFileError) => e.status === 413);
  });
});

describe("safeFilename", () => {
  it("keeps the base name only and the sniffed extension", () => {
    assert.equal(safeFilename("../../etc/passwd", "pdf"), "passwd.pdf");
    assert.equal(safeFilename("C:\\Users\\me\\My Resume.docx", "docx"), "My Resume.docx");
    assert.equal(safeFilename("resume.exe", "pdf"), "resume.pdf");
    assert.equal(safeFilename("bad<>:\"|?*name.pdf", "pdf"), "badname.pdf");
    assert.equal(safeFilename("", "docx"), "resume.docx");
    assert.equal(safeFilename(null, "pdf"), "resume.pdf");
  });
  it("bounds the length and strips control characters", () => {
    const long = "a".repeat(300) + ".pdf";
    assert.ok(safeFilename(long, "pdf").length <= 104);
    assert.equal(safeFilename("na\x00me\x1f.pdf", "pdf"), "name.pdf");
  });
});

describe("titleFromFilename / storageKeyFor", () => {
  it("makes a readable title", () => {
    assert.equal(titleFromFilename("ayaan_resume-2026.pdf"), "ayaan resume 2026");
    assert.equal(titleFromFilename(".pdf"), "Resume");
  });
  it("never puts the uploader's name in a key", () => {
    const key = storageKeyFor("user../x", "abc123".repeat(12), "pdf");
    assert.match(key, /^resumes\/userx\/[0-9a-f]{32}\.pdf$/);
  });
});

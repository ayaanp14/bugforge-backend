import { createHash } from "node:crypto";

/**
 * What an uploaded resume file must be before anything reads it.
 *
 * The browser's declared type and the file's extension are both claims the
 * uploader controls, so the format is decided from the first bytes: a PDF
 * starts with `%PDF-`, a DOCX is a zip (`PK\x03\x04`) that the extractor then
 * confirms holds `word/document.xml`. Anything else — including a `.pdf`
 * that is really an HTML page, or a zip that is not a Word document — is
 * refused with a message the person can act on.
 */

export type ResumeFormat = "pdf" | "docx";

export const RESUME_MIME: Record<ResumeFormat, string> = {
  pdf: "application/pdf",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
};

/** Upper bound on an upload. A text resume is tens of kilobytes; five megabytes covers one with a photo and embedded fonts. */
export const MAX_RESUME_BYTES = 5 * 1024 * 1024;
/** Below this a file cannot be a real document of either format. */
export const MIN_RESUME_BYTES = 256;

export class ResumeFileError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = "ResumeFileError";
  }
}

/** The format the bytes say they are, or null. */
export function sniffFormat(bytes: Uint8Array): ResumeFormat | null {
  if (bytes.length < 8) return null;
  if (bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46 && bytes[4] === 0x2d) return "pdf";
  if (bytes[0] === 0x50 && bytes[1] === 0x4b && bytes[2] === 0x03 && bytes[3] === 0x04) return "docx";
  return null;
}

/**
 * Checks size and format together, so the caller has one decision. The
 * declared type is compared to the sniffed one only to word the refusal —
 * the bytes decide.
 */
export function validateResumeUpload(bytes: Uint8Array, declaredType: string | null | undefined): ResumeFormat {
  if (bytes.length > MAX_RESUME_BYTES) {
    throw new ResumeFileError(413, `That file is ${(bytes.length / 1024 / 1024).toFixed(1)} MB; resumes are limited to ${MAX_RESUME_BYTES / 1024 / 1024} MB.`);
  }
  if (bytes.length < MIN_RESUME_BYTES) {
    throw new ResumeFileError(400, "That file is empty or too small to be a resume.");
  }
  const format = sniffFormat(bytes);
  if (!format) {
    const declared = (declaredType ?? "").split(";")[0].trim().toLowerCase();
    const looksLikeWord = declared === "application/msword";
    throw new ResumeFileError(
      415,
      looksLikeWord
        ? "Older .doc files are not supported. Save the resume as .docx or export it to PDF and upload that."
        : "Only PDF and DOCX resumes are supported. The file does not look like either.",
    );
  }
  return format;
}

/**
 * A filename safe to store and echo back: the base name only (no path
 * components from any OS), printable characters, a bounded length, and the
 * extension that matches the sniffed format rather than whatever was claimed.
 */
export function safeFilename(original: string | null | undefined, format: ResumeFormat): string {
  const base = (original ?? "")
    .split(/[\\/]/)
    .pop()!
    .replace(/[\x00-\x1f\x7f]/g, "")
    .replace(/[<>:"|?*]/g, "")
    .trim();
  const stem = base.replace(/\.[^.]*$/, "").trim().slice(0, 100) || "resume";
  return `${stem}.${format}`;
}

/** A title for the resume row, from the filename: "ayaan_resume_2026.pdf" → "ayaan resume 2026". */
export function titleFromFilename(filename: string): string {
  const stem = filename.replace(/\.[^.]*$/, "").replace(/[_-]+/g, " ").replace(/\s+/g, " ").trim();
  return (stem || "Resume").slice(0, 120);
}

export function sha256Hex(bytes: Uint8Array): string {
  return createHash("sha256").update(bytes).digest("hex");
}

/**
 * Where original files would go, if anywhere.
 *
 * The platform has no object store, the API host's disk is ephemeral, and
 * a resume is personal data that need not be kept twice: the extracted text
 * and the structured content are what every feature reads, and the export
 * routes regenerate a document from them. So the default store keeps
 * nothing and returns no key. A deployment with a bucket implements this
 * interface and swaps `resumeFileStore`; `Resume.storageKey` is the column
 * waiting for it.
 */
export interface ResumeFileStore {
  put(key: string, bytes: Uint8Array, mimeType: string): Promise<string | null>;
  remove(key: string): Promise<void>;
}

export const noopFileStore: ResumeFileStore = {
  async put() {
    return null;
  },
  async remove() {
    /* nothing was stored */
  },
};

export const resumeFileStore: ResumeFileStore = noopFileStore;

/** A storage key that cannot escape a prefix: the account, then a hash — never the uploader's name. */
export function storageKeyFor(userId: string, sha: string, format: ResumeFormat): string {
  return `resumes/${userId.replace(/[^A-Za-z0-9_-]/g, "")}/${sha.slice(0, 32)}.${format}`;
}

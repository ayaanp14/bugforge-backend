import { MAX_RESUME_BYTES } from "./resume-files.js";
import { MAX_JD_CHARS } from "./resume-requirements.js";

/**
 * The visitor's ATS check (POST /api/resumes/check): one request carrying a
 * file *and* the job it is checked against, with no account.
 *
 * The body is an envelope rather than multipart or JSON because both of
 * those collide with what is already mounted: the global JSON parser stops
 * at 512 KB ahead of every router (a base64 resume is up to 6.7 MB), and the
 * API has no multipart parser — adding one for a single route is a
 * dependency for four bytes of framing. So:
 *
 *   [4 bytes: big-endian length N of the meta][N bytes: UTF-8 JSON meta][the file]
 *
 * meta = { filename?, type?, role?, company?, jobDescription? }. The file's
 * own bytes still decide its format (lib/resume-files.ts); `type` is only
 * the browser's claim, passed through as the members' upload passes its
 * Content-Type.
 */
export const CHECK_CONTENT_TYPE = "application/vnd.codekairo.resume-check";

/** The meta is a few short fields and a job description; anything bigger is not one. */
export const MAX_CHECK_META_BYTES = MAX_JD_CHARS * 4 + 4096;

export interface CheckMeta {
  filename: string | null;
  type: string | null;
  role: string;
  company: string;
  jobDescription: string;
}

export class CheckEnvelopeError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = "CheckEnvelopeError";
  }
}

const field = (v: unknown, max: number): string => (typeof v === "string" ? v.trim().slice(0, max) : "");

/** Splits an envelope into its meta and the file's bytes; refuses anything malformed with a sentence. */
export function readCheckEnvelope(body: Uint8Array): { meta: CheckMeta; file: Uint8Array } {
  if (body.length < 4) throw new CheckEnvelopeError(400, "Send the resume file with the check.");
  const n = ((body[0]! << 24) | (body[1]! << 16) | (body[2]! << 8) | body[3]!) >>> 0;
  if (n > MAX_CHECK_META_BYTES || 4 + n > body.length) throw new CheckEnvelopeError(400, "The check could not be read. Reload the page and try again.");
  let raw: unknown;
  try {
    raw = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(body.subarray(4, 4 + n)));
  } catch {
    throw new CheckEnvelopeError(400, "The check could not be read. Reload the page and try again.");
  }
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) throw new CheckEnvelopeError(400, "The check could not be read. Reload the page and try again.");
  const m = raw as Record<string, unknown>;
  const jobDescription = typeof m["jobDescription"] === "string" ? m["jobDescription"].trim() : "";
  if (jobDescription.length > MAX_JD_CHARS) {
    throw new CheckEnvelopeError(400, `The job description is limited to ${MAX_JD_CHARS.toLocaleString()} characters.`);
  }
  const file = body.subarray(4 + n);
  if (file.length === 0) throw new CheckEnvelopeError(400, "Choose a PDF or DOCX resume to check.");
  if (file.length > MAX_RESUME_BYTES) {
    throw new CheckEnvelopeError(413, `That file is ${(file.length / 1024 / 1024).toFixed(1)} MB; resumes are limited to ${MAX_RESUME_BYTES / 1024 / 1024} MB.`);
  }
  return {
    meta: {
      filename: field(m["filename"], 200) || null,
      type: field(m["type"], 200) || null,
      role: field(m["role"], 120),
      company: field(m["company"], 120),
      jobDescription,
    },
    file,
  };
}

/** The client's side of the same framing — exported so the test builds envelopes exactly as the SPA does. */
export function buildCheckEnvelope(meta: Partial<CheckMeta>, file: Uint8Array): Uint8Array {
  const json = new TextEncoder().encode(JSON.stringify(meta));
  const out = new Uint8Array(4 + json.length + file.length);
  new DataView(out.buffer).setUint32(0, json.length);
  out.set(json, 4);
  out.set(file, 4 + json.length);
  return out;
}

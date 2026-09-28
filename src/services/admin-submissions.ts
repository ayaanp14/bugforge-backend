import { prisma } from "../lib/prisma.js";

/**
 * One submission in full, for the admin panel's code view: what the person
 * actually sent. Admin-only (routes/admin.ts); the owner's own view of the
 * same rows is GET /api/me/submissions/:id.
 *
 * A problem submission is one file of code. A bug hunt submission stores only
 * the files the workspace sent (`editedFiles`, path → content), so each is
 * paired with the hunt's original here — the admin wants to see the fix, and
 * a diff is the fix.
 */

const WHO = { select: { id: true, username: true, name: true } } as const;

export async function problemSubmissionDetail(id: string) {
  const row = await prisma.submission.findUnique({
    where: { id },
    select: {
      id: true,
      verdict: true,
      language: true,
      code: true,
      runtimeMs: true,
      memoryKb: true,
      passedCases: true,
      totalCases: true,
      submittedAt: true,
      user: WHO,
      problem: { select: { slug: true, title: true, difficulty: true } },
    },
  });
  return row && { kind: "problem" as const, ...row };
}

export async function bugSubmissionDetail(id: string) {
  const row = await prisma.bugSubmission.findUnique({
    where: { id },
    select: {
      id: true,
      verdict: true,
      passedTests: true,
      totalTests: true,
      timeTakenSecs: true,
      submittedAt: true,
      editedFiles: true,
      user: WHO,
      challenge: {
        select: {
          id: true,
          slug: true,
          title: true,
          difficulty: true,
          language: true,
          files: { select: { filePath: true, content: true, language: true } },
        },
      },
    },
  });
  if (!row) return null;
  const { editedFiles, challenge, ...rest } = row;
  const { files, ...hunt } = challenge;
  return { kind: "bug" as const, ...rest, challenge: hunt, files: pairEditedFiles(editedFiles, files) };
}

export interface PairedFile {
  path: string;
  /** The hunt file's own language, when the path is one of the hunt's files. */
  language: string | null;
  /** The shipped content, or null for a file the hunt does not have. */
  original: string | null;
  submitted: string;
  changed: boolean;
}

/**
 * Each submitted file beside the hunt's original, changed files first, then
 * in the hunt's own file order (new files last, by path). `editedFiles` is
 * JSON written by the workspace; anything that is not a path → string map
 * contributes nothing rather than throwing on an old or odd row.
 */
export function pairEditedFiles(
  editedFiles: unknown,
  originals: Array<{ filePath: string; content: string; language: string }>,
): PairedFile[] {
  if (!editedFiles || typeof editedFiles !== "object" || Array.isArray(editedFiles)) return [];
  const order = new Map(originals.map((f, i) => [f.filePath, i]));
  const byPath = new Map(originals.map((f) => [f.filePath, f]));
  const out: PairedFile[] = [];
  for (const [path, submitted] of Object.entries(editedFiles as Record<string, unknown>)) {
    if (typeof submitted !== "string") continue;
    const original = byPath.get(path);
    out.push({
      path,
      language: original?.language ?? null,
      original: original?.content ?? null,
      submitted,
      changed: original?.content !== submitted,
    });
  }
  const rank = (f: PairedFile) => order.get(f.path) ?? Number.MAX_SAFE_INTEGER;
  return out.sort((a, b) => Number(b.changed) - Number(a.changed) || rank(a) - rank(b) || a.path.localeCompare(b.path));
}

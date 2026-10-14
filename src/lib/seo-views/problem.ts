/**
 * The problem workbench's first screen as data: what ProblemDescription and
 * the editor show a visitor, in their order — the number beside the h1, the
 * difficulty, every tag (linked when it has a hub, as ProblemDescription
 * links it), the lead, the statement (its `###` labels as h2, as the page
 * renders them), and the JavaScript starter the editor opens with. Built in
 * services/seo.ts problemHead from what it has loaded; drawn by frontend
 * lib/seo/views/api/problem.ts. The registry and the reasons: index.ts.
 *
 * `markdown` and `signature` (2026-10-14) are what the example figures are
 * sized from: React's first frame holds each example card's figure as an
 * empty box at the svg's size (DiagramSvg's placeholder), and that size only
 * comes from running the frontend's builders on the same inputs the page
 * gives them — the statement's markdown, the tags, the typed signature
 * (ProblemDescription's DiagramContext). Without the box every card row sat
 * 190–255 px high and moved at the swap.
 */
export interface ProblemView {
  kind: "problem";
  number: number | null;
  title: string;
  difficulty: string;
  tags: Array<{ label: string; href: string | null }>;
  intro: string;
  statement: string;
  starter: string | null;
  /** The statement's raw markdown (the diagrams' `facts.statement`). */
  markdown: string;
  /** The judge's typed signature, as the problem payload carries it, or null. */
  signature: ProblemViewSignature | null;
}

export interface ProblemViewSignature {
  funcName: string;
  params: Array<{ name: string; type: string }>;
  returns: string;
}

/**
 * The stored `Problem.signature` Json as the problem payload hands it to the
 * page (routes/problems.ts selects the column as is), or null when it is not
 * one — passed through untouched, since the figures' shape reading treats a
 * missing field and an empty one differently.
 */
export function problemViewSignature(raw: unknown): ProblemViewSignature | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const o = raw as Record<string, unknown>;
  return typeof o["funcName"] === "string" && Array.isArray(o["params"]) ? (o as unknown as ProblemViewSignature) : null;
}

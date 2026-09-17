import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import JSZip from "jszip";
import { ResumeFileError, type ResumeFormat } from "./resume-files.js";

/**
 * Text out of a resume file, plus what the file's layout says about it.
 *
 * Kept apart from the analysis: this module knows about bytes, pages and
 * XML; nothing downstream knows anything but text and the `LayoutSignals`
 * record. The signals are what an ATS parser would trip on — columns,
 * tables, text boxes, images, contact details in a page header — and they
 * can only be read from the original file, so they are captured here once
 * and stored beside the text.
 *
 * PDF: pdf.js gives every text run with its position. Lines are rebuilt by
 * grouping runs on the same baseline and ordering by x; a page whose runs
 * fall into two vertical bands is read one column at a time, because reading
 * it by baseline interleaves the columns into nonsense ("Skills  Software
 * Engineer at …"). DOCX: the document XML is walked paragraph by paragraph
 * with a small tokenizer — the structure needed (tables, numbering, text
 * boxes, section columns, drawings) is a handful of element names, and a
 * whole XML library for that is more surface than it is worth.
 */

export interface LayoutSignals {
  format: ResumeFormat;
  pages: number | null;
  /** The extractor saw text arranged in two vertical bands on at least one page. */
  multiColumn: boolean;
  /** DOCX tables, or PDF text that reads as a grid. */
  tables: number;
  /** DOCX text boxes (`w:txbxContent`). */
  textBoxes: number;
  /** Embedded images or drawings. */
  images: number;
  /** Contact details (an email or a phone) live in a page header or footer. */
  headerContact: boolean;
  /** Lines repeated at the same place on several PDF pages (running header/footer). */
  repeatedHeaderFooter: boolean;
  /** Characters of extracted text, before normalisation. */
  chars: number;
  /** Non-ASCII decorative symbols (icons standing in for words). */
  decorativeSymbols: number;
  /** Paragraphs the DOCX styles as headings, as text — a hint for the parser. */
  headingHints: string[];
}

export interface ExtractedResume {
  text: string;
  layout: LayoutSignals;
}

/* ── normalisation ─────────────────────────────────────────────────────── */

/** The bullet glyphs resumes use, all folded to one. */
const BULLET_GLYPHS = /^[\s]*[•·●○◦▪▫■□➢➤►▶✓✔➔→◆◇★☆♦\-–—*»>]+\s+/;

const LIGATURES: Array<[RegExp, string]> = [
  [/ﬁ/g, "fi"],
  [/ﬂ/g, "fl"],
  [/ﬀ/g, "ff"],
  [/ﬃ/g, "ffi"],
  [/ﬄ/g, "ffl"],
];

/**
 * One text shape for both formats: bullets normalised to "• ", odd spaces
 * to plain ones, ligatures expanded, at most one blank line in a row, no
 * trailing whitespace. The bullet marker is kept (not stripped) because the
 * parser reads it as structure.
 */
export function normalizeText(raw: string): string {
  let text = raw.replace(/\r\n?/g, "\n").replace(/[\t\f\v]/g, " ");
  text = text.replace(/[\u00a0\u2000-\u200b\u202f\u205f\u3000]/g, " ");
  for (const [re, to] of LIGATURES) text = text.replace(re, to);
  const lines = text.split("\n").map((line) => {
    // A run of three or more spaces is a column gap the PDF reader put
    // there on purpose (a date at the right margin); it survives as exactly
    // three so the parser can split on it. Everything else is one space.
    let l = line.replace(/ {3,}/g, "\x01").replace(/\s+/g, " ").replace(/\x01/g, "   ").trim();
    if (BULLET_GLYPHS.test(l)) l = "• " + l.replace(BULLET_GLYPHS, "");
    return l;
  });
  const out: string[] = [];
  for (const line of lines) {
    if (line === "" && out[out.length - 1] === "") continue;
    out.push(line);
  }
  return out.join("\n").trim();
}

/** Symbols that are decoration rather than text — an icon font's glyphs, dingbats, box drawing. */
const DECORATIVE = /[\u2300-\u23ff\u2500-\u27bf\u2b00-\u2bff\ue000-\uf8ff]/g;

function countDecorative(text: string): number {
  // The bullets themselves are expected; only what is left after folding them counts.
  const folded = text.replace(/^• /gm, "");
  return (folded.match(DECORATIVE) ?? []).length;
}

const CONTACT_IN_TEXT = /[\w.+-]+@[\w-]+\.[\w.]+|(?:\+?\d[\d\s().-]{8,}\d)/;

/**
 * More text than any resume holds. A five-megabyte file can decompress to
 * far more than that (a PDF's content streams, a zip's XML), so extraction
 * stops here rather than trusting the file's size.
 */
const MAX_TEXT_CHARS = 300_000;
/** The largest document.xml a DOCX may unpack to before it is refused unread. */
const MAX_DOCX_XML_BYTES = 25 * 1024 * 1024;

/* ── PDF ───────────────────────────────────────────────────────────────── */

interface Run {
  x: number;
  y: number;
  w: number;
  h: number;
  text: string;
}

/**
 * pdf.js's Node build wants to know where the fourteen standard fonts are
 * (a resume set in Helvetica/Times has no embedded font program), and it
 * logs a warning per document without it.
 */
const require = createRequire(import.meta.url);
const PDFJS_DIR = dirname(require.resolve("pdfjs-dist/package.json"));
const STANDARD_FONTS = join(PDFJS_DIR, "standard_fonts") + "/";

type PdfJs = typeof import("pdfjs-dist/legacy/build/pdf.mjs");
let pdfjsPromise: Promise<PdfJs> | null = null;

/** Loaded on first use: it is a large module, and most requests never touch it. */
function loadPdfJs(): Promise<PdfJs> {
  if (!pdfjsPromise) {
    pdfjsPromise = import("pdfjs-dist/legacy/build/pdf.mjs");
  }
  return pdfjsPromise;
}

/** Runs on the same baseline, merged into lines; a wide gap between runs becomes a space, never lost. */
function linesFromRuns(runs: Run[]): Array<{ y: number; text: string; segments: Run[] }> {
  const sorted = [...runs].sort((a, b) => b.y - a.y || a.x - b.x);
  const lines: Array<{ y: number; segments: Run[] }> = [];
  for (const run of sorted) {
    const last = lines[lines.length - 1];
    // Baselines within half a line height are the same line (superscripts, slightly raised runs).
    if (last && Math.abs(last.y - run.y) <= Math.max(2, run.h * 0.5)) last.segments.push(run);
    else lines.push({ y: run.y, segments: [run] });
  }
  return lines.map((line) => {
    const segs = line.segments.sort((a, b) => a.x - b.x);
    let text = "";
    let cursor: number | null = null;
    for (const seg of segs) {
      // A whitespace-only run is the gap itself (pdfkit and Word both emit
      // one, stretched to fill the space before a right-aligned date); its
      // width must not hide the gap from the next real run.
      if (!seg.text.trim()) continue;
      if (cursor !== null) {
        const gap = seg.x - cursor;
        // A gap wider than a couple of characters is a real break — a date
        // pushed to the right margin, a second column — and reads as more
        // than one space so the parser can see it.
        if (gap > Math.max(6, seg.h * 1.5)) text += "   ";
        else if (gap > 1 && !text.endsWith(" ") && !seg.text.startsWith(" ")) text += " ";
      }
      text += seg.text;
      cursor = seg.x + seg.w;
    }
    return { y: line.y, text, segments: segs };
  });
}

/**
 * Does the page read as two columns? A column is a run of lines that start
 * at one consistent x well to the right of the left margin, with text to
 * their left on the same baselines. Right-aligned dates fail this test —
 * they end at one x but start wherever their width puts them — which is
 * what separates a sidebar layout from an ordinary "role … date" line.
 * Returns the x where the right column starts, or null.
 */
function detectColumns(runs: Run[], pageWidth: number): number | null {
  const lines = linesFromRuns(runs);
  if (lines.length < 8) return null;
  const starts = new Map<number, number>();
  let split = 0;
  for (const line of lines) {
    const segs = line.segments;
    if (segs.length < 2) continue;
    // The first segment that begins past the page's first third with a real gap before it.
    for (let i = 1; i < segs.length; i++) {
      const gap = segs[i].x - (segs[i - 1].x + segs[i - 1].w);
      if (segs[i].x > pageWidth * 0.33 && segs[i].x < pageWidth * 0.75 && gap > 12) {
        const key = Math.round(segs[i].x / 6) * 6;
        starts.set(key, (starts.get(key) ?? 0) + 1);
        split += 1;
        break;
      }
    }
  }
  if (split < Math.max(6, lines.length * 0.3)) return null;
  let bestX = 0;
  let bestN = 0;
  for (const [x, n] of starts) if (n > bestN) [bestX, bestN] = [x, n];
  // Column text lines up; dates and right-aligned fragments scatter.
  return bestN >= split * 0.6 ? bestX - 3 : null;
}

function isNearEdge(y: number, pageHeight: number): boolean {
  return y > pageHeight * 0.92 || y < pageHeight * 0.08;
}

export async function extractPdf(bytes: Uint8Array): Promise<ExtractedResume> {
  const pdfjs = await loadPdfJs();
  // pdf.js insists on a plain Uint8Array; a Node Buffer (a subclass) is refused by name.
  const data = bytes.constructor === Uint8Array ? bytes : new Uint8Array(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const task = pdfjs.getDocument({
    data,
    standardFontDataUrl: STANDARD_FONTS,
    useSystemFonts: false,
    disableFontFace: true,
    // Recoverable font problems are noise here; errors still throw.
    verbosity: pdfjs.VerbosityLevel.ERRORS,
  });
  let pageTexts: string[] = [];
  let multiColumn = false;
  let images = 0;
  const edgeLines = new Map<string, number>();
  let pages = 0;
  try {
    const pdf = await task.promise;
    pages = pdf.numPages;
    if (pages > 15) throw new ResumeFileError(400, `That PDF has ${pages} pages. A resume is at most a few pages; upload the resume itself.`);
    for (let n = 1; n <= pages; n++) {
      const page = await pdf.getPage(n);
      const { width, height } = page.getViewport({ scale: 1 });
      const content = await page.getTextContent();
      const runs: Run[] = [];
      for (const item of content.items) {
        if (!("str" in item) || !item.str) continue;
        runs.push({ x: item.transform[4], y: item.transform[5], w: item.width, h: item.height || 10, text: item.str });
      }
      try {
        const ops = await page.getOperatorList();
        for (const fn of ops.fnArray) if (fn === pdfjs.OPS.paintImageXObject || fn === pdfjs.OPS.paintInlineImageXObject) images += 1;
      } catch {
        /* an unreadable content stream is not a reason to refuse the text */
      }

      const boundary = detectColumns(runs, width);
      let lines: Array<{ y: number; text: string }>;
      if (boundary !== null) {
        multiColumn = true;
        const left = runs.filter((r) => r.x < boundary);
        const right = runs.filter((r) => r.x >= boundary);
        lines = [...linesFromRuns(left), ...linesFromRuns(right)];
      } else {
        lines = linesFromRuns(runs);
      }
      for (const line of lines) {
        if (isNearEdge(line.y, height) && line.text.trim().length > 3) {
          const key = line.text.trim().toLowerCase();
          edgeLines.set(key, (edgeLines.get(key) ?? 0) + 1);
        }
      }
      pageTexts.push(lines.map((l) => l.text).join("\n"));
      if (pageTexts.reduce((n, t) => n + t.length, 0) > MAX_TEXT_CHARS) break;
    }
  } catch (err) {
    if (err instanceof ResumeFileError) throw err;
    const message = (err as Error)?.message ?? "";
    if (/password|encrypted/i.test(message)) throw new ResumeFileError(400, "That PDF is password-protected. Remove the password and upload it again.");
    throw new ResumeFileError(400, "That PDF could not be read. It may be corrupted — try exporting it again from the editor it was made in.");
  } finally {
    await task.destroy().catch(() => undefined);
  }

  // A line that sits at the page edge on more than one page is a running
  // header or footer; keep the first, drop the rest.
  const repeated = new Set([...edgeLines].filter(([, n]) => n >= 2 && pages >= 2).map(([k]) => k));
  if (repeated.size) {
    const seen = new Set<string>();
    pageTexts = pageTexts.map((page) =>
      page
        .split("\n")
        .filter((line) => {
          const key = line.trim().toLowerCase();
          if (!repeated.has(key)) return true;
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        })
        .join("\n"),
    );
  }

  const raw = pageTexts.join("\n\n");
  const text = normalizeText(raw);
  if (text.replace(/\s/g, "").length < 120) {
    throw new ResumeFileError(
      422,
      images > 0
        ? "That PDF has no readable text — it looks like a scanned image. Export the resume as a text PDF (or upload the DOCX) so it can be read."
        : "That PDF has no readable text. Export the resume again as a text PDF, or upload the DOCX.",
    );
  }
  return {
    text,
    layout: {
      format: "pdf",
      pages,
      multiColumn,
      tables: 0,
      textBoxes: 0,
      images,
      headerContact: false,
      repeatedHeaderFooter: repeated.size > 0,
      chars: raw.length,
      decorativeSymbols: countDecorative(text),
      headingHints: [],
    },
  };
}

/* ── DOCX ──────────────────────────────────────────────────────────────── */

const ENTITIES: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'" };

function decodeXml(text: string): string {
  return text.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, code: string) => {
    if (code[0] === "#") {
      const n = code[1].toLowerCase() === "x" ? parseInt(code.slice(2), 16) : parseInt(code.slice(1), 10);
      return Number.isFinite(n) ? String.fromCodePoint(n) : m;
    }
    return ENTITIES[code.toLowerCase()] ?? m;
  });
}

interface DocxWalk {
  paragraphs: string[];
  tables: number;
  textBoxes: number;
  images: number;
  columns: boolean;
  headings: string[];
}

/**
 * Walks WordprocessingML with a tag tokenizer. A paragraph is the text of
 * its `w:t` runs, with tabs and breaks kept; a numbered paragraph gets a
 * bullet so the parser sees it as one. Table cells contribute their
 * paragraphs in document order.
 */
function walkDocumentXml(xml: string): DocxWalk {
  const out: DocxWalk = { paragraphs: [], tables: 0, textBoxes: 0, images: 0, columns: false, headings: [] };
  const tag = /<(\/?)([\w:]+)([^>]*?)(\/?)>|([^<]+)/g;
  let current: string[] | null = null;
  let inText = false;
  let numbered = false;
  let heading = false;
  let tableDepth = 0;
  // A DrawingML text box is a <w:drawing> around <w:txbxContent>: counted as
  // a box, not as the picture the drawing element would otherwise suggest.
  let inDrawing = false;
  let drawingIsBox = false;
  let m: RegExpExecArray | null;
  while ((m = tag.exec(xml))) {
    if (m[5] !== undefined) {
      // Word writes a tab as <w:tab/>; other writers put a literal tab in the run. Both are the gap.
      if (inText && current) current.push(decodeXml(m[5]).replace(/\t/g, "   "));
      continue;
    }
    const closing = m[1] === "/";
    const name = m[2];
    const attrs = m[3] ?? "";
    const selfClosing = m[4] === "/";
    switch (name) {
      case "w:p":
        if (closing) {
          if (current) {
            const text = current.join("").replace(/ {3,}/g, "\x01").replace(/[ \t]+/g, " ").replace(/\x01/g, "   ").trim();
            if (text) {
              out.paragraphs.push(numbered ? `• ${text}` : text);
              if (heading) out.headings.push(text);
            }
          }
          current = null;
          numbered = false;
          heading = false;
        } else if (!selfClosing) {
          current = [];
        }
        break;
      case "w:t":
        inText = !closing && !selfClosing;
        break;
      case "w:tab":
        // A tab is the same gap a PDF shows before a right-aligned date;
        // three spaces is how the parser reads one.
        if (current && !closing) current.push("   ");
        break;
      case "w:br":
      case "w:cr":
        if (current && !closing) current.push("\n");
        break;
      case "w:numPr":
        if (!closing) numbered = true;
        break;
      case "w:pStyle":
        if (/w:val="(?:Heading|Title|heading|Subtitle)/.test(attrs)) heading = true;
        break;
      case "w:tbl":
        if (closing) tableDepth -= 1;
        else if (!selfClosing) {
          tableDepth += 1;
          if (tableDepth === 1) out.tables += 1;
        }
        break;
      case "w:txbxContent":
        if (!closing && !selfClosing) {
          out.textBoxes += 1;
          if (inDrawing && !drawingIsBox) {
            drawingIsBox = true;
            out.images -= 1;
          }
        }
        break;
      case "w:drawing":
        if (closing) {
          inDrawing = false;
          drawingIsBox = false;
        } else if (!selfClosing) {
          inDrawing = true;
          drawingIsBox = false;
          out.images += 1;
        }
        break;
      case "v:imagedata":
        // A legacy (VML) picture; a VML text box has no image data.
        if (!closing) out.images += 1;
        break;
      case "w:cols":
        if (/w:num="([2-9]|\d{2,})"/.test(attrs)) out.columns = true;
        break;
      default:
        break;
    }
  }
  return out;
}

export async function extractDocx(bytes: Uint8Array): Promise<ExtractedResume> {
  let zip: JSZip;
  try {
    zip = await JSZip.loadAsync(bytes);
  } catch {
    throw new ResumeFileError(400, "That file could not be opened. It may be corrupted — save it again from Word and retry.");
  }
  const document = zip.file("word/document.xml");
  if (!document) {
    throw new ResumeFileError(415, "That file is a zip archive but not a Word document. Upload a .docx or a PDF.");
  }
  // JSZip knows the unpacked size from the central directory; a zip bomb is
  // refused before a byte of it is inflated.
  const unpacked = (document as unknown as { _data?: { uncompressedSize?: number } })._data?.uncompressedSize;
  if (typeof unpacked === "number" && unpacked > MAX_DOCX_XML_BYTES) {
    throw new ResumeFileError(413, "That document is far larger inside than a resume should be. Save a copy with the images removed and upload that.");
  }
  const xml = await document.async("string");
  const walked = walkDocumentXml(xml.length > MAX_DOCX_XML_BYTES ? xml.slice(0, MAX_DOCX_XML_BYTES) : xml);
  if (walked.paragraphs.reduce((n, p) => n + p.length, 0) > MAX_TEXT_CHARS) {
    let total = 0;
    walked.paragraphs = walked.paragraphs.filter((p) => (total += p.length) <= MAX_TEXT_CHARS);
  }

  // Headers and footers: text an ATS often skips. Included at the top so a
  // name or email placed there still parses, and flagged as a risk.
  const headerFooterFiles = Object.keys(zip.files).filter((name) => /^word\/(header|footer)\d*\.xml$/.test(name));
  const edgeParagraphs: string[] = [];
  for (const name of headerFooterFiles) {
    const content = await zip.file(name)!.async("string");
    edgeParagraphs.push(...walkDocumentXml(content).paragraphs);
  }
  const headerContact = edgeParagraphs.some((p) => CONTACT_IN_TEXT.test(p));
  const bodyHasContact = walked.paragraphs.slice(0, 15).some((p) => CONTACT_IN_TEXT.test(p));
  const paragraphs = headerContact && !bodyHasContact ? [...edgeParagraphs, ...walked.paragraphs] : walked.paragraphs;

  const raw = paragraphs.join("\n");
  const text = normalizeText(raw);
  if (text.replace(/\s/g, "").length < 120) {
    throw new ResumeFileError(422, "That document has almost no text. If the resume is an image inside the document, export it as a text PDF instead.");
  }
  const mediaCount = Object.keys(zip.files).filter((name) => /^word\/media\//.test(name)).length;
  return {
    text,
    layout: {
      format: "docx",
      pages: null,
      multiColumn: walked.columns,
      tables: walked.tables,
      textBoxes: walked.textBoxes,
      images: Math.max(walked.images, mediaCount),
      headerContact,
      repeatedHeaderFooter: false,
      chars: raw.length,
      decorativeSymbols: countDecorative(text),
      headingHints: walked.headings.slice(0, 40),
    },
  };
}

/** The one entry point: bytes already sniffed as `format` → text and signals. */
export function extractResume(bytes: Uint8Array, format: ResumeFormat): Promise<ExtractedResume> {
  return format === "pdf" ? extractPdf(bytes) : extractDocx(bytes);
}

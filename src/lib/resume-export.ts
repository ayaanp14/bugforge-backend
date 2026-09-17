import PDFDocument from "pdfkit";
import { AlignmentType, BorderStyle, Document, HeadingLevel, LevelFormat, Packer, Paragraph, TabStopPosition, TabStopType, TextRun } from "docx";
import type { ResumeContent } from "./resume-parse.js";

/**
 * A resume as a document: the "ATS Classic" template in PDF and DOCX.
 *
 * One column, standard section titles, plain bullets, dates on the right of
 * the line they belong to, no tables, no text boxes, no graphics — the
 * layout every parser reads cleanly, which is the point of a resume that
 * has just been optimised for one. The PDF is drawn with pdfkit's built-in
 * Helvetica (no font files to ship; Latin script only) and the DOCX with
 * the `docx` package; both are real files, not HTML saved with a different
 * extension.
 *
 * The two renderers walk the same section order and print the same text,
 * so what the preview shows is what either export contains.
 */

const SECTION_TITLES: Record<string, string> = {
  summary: "Summary",
  experience: "Experience",
  education: "Education",
  skills: "Skills",
  projects: "Projects",
  certifications: "Certifications",
  achievements: "Achievements",
};

/** The document's ordered sections, as (title, kind, data) — shared by both renderers. */
function sectionsOf(content: ResumeContent): Array<{ key: string; title: string }> {
  const out: Array<{ key: string; title: string }> = [];
  for (const key of content.sectionOrder) {
    if (key.startsWith("custom:")) {
      const c = content.customSections.find((s) => `custom:${s.id}` === key);
      if (c && c.bullets.length) out.push({ key, title: c.title || "Additional" });
      continue;
    }
    const has =
      (key === "summary" && content.summary.trim()) ||
      (key === "experience" && content.experience.length) ||
      (key === "education" && content.education.length) ||
      (key === "skills" && content.skills.some((g) => g.items.length)) ||
      (key === "projects" && content.projects.length) ||
      (key === "certifications" && content.certifications.length) ||
      (key === "achievements" && content.achievements.length);
    if (has) out.push({ key, title: SECTION_TITLES[key] ?? key });
  }
  return out;
}

export function dateSpan(start: string, end: string, current = false): string {
  const to = current ? "Present" : end;
  if (start && to) return `${start} – ${to}`;
  return start || to || "";
}

const contactLine = (c: ResumeContent) => [c.basics.email, c.basics.phone, c.basics.location, ...c.basics.links].filter(Boolean).join("  |  ");

/** A safe file stem from the candidate's name, for Content-Disposition. */
export function exportFilename(content: ResumeContent, format: "pdf" | "docx"): string {
  const stem = (content.basics.name || "resume")
    .replace(/[^A-Za-z0-9 _-]/g, "")
    .trim()
    .replace(/\s+/g, "_")
    .slice(0, 60);
  return `${stem || "resume"}_resume.${format}`;
}

/* ── PDF ───────────────────────────────────────────────────────────────── */

const PAGE = { size: "A4" as const, margin: 48 };
const FONT = { body: "Helvetica", bold: "Helvetica-Bold", italic: "Helvetica-Oblique" };
const SIZE = { name: 19, title: 11, body: 9.5, heading: 10.5, contact: 9 };
const INK = "#111111";
const MUTED = "#444444";
const RULE = "#999999";

export function renderPdf(content: ResumeContent): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: PAGE.size, margin: PAGE.margin, info: { Title: `${content.basics.name || "Resume"} — Resume`, Author: content.basics.name || "" } });
    const chunks: Buffer[] = [];
    doc.on("data", (c: Buffer) => chunks.push(c));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const left = PAGE.margin;
    const width = doc.page.width - PAGE.margin * 2;
    const bottom = () => doc.page.height - PAGE.margin;

    const ensure = (height: number) => {
      if (doc.y + height > bottom()) doc.addPage();
    };

    const heading = (title: string) => {
      ensure(30);
      doc.moveDown(0.6);
      doc.font(FONT.bold).fontSize(SIZE.heading).fillColor(INK).text(title.toUpperCase(), left, doc.y, { width, characterSpacing: 0.6 });
      const y = doc.y + 2;
      doc.moveTo(left, y).lineTo(left + width, y).lineWidth(0.6).strokeColor(RULE).stroke();
      doc.y = y + 5;
    };

    /** A line with text on the left and, optionally, a date on the right, on one baseline. */
    const row = (leftText: string, rightText: string, opts: { bold?: boolean; italic?: boolean; size?: number; color?: string } = {}) => {
      const size = opts.size ?? SIZE.body;
      const font = opts.bold ? FONT.bold : opts.italic ? FONT.italic : FONT.body;
      const rightWidth = rightText ? Math.min(width * 0.35, doc.font(FONT.body).fontSize(size).widthOfString(rightText) + 4) : 0;
      const leftWidth = width - rightWidth - (rightText ? 8 : 0);
      doc.font(font).fontSize(size).fillColor(opts.color ?? INK);
      const h = Math.max(doc.heightOfString(leftText || " ", { width: leftWidth }), rightText ? doc.font(FONT.body).fontSize(size).heightOfString(rightText, { width: rightWidth }) : 0);
      ensure(h + 2);
      const y = doc.y;
      doc.font(font).fontSize(size).fillColor(opts.color ?? INK).text(leftText || " ", left, y, { width: leftWidth });
      if (rightText) doc.font(FONT.body).fontSize(size).fillColor(MUTED).text(rightText, left + width - rightWidth, y, { width: rightWidth, align: "right" });
      doc.y = y + h + 1.5;
    };

    const bullet = (text: string) => {
      const indent = 12;
      doc.font(FONT.body).fontSize(SIZE.body).fillColor(INK);
      const h = doc.heightOfString(text, { width: width - indent });
      ensure(h + 2);
      const y = doc.y;
      doc.text("•", left + 2, y, { width: indent, lineBreak: false });
      doc.text(text, left + indent, y, { width: width - indent });
      doc.y = y + h + 1.5;
    };

    const paragraph = (text: string) => {
      doc.font(FONT.body).fontSize(SIZE.body).fillColor(INK);
      const h = doc.heightOfString(text, { width });
      ensure(Math.min(h, 40));
      doc.text(text, left, doc.y, { width, lineGap: 1 });
      doc.y += 2;
    };

    // Header.
    doc.font(FONT.bold).fontSize(SIZE.name).fillColor(INK).text(content.basics.name || "Resume", left, doc.y, { width });
    if (content.basics.title) doc.font(FONT.body).fontSize(SIZE.title).fillColor(MUTED).text(content.basics.title, left, doc.y + 1, { width });
    const contact = contactLine(content);
    if (contact) doc.font(FONT.body).fontSize(SIZE.contact).fillColor(MUTED).text(contact, left, doc.y + 2, { width });

    for (const section of sectionsOf(content)) {
      heading(section.title);
      switch (section.key) {
        case "summary":
          paragraph(content.summary.trim());
          break;
        case "experience":
          content.experience.forEach((e, i) => {
            if (i > 0) doc.moveDown(0.35);
            row([e.position, e.company].filter(Boolean).join(" — "), dateSpan(e.startDate, e.endDate, e.current), { bold: true });
            if (e.location) row(e.location, "", { italic: true, color: MUTED });
            e.bullets.forEach(bullet);
          });
          break;
        case "education":
          content.education.forEach((e, i) => {
            if (i > 0) doc.moveDown(0.35);
            row([e.degree, e.field].filter(Boolean).join(" in ") || e.institution, dateSpan(e.startDate, e.endDate), { bold: true });
            const sub = [e.degree || e.field ? e.institution : "", e.grade].filter(Boolean).join("  ·  ");
            if (sub) row(sub, "", { color: MUTED });
            e.details.forEach(bullet);
          });
          break;
        case "skills":
          for (const g of content.skills) {
            if (!g.items.length) continue;
            const text = `${g.category ? `${g.category}: ` : ""}${g.items.join(", ")}`;
            doc.font(FONT.body).fontSize(SIZE.body).fillColor(INK);
            const h = doc.heightOfString(text, { width });
            ensure(h + 2);
            const y = doc.y;
            if (g.category) {
              doc.font(FONT.bold).text(`${g.category}: `, left, y, { width, continued: true });
              doc.font(FONT.body).text(g.items.join(", "));
            } else doc.text(text, left, y, { width });
            doc.y = y + h + 1.5;
          }
          break;
        case "projects":
          content.projects.forEach((p, i) => {
            if (i > 0) doc.moveDown(0.35);
            row([p.name, p.technologies.join(", ")].filter(Boolean).join("  |  "), dateSpan(p.startDate, p.endDate), { bold: true });
            if (p.link) row(p.link, "", { color: MUTED });
            p.bullets.forEach(bullet);
          });
          break;
        case "certifications":
          for (const c of content.certifications) row([c.name, c.issuer].filter(Boolean).join(" — "), c.date);
          break;
        case "achievements":
          content.achievements.forEach(bullet);
          break;
        default: {
          const c = content.customSections.find((s) => `custom:${s.id}` === section.key);
          c?.bullets.forEach(bullet);
        }
      }
    }
    doc.end();
  });
}

/* ── DOCX ──────────────────────────────────────────────────────────────── */

const DOCX_FONT = "Calibri";
/** Half-points. */
const PT = { name: 40, title: 22, body: 20, heading: 22, contact: 18 };
const BULLETS = "bullets";

function run(text: string, opts: { bold?: boolean; italics?: boolean; size?: number; color?: string } = {}): TextRun {
  return new TextRun({ text, bold: opts.bold, italics: opts.italics, size: opts.size ?? PT.body, color: opts.color, font: DOCX_FONT });
}

function headingParagraph(title: string): Paragraph {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 200, after: 60 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: "999999", space: 1 } },
    children: [run(title.toUpperCase(), { bold: true, size: PT.heading, color: "111111" })],
  });
}

/** Left text and, optionally, a right-aligned date on a tab stop at the margin. */
function rowParagraph(leftText: string, rightText: string, opts: { bold?: boolean; italics?: boolean; color?: string } = {}): Paragraph {
  const children = [run(leftText, { bold: opts.bold, italics: opts.italics, color: opts.color })];
  if (rightText) children.push(new TextRun({ text: `\t${rightText}`, size: PT.body, color: "444444", font: DOCX_FONT }));
  return new Paragraph({ children, tabStops: [{ type: TabStopType.RIGHT, position: TabStopPosition.MAX }], spacing: { after: 20 } });
}

function bulletParagraph(text: string): Paragraph {
  return new Paragraph({ children: [run(text)], numbering: { reference: BULLETS, level: 0 }, spacing: { after: 20 } });
}

export async function renderDocx(content: ResumeContent): Promise<Buffer> {
  const children: Paragraph[] = [];
  children.push(new Paragraph({ children: [run(content.basics.name || "Resume", { bold: true, size: PT.name })], spacing: { after: 20 } }));
  if (content.basics.title) children.push(new Paragraph({ children: [run(content.basics.title, { size: PT.title, color: "444444" })], spacing: { after: 20 } }));
  const contact = contactLine(content);
  if (contact) children.push(new Paragraph({ children: [run(contact, { size: PT.contact, color: "444444" })], spacing: { after: 80 } }));

  for (const section of sectionsOf(content)) {
    children.push(headingParagraph(section.title));
    switch (section.key) {
      case "summary":
        children.push(new Paragraph({ children: [run(content.summary.trim())], spacing: { after: 60 } }));
        break;
      case "experience":
        content.experience.forEach((e, i) => {
          if (i > 0) children.push(new Paragraph({ spacing: { after: 40 }, children: [] }));
          children.push(rowParagraph([e.position, e.company].filter(Boolean).join(" — "), dateSpan(e.startDate, e.endDate, e.current), { bold: true }));
          if (e.location) children.push(rowParagraph(e.location, "", { italics: true, color: "444444" }));
          e.bullets.forEach((b) => children.push(bulletParagraph(b)));
        });
        break;
      case "education":
        content.education.forEach((e, i) => {
          if (i > 0) children.push(new Paragraph({ spacing: { after: 40 }, children: [] }));
          children.push(rowParagraph([e.degree, e.field].filter(Boolean).join(" in ") || e.institution, dateSpan(e.startDate, e.endDate), { bold: true }));
          const sub = [e.degree || e.field ? e.institution : "", e.grade].filter(Boolean).join("  ·  ");
          if (sub) children.push(rowParagraph(sub, "", { color: "444444" }));
          e.details.forEach((b) => children.push(bulletParagraph(b)));
        });
        break;
      case "skills":
        for (const g of content.skills) {
          if (!g.items.length) continue;
          const parts = g.category ? [run(`${g.category}: `, { bold: true }), run(g.items.join(", "))] : [run(g.items.join(", "))];
          children.push(new Paragraph({ children: parts, spacing: { after: 20 } }));
        }
        break;
      case "projects":
        content.projects.forEach((p, i) => {
          if (i > 0) children.push(new Paragraph({ spacing: { after: 40 }, children: [] }));
          children.push(rowParagraph([p.name, p.technologies.join(", ")].filter(Boolean).join("  |  "), dateSpan(p.startDate, p.endDate), { bold: true }));
          if (p.link) children.push(rowParagraph(p.link, "", { color: "444444" }));
          p.bullets.forEach((b) => children.push(bulletParagraph(b)));
        });
        break;
      case "certifications":
        for (const c of content.certifications) children.push(rowParagraph([c.name, c.issuer].filter(Boolean).join(" — "), c.date));
        break;
      case "achievements":
        content.achievements.forEach((b) => children.push(bulletParagraph(b)));
        break;
      default: {
        const c = content.customSections.find((s) => `custom:${s.id}` === section.key);
        c?.bullets.forEach((b) => children.push(bulletParagraph(b)));
      }
    }
  }

  const doc = new Document({
    creator: "CodeKairo",
    title: `${content.basics.name || "Resume"} — Resume`,
    styles: {
      default: { document: { run: { font: DOCX_FONT, size: PT.body, color: "111111" } } },
      paragraphStyles: [{ id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true, run: { bold: true, size: PT.heading, color: "111111", font: DOCX_FONT } }],
    },
    numbering: {
      config: [{ reference: BULLETS, levels: [{ level: 0, format: LevelFormat.BULLET, text: "•", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 360, hanging: 240 } } } }] }],
    },
    sections: [{ properties: { page: { size: { width: 11906, height: 16838 }, margin: { top: 1000, right: 1000, bottom: 1000, left: 1000 } } }, children }],
  });
  return Packer.toBuffer(doc);
}

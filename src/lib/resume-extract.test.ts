import { describe, it } from "node:test";
import assert from "node:assert/strict";
import JSZip from "jszip";
import PDFDocument from "pdfkit";
import { extractDocx, extractPdf, extractResume, normalizeText } from "./resume-extract.js";
import { renderDocx, renderPdf } from "./resume-export.js";
import { ResumeFileError, sniffFormat } from "./resume-files.js";
import { parseResumeText } from "./resume-parse.js";
import { SAMPLE } from "./resume-parse.test.js";

/**
 * Text and layout signals out of real files. The files are made here — by
 * the export renderers (a round trip: parse → render → extract → parse
 * again must agree) and by hand for the layouts the ATS check looks for
 * (a two-column PDF, a DOCX with a table, a text box and contact details
 * in the header).
 *
 * Run with: npm test
 */

const { content } = parseResumeText(SAMPLE);

function pdfOf(draw: (doc: PDFKit.PDFDocument) => void): Promise<Buffer> {
  return new Promise((resolve) => {
    const doc = new PDFDocument({ size: "A4", margin: 50 });
    const chunks: Buffer[] = [];
    doc.on("data", (c: Buffer) => chunks.push(c));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    draw(doc);
    doc.end();
  });
}

const W = (body: string, extra: Record<string, string> = {}) => {
  const zip = new JSZip();
  zip.file("[Content_Types].xml", `<?xml version="1.0"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="xml" ContentType="application/xml"/></Types>`);
  zip.file("word/document.xml", `<?xml version="1.0"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>${body}</w:body></w:document>`);
  for (const [name, xml] of Object.entries(extra)) zip.file(name, xml);
  return zip.generateAsync({ type: "nodebuffer" });
};
const p = (text: string, opts: { numbered?: boolean; style?: string } = {}) =>
  `<w:p>${opts.style ? `<w:pPr><w:pStyle w:val="${opts.style}"/></w:pPr>` : opts.numbered ? `<w:pPr><w:numPr><w:ilvl w:val="0"/><w:numId w:val="1"/></w:numPr></w:pPr>` : ""}<w:r><w:t xml:space="preserve">${text}</w:t></w:r></w:p>`;

describe("normalizeText", () => {
  it("folds bullet glyphs, odd spaces and ligatures, keeps a column gap", () => {
    assert.equal(normalizeText("▪ First\n– Second\n*  Third\n\n\n\nﬁnal   right"), "• First\n• Second\n• Third\n\nfinal   right");
    assert.equal(normalizeText("a b\tc"), "a b c");
  });
});

describe("PDF", () => {
  it("round-trips the exported resume: the text parses back to the same structure", async () => {
    const pdf = await renderPdf(content);
    assert.equal(sniffFormat(pdf), "pdf");
    const out = await extractPdf(pdf);
    assert.equal(out.layout.pages, 1);
    assert.equal(out.layout.multiColumn, false);
    assert.match(out.text, /Software Engineer — Acme Technologies, Bengaluru   Jun 2022 – Present/);
    const again = parseResumeText(out.text).content;
    assert.equal(again.basics.email, content.basics.email);
    assert.deepEqual(again.experience.map((e) => [e.position, e.company, e.startDate, e.bullets.length]), content.experience.map((e) => [e.position, e.company, e.startDate, e.bullets.length]));
    assert.deepEqual(again.skills.map((g) => g.items), content.skills.map((g) => g.items));
    assert.deepEqual(again.projects.map((x) => x.name), content.projects.map((x) => x.name));
  });
  it("detects a two-column layout and reads each column whole", async () => {
    const pdf = await pdfOf((doc) => {
      doc.fontSize(10);
      const left = ["SKILLS", "Java", "Python", "Docker", "Kubernetes", "PostgreSQL", "Redis", "Git", "Linux", "Kafka", "AWS"];
      const right = ["EXPERIENCE", "Software Engineer at Acme, Jun 2022 – Present", "• Built REST APIs serving many requests", "• Reduced latency by caching hot paths", "• Migrated services to Kubernetes", "Intern at Widgets, Jan 2022 – May 2022", "• Wrote unit tests", "• Documented the API", "EDUCATION", "B.Tech Computer Science, NIT, 2018 – 2022"];
      left.forEach((t, i) => doc.text(t, 50, 80 + i * 16, { width: 140 }));
      right.forEach((t, i) => doc.text(t, 230, 80 + i * 16, { width: 300 }));
    });
    const out = await extractPdf(pdf);
    assert.equal(out.layout.multiColumn, true);
    // Column-wise: the skills come out together, not interleaved with the roles.
    assert.ok(out.text.indexOf("Redis") < out.text.indexOf("EXPERIENCE"));
    assert.match(out.text, /• Built REST APIs serving many requests\n• Reduced latency/);
  });
  it("counts images and drops a running footer repeated on every page", async () => {
    const pdf = await pdfOf((doc) => {
      doc.fontSize(11);
      doc.text("Jane Doe", 50, 60);
      doc.text("jane@example.com | 9876543210", 50, 80);
      doc.text("EXPERIENCE", 50, 110);
      for (let i = 0; i < 6; i++) doc.text(`• Built something number ${i} with Python and Django for a real team`, 50, 130 + i * 16);
      // pdfkit adds a page when text crosses the bottom margin, so the footer sits just inside it.
      doc.text("Jane Doe — resume", 50, 775, { lineBreak: false });
      doc.addPage();
      doc.text("EDUCATION", 50, 60);
      doc.text("B.Sc Computer Science, Some University, 2019 – 2022", 50, 80);
      doc.text("Jane Doe — resume", 50, 775, { lineBreak: false });
    });
    const out = await extractPdf(pdf);
    assert.equal(out.layout.pages, 2);
    assert.equal(out.layout.repeatedHeaderFooter, true);
    assert.equal((out.text.match(/Jane Doe — resume/g) ?? []).length, 1);
  });
  it("refuses a PDF with no text", async () => {
    const pdf = await pdfOf((doc) => {
      doc.rect(50, 50, 200, 200).fill("#ccc");
    });
    await assert.rejects(() => extractPdf(pdf), (e: ResumeFileError) => e.status === 422 && /no readable text/.test(e.message));
  });
  it("refuses garbage that claims to be a PDF", async () => {
    await assert.rejects(() => extractPdf(Buffer.from("%PDF-1.7\n" + "garbage ".repeat(100))), (e: ResumeFileError) => e.status === 400 && /could not be read/.test(e.message));
  });
});

describe("DOCX", () => {
  it("round-trips the exported resume with heading hints", async () => {
    const docx = await renderDocx(content);
    assert.equal(sniffFormat(docx), "docx");
    const out = await extractDocx(docx);
    assert.deepEqual(out.layout.headingHints, ["SUMMARY", "EXPERIENCE", "EDUCATION", "SKILLS", "PROJECTS", "CERTIFICATIONS", "ACHIEVEMENTS"]);
    assert.equal(out.layout.tables, 0);
    const again = parseResumeText(out.text, out.layout.headingHints).content;
    assert.equal(again.experience.length, 2);
    assert.deepEqual(again.experience[1].bullets, content.experience[1].bullets);
    assert.equal(again.certifications[0].name, "AWS Certified Cloud Practitioner");
  });
  it("reads numbering as bullets, and counts tables, text boxes, drawings and columns", async () => {
    const body =
      p("Jane Doe", { style: "Title" }) +
      p("jane@example.com | 9876543210") +
      p("Experience", { style: "Heading1" }) +
      p("Engineer at Acme, 2020 – 2024") +
      p("Built a thing with Python that mattered to the business", { numbered: true }) +
      p("Shipped another thing with Django for a very long list of customers", { numbered: true }) +
      `<w:tbl><w:tr><w:tc>${p("Skills")}</w:tc><w:tc>${p("Python, Django, SQL")}</w:tc></w:tr></w:tbl>` +
      `<w:p><w:r><w:pict><v:shape><v:textbox><w:txbxContent>${p("Boxed text nobody parses")}</w:txbxContent></v:textbox></v:shape></w:pict></w:r></w:p>` +
      `<w:p><w:r><w:drawing><wp:inline/></w:drawing></w:r></w:p>` +
      p("Education", { style: "Heading1" }) +
      p("B.Sc Computer Science, Some University, 2016 – 2019 and more words to make it long enough") +
      `<w:sectPr><w:cols w:num="2"/></w:sectPr>`;
    const out = await extractDocx(await W(body));
    assert.equal(out.layout.tables, 1);
    assert.equal(out.layout.textBoxes, 1);
    assert.equal(out.layout.images, 1);
    assert.equal(out.layout.multiColumn, true);
    assert.deepEqual(out.layout.headingHints, ["Jane Doe", "Experience", "Education"]);
    assert.match(out.text, /• Built a thing with Python/);
    assert.match(out.text, /Skills\nPython, Django, SQL/);
  });
  it("flags contact details kept in the page header and still parses them", async () => {
    const body = p("Experience", { style: "Heading1" }) + p("Engineer at Acme, 2020 – 2024") + p("Built a thing with Python that mattered a great deal to a great many people", { numbered: true }) + p("Education", { style: "Heading1" }) + p("B.Sc Computer Science, Some University, 2016 – 2019");
    const header = `<?xml version="1.0"?><w:hdr xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">${p("Jane Doe")}${p("jane@example.com | +91 98765 43210")}</w:hdr>`;
    const out = await extractDocx(await W(body, { "word/header1.xml": header }));
    assert.equal(out.layout.headerContact, true);
    assert.match(out.text, /^Jane Doe\njane@example.com/);
    assert.equal(parseResumeText(out.text).content.basics.email, "jane@example.com");
  });
  it("refuses a zip that is not a Word document, and a corrupt one", async () => {
    const zip = new JSZip();
    zip.file("readme.txt", "not a resume ".repeat(30));
    const notWord = await zip.generateAsync({ type: "nodebuffer" });
    await assert.rejects(() => extractDocx(notWord), (e: ResumeFileError) => e.status === 415);
    await assert.rejects(() => extractDocx(Buffer.concat([Buffer.from([0x50, 0x4b, 0x03, 0x04]), Buffer.alloc(400, 7)])), (e: ResumeFileError) => e.status === 400);
  });
  it("refuses a document with almost no text", async () => {
    const tiny = await W(p("Hi"));
    await assert.rejects(() => extractDocx(tiny), (e: ResumeFileError) => e.status === 422);
  });
});

describe("extractResume", () => {
  it("dispatches on the sniffed format", async () => {
    const pdf = await renderPdf(content);
    assert.equal((await extractResume(pdf, "pdf")).layout.format, "pdf");
    const docx = await renderDocx(content);
    assert.equal((await extractResume(docx, "docx")).layout.format, "docx");
  });
});

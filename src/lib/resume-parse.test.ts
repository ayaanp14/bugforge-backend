import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { ResumeContentSchema, bulletsOf, contentToText, emptyContent, headingKey, normalizeContent, parseResumeText, readPath, yearsOfExperience } from "./resume-parse.js";

/**
 * The heuristic parser on a realistic resume, and the content helpers the
 * editor, the scorer and the suggestions rely on.
 *
 * Run with: npm test
 */

export const SAMPLE = `Ayaan Pathan
Software Engineer
ayaan.pathan@example.com | +91 98765 43210 | Bengaluru, India | linkedin.com/in/ayaanpathan | github.com/ayaanp

SUMMARY
Backend engineer with 3 years of experience building REST APIs and event-driven services in Java and Node.js. Comfortable owning a service from design to production.

EXPERIENCE
Software Engineer   Acme Technologies, Bengaluru   Jun 2022 – Present
• Built REST APIs using Spring Boot serving 2M requests/day
• Reduced p99 latency by 35% by introducing Redis caching
• Worked on migrating a monolith to microservices on Kubernetes
Backend Intern
Widgets Pvt Ltd | Jan 2022 – May 2022
• Helped with writing unit tests in JUnit
• Responsible for documenting the internal API

EDUCATION
B.Tech in Computer Science and Engineering | National Institute of Technology, Surathkal | 2018 – 2022 | CGPA: 8.6/10

TECHNICAL SKILLS
Languages: Java, Python, JavaScript, SQL
Frameworks: Spring Boot, Node.js, Express
Tools: Docker, Git, Jenkins, AWS

PROJECTS
Ledger — Java, Spring Boot, PostgreSQL
• Designed a double-entry ledger service handling 50k transactions a day
• Wrote integration tests with Testcontainers
Kairo Chat (React, Socket.io) github.com/ayaanp/kairo-chat
• Real-time chat with typing indicators and presence

CERTIFICATIONS
AWS Certified Cloud Practitioner – Amazon Web Services – 2023

ACHIEVEMENTS
• Ranked 2nd in the college hackathon 2021
• Solved 500+ problems on LeetCode`;

describe("parseResumeText", () => {
  const { content, unmappedHeadings, sectionsFound } = parseResumeText(SAMPLE);

  it("reads the contact block", () => {
    assert.equal(content.basics.name, "Ayaan Pathan");
    assert.equal(content.basics.title, "Software Engineer");
    assert.equal(content.basics.email, "ayaan.pathan@example.com");
    assert.equal(content.basics.phone, "+91 98765 43210");
    assert.equal(content.basics.location, "Bengaluru, India");
    assert.deepEqual(content.basics.links, ["linkedin.com/in/ayaanpathan", "github.com/ayaanp"]);
  });
  it("finds every standard section and no stray headings", () => {
    assert.deepEqual(sectionsFound, ["summary", "experience", "education", "skills", "projects", "certifications", "achievements"]);
    assert.deepEqual(unmappedHeadings, []);
    assert.deepEqual(content.sectionOrder, ["summary", "experience", "education", "skills", "projects", "certifications", "achievements"]);
  });
  it("splits experience on date ranges, with one- and two-line headers", () => {
    assert.equal(content.experience.length, 2);
    const [a, b] = content.experience;
    assert.equal(a.position, "Software Engineer");
    assert.equal(a.company, "Acme Technologies, Bengaluru");
    assert.equal(a.startDate, "Jun 2022");
    assert.equal(a.current, true);
    assert.equal(a.bullets.length, 3);
    assert.equal(b.position, "Backend Intern");
    assert.equal(b.company, "Widgets Pvt Ltd");
    assert.equal(b.startDate, "Jan 2022");
    assert.equal(b.endDate, "May 2022");
    assert.deepEqual(b.bullets, ["Helped with writing unit tests in JUnit", "Responsible for documenting the internal API"]);
  });
  it("reads education with degree, field, institution, dates and grade", () => {
    const e = content.education[0];
    assert.equal(e.degree, "B.Tech");
    assert.equal(e.field, "Computer Science and Engineering");
    assert.equal(e.institution, "National Institute of Technology, Surathkal");
    assert.equal(e.startDate, "2018");
    assert.equal(e.endDate, "2022");
    assert.equal(e.grade, "CGPA: 8.6/10");
  });
  it("groups skills by their labels, including labels that are section synonyms", () => {
    assert.deepEqual(
      content.skills.map((g) => [g.category, g.items]),
      [
        ["Languages", ["Java", "Python", "JavaScript", "SQL"]],
        ["Frameworks", ["Spring Boot", "Node.js", "Express"]],
        ["Tools", ["Docker", "Git", "Jenkins", "AWS"]],
      ],
    );
  });
  it("reads projects with technologies and links", () => {
    assert.equal(content.projects.length, 2);
    assert.equal(content.projects[0].name, "Ledger");
    assert.deepEqual(content.projects[0].technologies, ["Java", "Spring Boot", "PostgreSQL"]);
    assert.equal(content.projects[0].bullets.length, 2);
    assert.equal(content.projects[1].name, "Kairo Chat");
    assert.deepEqual(content.projects[1].technologies, ["React", "Socket.io"]);
    assert.equal(content.projects[1].link, "github.com/ayaanp/kairo-chat");
  });
  it("reads certifications and achievements", () => {
    assert.deepEqual(content.certifications.map((c) => [c.name, c.issuer, c.date]), [["AWS Certified Cloud Practitioner", "Amazon Web Services", "2023"]]);
    assert.deepEqual(content.achievements, ["Ranked 2nd in the college hackathon 2021", "Solved 500+ problems on LeetCode"]);
  });
  it("produces content the schema accepts, with ids on every row", () => {
    assert.ok(ResumeContentSchema.safeParse(content).success);
    for (const row of [...content.experience, ...content.education, ...content.skills, ...content.projects, ...content.certifications]) assert.ok(row.id.length >= 6);
  });
  it("keeps an unknown upper-case heading as a custom section and reports it", () => {
    const text = `Jane Doe\njane@example.com\n\nWHAT I HAVE BUILT\n• A compiler\n• A game\n\nEDUCATION\nB.Sc Computer Science | Some University | 2020 – 2023`;
    const parsed = parseResumeText(text);
    assert.deepEqual(parsed.unmappedHeadings, ["WHAT I HAVE BUILT"]);
    assert.equal(parsed.content.customSections.length, 1);
    assert.deepEqual(parsed.content.customSections[0].bullets, ["A compiler", "A game"]);
    assert.equal(parsed.content.education.length, 1);
  });
  it("treats a leading paragraph without a title as the summary", () => {
    const text = `Jane Doe\njane@example.com\nA backend developer with four years of experience shipping payment services in Go and Postgres for fintech clients across three countries.\n\nEXPERIENCE\nDeveloper — Fin Ltd — 2020 – 2024\n• Shipped things`;
    const parsed = parseResumeText(text);
    assert.match(parsed.content.summary, /^A backend developer/);
    assert.equal(parsed.content.experience.length, 1);
  });
  it("does not crash on an empty or degenerate text", () => {
    assert.ok(ResumeContentSchema.safeParse(parseResumeText("").content).success);
    assert.ok(ResumeContentSchema.safeParse(parseResumeText("•\n•\n•").content).success);
  });
});

describe("headingKey", () => {
  it("maps synonyms and refuses sentences", () => {
    assert.equal(headingKey("Work Experience"), "experience");
    assert.equal(headingKey("TECHNICAL SKILLS:"), "skills");
    assert.equal(headingKey("Awards & Honors"), "achievements");
    assert.equal(headingKey("Software Engineer at Acme, Jun 2022 – Present"), null);
    assert.equal(headingKey("Built REST APIs"), null);
  });
});

describe("content helpers", () => {
  const { content } = parseResumeText(SAMPLE);
  it("addresses every bullet and reads it back by path", () => {
    const bullets = bulletsOf(content);
    assert.equal(bullets.length, 3 + 2 + 2 + 1 + 2);
    assert.equal(bullets[0].path, "experience.0.bullets.0");
    assert.equal(bullets[0].context, "Software Engineer, Acme Technologies, Bengaluru");
    for (const b of bullets) assert.equal(readPath(content, b.path), b.text);
    assert.equal(readPath(content, "summary"), content.summary);
    assert.equal(readPath(content, "experience.9.bullets.0"), null);
    assert.equal(readPath(content, "basics.name"), null);
  });
  it("renders text in section order that a scorer can read", () => {
    const text = contentToText(content);
    assert.match(text, /^Ayaan Pathan\nSoftware Engineer/);
    assert.ok(text.indexOf("Experience") < text.indexOf("Education"));
    assert.match(text, /• Built REST APIs using Spring Boot/);
    assert.match(text, /Languages: Java, Python/);
  });
  it("sums dated experience without double-counting overlaps", () => {
    assert.equal(yearsOfExperience(content, new Date("2026-09-17")), 4.6);
    const overlapping = { ...emptyContent(), experience: [
      { id: "a", company: "", position: "", location: "", startDate: "Jan 2020", endDate: "Dec 2021", current: false, bullets: [] },
      { id: "b", company: "", position: "", location: "", startDate: "Jun 2020", endDate: "Jun 2022", current: false, bullets: [] },
    ] };
    assert.equal(yearsOfExperience(overlapping, new Date("2026-01-01")), 2.4);
  });
  it("normalises ids and the section order", () => {
    const messy = { ...emptyContent(), customSections: [{ id: "", title: "Extra", bullets: ["x"] }], sectionOrder: ["skills", "nope", "skills"] };
    const fixed = normalizeContent(messy);
    assert.ok(fixed.customSections[0].id);
    assert.equal(fixed.sectionOrder[0], "skills");
    assert.equal(new Set(fixed.sectionOrder).size, fixed.sectionOrder.length);
    assert.ok(fixed.sectionOrder.includes(`custom:${fixed.customSections[0].id}`));
    assert.ok(fixed.sectionOrder.includes("experience"));
  });
});

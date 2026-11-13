import { test } from "node:test";
import assert from "node:assert/strict";
import { RESUME_CHARS, RESUME_ROUND, coversResume, resumeBrief, resumeRole, resumeSection } from "./resume-interview.js";
import { SIMULATIONS } from "./simulations/index.js";
import { emptyContent } from "./resume-parse.js";
import { ROUND_SKILL } from "./interview-skills.js";

/**
 * The resume-based interview: what of a resume the interviewer reads, and how
 * it is told to use it. Run with: npm test
 */

const resume = () => ({
  ...emptyContent(),
  basics: {
    name: "Asha Rao",
    title: "Backend Engineer",
    email: "asha@example.com",
    phone: "+91 98765 43210",
    location: "Pune",
    links: ["github.com/asha"],
  },
  experience: [
    {
      id: "e1",
      company: "Acme Pay",
      position: "SDE Intern",
      location: "Remote",
      startDate: "Jan 2025",
      endDate: "Jun 2025",
      current: false,
      bullets: ["Cut checkout latency by 40% by caching the fraud score in Redis"],
    },
  ],
  projects: [
    {
      id: "p1",
      name: "Chat app",
      link: "https://chat.example.com",
      technologies: ["Node.js", "socket.io"],
      startDate: "",
      endDate: "",
      bullets: ["Real-time rooms for 500 users"],
    },
  ],
  skills: [{ id: "s1", category: "Languages", items: ["Java", "TypeScript"] }],
});

test("the brief carries the experience, projects and skills, and nothing that reaches the person", () => {
  const b = resumeBrief(resume());
  assert.ok(b);
  assert.match(b, /Backend Engineer/);
  assert.match(b, /SDE Intern — Acme Pay/);
  assert.match(b, /Cut checkout latency by 40%/);
  assert.match(b, /Chat app \| Node\.js, socket\.io/);
  assert.match(b, /Languages: Java, TypeScript/);
  for (const secret of ["Asha Rao", "asha@example.com", "98765", "Pune", "github.com/asha", "chat.example.com"]) {
    assert.ok(!b.includes(secret), `${secret} must not reach the model`);
  }
});

test("an empty or unreadable resume gives no brief, so the round runs as the plain deep dive", () => {
  assert.equal(resumeBrief(emptyContent()), null);
  assert.equal(resumeBrief({ ...emptyContent(), basics: { ...emptyContent().basics, title: "Engineer" } }), null);
  assert.equal(resumeBrief({ nonsense: true }), null);
  assert.equal(resumeBrief(null), null);
});

test("a long resume is cut at a line end and marked, never dropped", () => {
  const r = resume();
  r.experience[0]!.bullets = Array.from({ length: 40 }, (_, i) => `Bullet ${i} `.padEnd(700, "x"));
  const b = resumeBrief(r)!;
  assert.ok(b.length <= RESUME_CHARS + 30);
  assert.match(b, /\n… \(cut for length\)$/);
});

test("the section fences the resume as data and asks about the candidate's own claims", () => {
  const s = resumeSection("SDE Intern — Acme Pay", false);
  assert.match(s, /BEGIN RESUME\nSDE Intern — Acme Pay\nEND RESUME/);
  assert.match(s, /Every question must start from something on this resume/);
  assert.match(s, /naming the claim/);
  assert.match(s, /Quote a short phrase/);
  assert.match(resumeSection("x", true), /never by reading the resume aloud/);
});

test("the role comes from the target, then the headline, then the common case", () => {
  assert.equal(resumeRole({ targetRole: "Data Analyst", content: resume() }), "Data Analyst");
  assert.equal(resumeRole({ targetRole: "  ", content: resume() }), "Backend Engineer");
  assert.equal(resumeRole({ targetRole: null, content: {} }), "Software Engineer");
});

test("a simulation round that covers projects or the resume reads it as one part of the round", () => {
  assert.equal(coversResume("OOP, DBMS and SQL, OS, networks, your projects and puzzles."), true);
  assert.equal(coversResume("Questions from your resume and area of interest"), true);
  assert.equal(coversResume("Situational and behavioural questions"), false);
  // Some company's rounds do: the hook is not dead.
  assert.ok(SIMULATIONS.some((s) => s.rounds.some((r) => r.kind !== "assessment" && coversResume(r.covers))));

  const part = resumeSection("SDE Intern — Acme Pay", true, true);
  assert.match(part, /Keep the round's other topics/);
  assert.match(part, /BEGIN RESUME\nSDE Intern — Acme Pay\nEND RESUME/);
  assert.doesNotMatch(part, /Every question must start from something on this resume/);
});

test("the round is filed under the technical interview skill", () => {
  assert.equal(ROUND_SKILL[RESUME_ROUND], "int:technical");
});

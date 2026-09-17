import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { parseJobDescription, requirementsFor, requirementsForRole } from "./resume-requirements.js";

/**
 * Reading requirements out of a job description, and out of a bare role.
 *
 * Run with: npm test
 */

const JD = `Backend Engineer — Amazon

About the role
We are looking for a Backend Engineer to join the Payments team building distributed systems that process millions of transactions a day.

Responsibilities
- Design, build and operate REST APIs and microservices in Java and Spring Boot
- Own services end to end: design, testing, deployment and on-call
- Work with Kafka for event streaming and DynamoDB for storage

Basic qualifications
- 3+ years of experience in backend software development
- Strong in Java, data structures and algorithms
- Experience with AWS (EC2, S3, Lambda)
- Bachelor's degree in Computer Science or related field
- Excellent communication skills

Preferred qualifications
- Experience with Kubernetes and Docker
- Knowledge of payment systems or fintech
- AWS Certified Developer is a plus`;

describe("parseJobDescription", () => {
  const req = parseJobDescription(JD, "Backend Engineer", "Amazon");

  it("separates required from preferred by section and by cue", () => {
    for (const s of ["Java", "Spring Boot", "REST APIs", "Microservices", "Kafka", "Data Structures", "Algorithms", "AWS", "Distributed Systems"]) assert.ok(req.requiredSkills.includes(s), `${s} required`);
    for (const s of ["Kubernetes", "Docker"]) assert.ok(req.preferredSkills.includes(s), `${s} preferred`);
    assert.ok(!req.requiredSkills.includes("Kubernetes"));
  });
  it("demotes named parts of a platform and drops the broad name a specific one implies", () => {
    for (const s of ["EC2", "S3", "Lambda", "DynamoDB"]) {
      assert.ok(req.preferredSkills.includes(s), `${s} preferred`);
      assert.ok(!req.requiredSkills.includes(s), `${s} not required`);
    }
    assert.ok(!req.requiredSkills.includes("Spring") && !req.preferredSkills.includes("Spring"));
  });
  it("reads years, education, certifications, soft skills and domain terms", () => {
    assert.equal(req.yearsRequired, 3);
    assert.match(req.education[0], /^Bachelor's degree in Computer Science/);
    assert.ok(req.certifications.some((c) => /AWS Certified Developer/.test(c)));
    assert.ok(req.softSkills.includes("communication"));
    assert.ok(req.domainTerms.includes("fintech") && req.domainTerms.includes("payments"));
    assert.ok(req.responsibilities.length >= 3);
  });
  it("skips the about-us section for skills", () => {
    const text = `About us\nWe build things in Rust and Haskell.\n\nRequirements\n- Python`;
    const r = parseJobDescription(text, "", "");
    assert.deepEqual(r.requiredSkills, ["Python"]);
  });
  it("reads a years range and word numbers", () => {
    assert.equal(parseJobDescription("Requirements\n- 2-4 years of experience with React", "", "").yearsRequired, 2);
    assert.equal(parseJobDescription("Requirements\n- 2-4 years of experience with React", "", "").yearsMax, 4);
    assert.equal(parseJobDescription("Requirements\n- at least five years working with Java", "", "").yearsRequired, 5);
    assert.equal(parseJobDescription("We have grown over the last 3 years", "", "").yearsRequired, null);
  });
});

describe("requirementsForRole", () => {
  it("picks the most specific profile", () => {
    assert.ok(requirementsForRole("Senior Backend Software Engineer", "").requiredSkills.includes("REST APIs"));
    assert.ok(requirementsForRole("Data Scientist", "").requiredSkills.includes("Machine Learning"));
    assert.ok(requirementsForRole("Something Unusual", "").requiredSkills.includes("Data Structures"));
    assert.equal(requirementsForRole("", "").source, "none");
  });
  it("infers seniority into years", () => {
    assert.equal(requirementsForRole("Senior Backend Engineer", "").yearsRequired, 4);
    assert.equal(requirementsForRole("Backend Intern", "").yearsRequired, 0);
    assert.equal(requirementsForRole("Backend Engineer", "").yearsRequired, null);
  });
});

describe("requirementsFor", () => {
  it("prefers the description, falls back to the role, and pads a thin description with the role's baseline", () => {
    assert.equal(requirementsFor("Backend Engineer", "Amazon", JD).source, "jd");
    assert.equal(requirementsFor("Backend Engineer", "", "").source, "role");
    assert.equal(requirementsFor("Backend Engineer", "", "too short").source, "role");
    const thin = requirementsFor("Frontend Developer", "", "We need someone great to join our team and help us ship faster. Apply with your resume today.");
    assert.equal(thin.source, "jd");
    assert.ok(thin.preferredSkills.includes("React"));
  });
});

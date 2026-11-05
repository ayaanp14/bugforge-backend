import test from "node:test";
import assert from "node:assert/strict";

import { applicantLink, campusApplicationMail, type CampusApplication } from "./campus-application-mail.js";

const APP: CampusApplication = {
  name: "Asha Rao",
  email: "asha@college.edu",
  college: "NIT Trichy",
  why: "A contest for the coding club.\nAbout 40 people.",
  phone: null,
  city: null,
  graduationYear: null,
  linkedin: null,
  instagram: null,
  reach: null,
};
const ADMIN = "https://codekairo.com/admin?tab=ambassadors";

test("the mail goes to the support inbox, and a reply goes to the applicant", () => {
  const mail = campusApplicationMail(APP, ADMIN);
  assert.equal(mail.to, "support@codekairo.com");
  assert.equal(mail.replyTo, "asha@college.edu");
  assert.equal(mail.subject, "New ambassador application: Asha Rao, NIT Trichy");
  for (const part of [mail.html, mail.text]) {
    assert.ok(part.includes("NIT Trichy") && part.includes("About 40 people.") && part.includes("Review it in the admin panel"));
  }
});

test("a field left blank is not listed", () => {
  const mail = campusApplicationMail(APP, ADMIN);
  assert.ok(!mail.text.includes("Phone"));
  assert.ok(!mail.html.includes("LinkedIn"));
  assert.ok(campusApplicationMail({ ...APP, phone: "98765" }, ADMIN).text.includes("Phone / WhatsApp: 98765"));
});

test("what a stranger typed cannot become markup, a link or a second subject line", () => {
  const mail = campusApplicationMail(
    {
      ...APP,
      name: "<img src=x onerror=alert(1)>\nBcc: x@y.z",
      why: `<a href="https://evil.example">click</a>`,
      linkedin: "javascript:alert(1)",
    },
    ADMIN,
  );
  assert.ok(!mail.html.includes("<img"));
  assert.ok(!mail.html.includes(`<a href="https://evil.example"`));
  assert.ok(!mail.html.includes(`href="javascript:`));
  assert.ok(!/[\r\n]/.test(mail.subject));
});

test("only http(s) profile values become links", () => {
  assert.equal(applicantLink("https://linkedin.com/in/asha"), "https://linkedin.com/in/asha");
  assert.equal(applicantLink("linkedin.com/in/asha"), "https://linkedin.com/in/asha");
  assert.equal(applicantLink("www.instagram.com/asha"), "https://www.instagram.com/asha");
  for (const value of ["@asha", "asha rao", "javascript:alert(1)", "data:text/html,x", "", null]) {
    assert.equal(applicantLink(value), null, String(value));
  }
});

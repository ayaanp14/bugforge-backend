import { test } from "node:test";
import assert from "node:assert/strict";
import { orgSeo, seoOf, tournamentSeo, type OrgRow, type TournamentRow } from "./battles-seo.js";

// What the tournament site tells a search engine about a tournament and an
// organizer. The Worker writes it into the HTML and the pages set it at
// runtime, so these pin the words both share and what is never said.

const NOW = new Date("2026-10-01T06:00:00Z");
const VERIFIED = new Date("2026-09-01T00:00:00Z");

const knockout = (over: Partial<TournamentRow> = {}): TournamentRow => ({
  slug: "freshers-knockout",
  title: "Freshers Knockout",
  description: null,
  format: "knockout",
  status: "published",
  teamSize: 1,
  capacity: 64,
  registrationClosesAt: new Date("2026-10-02T12:30:00Z"),
  startsAt: new Date("2026-10-03T04:30:00Z"),
  durationMinutes: 45,
  finishedAt: null,
  allowedDomains: ["college.edu"],
  inviteCode: null,
  requiresApproval: false,
  org: { slug: "the-coding-club", name: "The Coding Club", verifiedAt: VERIFIED },
  entries: 29,
  problems: 5,
  ...over,
});

test("a draft, or a tournament of an unverified organizer, has no public head", () => {
  assert.equal(tournamentSeo(knockout({ status: "draft" }), NOW), null);
  assert.equal(tournamentSeo(knockout({ org: { slug: "x", name: "X", verifiedAt: null } }), NOW), null);
  assert.equal(seoOf(null), null);
});

test("a tournament's title and description name it, its format and its host, in whole sentences", () => {
  const head = tournamentSeo(knockout(), NOW)!;
  assert.equal(head.title, "Freshers Knockout — 1v1 Coding Knockout by The Coding Club — CodeKairo Battles");
  assert.equal(head.path, "/t/freshers-knockout");
  assert.ok(head.description.length <= 158, head.description);
  assert.match(head.description, /^Freshers Knockout: a 1v1 coding knockout hosted by The Coding Club\. It starts Sat, 3 Oct 2026, 10:00 IST\./);
  assert.ok(head.description.endsWith("."));
  assert.equal(head.index, true);
  assert.deepEqual(
    head.facts.trail.map((c) => c.path),
    ["/", "/tournaments", "/t/freshers-knockout"],
  );
});

test("the entry rule reads the way the registration panel does", () => {
  const content = tournamentSeo(knockout({ inviteCode: "SECRET", requiresApproval: true }), NOW)!.content;
  assert.match(content, /Open to @college\.edu email addresses, with the organizer's invite code and subject to the organizer's approval\./);
  // The code itself is never sent.
  assert.ok(!content.includes("SECRET"));
  assert.match(tournamentSeo(knockout({ allowedDomains: [] }), NOW)!.content, /Open to every CodeKairo account\./);
});

test("an organizer's words are escaped, and paragraphs kept", () => {
  const head = tournamentSeo(knockout({ description: "Prizes <b>worth</b> ₹10,000.\n\n<script>alert(1)</script>" }), NOW)!;
  assert.ok(!head.content.includes("<script>"));
  assert.ok(head.content.includes("&lt;script&gt;"));
  assert.match(head.content, /<p>Prizes &lt;b&gt;worth&lt;\/b&gt; ₹10,000\.<\/p><p>/);
});

test("an ICPC contest ends on its clock; a knockout only once its final is decided", () => {
  const icpc = tournamentSeo(knockout({ format: "icpc", teamSize: 3, durationMinutes: 180 }), NOW)!;
  assert.equal(icpc.facts.kind === "tournament" && icpc.facts.endDate, "2026-10-03T07:30:00.000Z");
  assert.match(icpc.title, /ICPC-Style Coding Contest/);
  assert.match(icpc.description, /^Freshers Knockout: an ICPC-style coding contest for teams of up to 3 hosted by The Coding Club./);
  assert.match(icpc.content, /Teams are entered by the organizer\./);
  const open = tournamentSeo(knockout(), NOW)!;
  assert.equal(open.facts.kind === "tournament" && open.facts.endDate, undefined);
  const done = tournamentSeo(knockout({ finishedAt: new Date("2026-10-03T08:20:00Z") }), new Date("2026-10-04T00:00:00Z"))!;
  assert.equal(done.facts.kind === "tournament" && done.facts.endDate, "2026-10-03T08:20:00.000Z");
  assert.match(done.description, /It was held on 3 October 2026\./);
});

test("a cancelled tournament is served but not indexed", () => {
  const head = tournamentSeo(knockout({ status: "cancelled" }), NOW)!;
  assert.equal(head.index, false);
  assert.equal(head.facts.kind === "tournament" && head.facts.cancelled, true);
});

const org: OrgRow = { slug: "the-coding-club", name: "The Coding Club", kind: "club", website: "https://club.example.edu", city: "Pune", about: null, verifiedAt: VERIFIED };
const row = (over: Record<string, unknown> = {}) => ({
  slug: "freshers-knockout",
  title: "Freshers Knockout",
  format: "knockout",
  status: "published",
  startsAt: new Date("2026-10-03T04:30:00Z"),
  registrationClosesAt: new Date("2026-10-02T12:30:00Z"),
  durationMinutes: 45,
  finishedAt: null,
  ...over,
});

test("an organizer is public once verified, and indexed once it has published something", () => {
  assert.equal(orgSeo({ ...org, verifiedAt: null }, [row()], NOW), null);
  assert.equal(orgSeo(org, [row({ status: "draft" })], NOW)!.index, false);
  const head = orgSeo(org, [row(), row({ slug: "dsa-night", title: "DSA Night", format: "icpc", status: "draft" })], NOW)!;
  assert.equal(head.index, true);
  assert.equal(head.title, "The Coding Club: Coding Competitions and Tournaments — CodeKairo Battles");
  assert.ok(head.description.length <= 158);
  // Drafts are listed to nobody.
  assert.ok(head.content.includes("/t/freshers-knockout"));
  assert.ok(!head.content.includes("dsa-night"));
  assert.match(head.content, /rel="nofollow noopener"/);
});

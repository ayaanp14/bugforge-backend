import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  emailDomainAllowed,
  normalizeDomains,
  parseTeamList,
  publishBlocker,
  readTournamentFields,
  registrationDecision,
  tournamentPhase,
} from "./battles-rules.js";

/** The tournament site's pure rules (battles-rules.ts), without a database. Run with: npm test */

const NOW = new Date("2026-10-01T10:00:00Z");
const at = (iso: string) => new Date(iso);

const base = {
  status: "published",
  format: "knockout",
  registrationClosesAt: at("2026-10-05T00:00:00Z"),
  startsAt: at("2026-10-06T10:00:00Z"),
  durationMinutes: 60,
  allowedDomains: [] as string[],
  inviteCode: null as string | null,
  requiresApproval: false,
  capacity: null as number | null,
};

describe("emailDomainAllowed", () => {
  it("lets anyone in when no domains are set", () => {
    assert.equal(emailDomainAllowed("a@gmail.com", []), true);
  });
  it("accepts the domain and its subdomains, case-insensitively", () => {
    assert.equal(emailDomainAllowed("a@IITB.ac.in", ["iitb.ac.in"]), true);
    assert.equal(emailDomainAllowed("a@students.iitb.ac.in", ["iitb.ac.in"]), true);
  });
  it("refuses look-alikes", () => {
    assert.equal(emailDomainAllowed("a@notiitb.ac.in", ["iitb.ac.in"]), false);
    assert.equal(emailDomainAllowed("a@iitb.ac.in.evil.com", ["iitb.ac.in"]), false);
    assert.equal(emailDomainAllowed(null, ["iitb.ac.in"]), false);
  });
});

describe("normalizeDomains", () => {
  it("strips @, lower-cases and de-duplicates", () => {
    assert.deepEqual(normalizeDomains(["@IITB.ac.in", " iitb.ac.in ", "", "vit.edu"]), { domains: ["iitb.ac.in", "vit.edu"] });
  });
  it("names the entry that is not a domain", () => {
    assert.deepEqual(normalizeDomains(["iitb", "vit.edu"]), { invalid: "iitb" });
  });
});

describe("tournamentPhase", () => {
  it("walks registration → closed → live → finished for an ICPC contest", () => {
    const t = { ...base, format: "icpc" };
    assert.equal(tournamentPhase(t, NOW), "registration");
    assert.equal(tournamentPhase(t, at("2026-10-05T12:00:00Z")), "registration_closed");
    assert.equal(tournamentPhase(t, at("2026-10-06T10:30:00Z")), "live");
    assert.equal(tournamentPhase(t, at("2026-10-06T11:00:00Z")), "finished");
  });
  it("keeps a knockout live after its start: its end is the bracket's", () => {
    assert.equal(tournamentPhase(base, at("2026-10-09T00:00:00Z")), "live");
  });
  it("reports draft and cancelled whatever the clock", () => {
    assert.equal(tournamentPhase({ ...base, status: "draft" }, NOW), "draft");
    assert.equal(tournamentPhase({ ...base, status: "cancelled" }, NOW), "cancelled");
  });
});

describe("registrationDecision", () => {
  const who = { email: "asha@iitb.ac.in", inviteCode: undefined, takenPlaces: 0 };

  it("admits at once, or into the organizer's queue", () => {
    assert.deepEqual(registrationDecision(base, who, NOW), { ok: true, status: "approved" });
    assert.deepEqual(registrationDecision({ ...base, requiresApproval: true }, who, NOW), { ok: true, status: "pending" });
  });
  it("sends ICPC entrants to the organizer", () => {
    const d = registrationDecision({ ...base, format: "icpc" }, who, NOW);
    assert.equal(d.ok, false);
  });
  it("refuses after registration closes", () => {
    const d = registrationDecision(base, who, at("2026-10-05T01:00:00Z"));
    assert.deepEqual(d, { ok: false, status: 409, reason: "Registration is closed." });
  });
  it("checks the domain, then the code, then the room", () => {
    const t = { ...base, allowedDomains: ["vit.edu"], inviteCode: "CODEFEST", capacity: 1 };
    assert.equal((registrationDecision(t, who, NOW) as { status: number }).status, 403);
    const vit = { email: "r@vit.edu", inviteCode: "codefest", takenPlaces: 0 };
    assert.deepEqual(registrationDecision(t, vit, NOW), { ok: true, status: "approved" });
    assert.match((registrationDecision(t, { ...vit, inviteCode: "nope" }, NOW) as { reason: string }).reason, /not right/);
    assert.match((registrationDecision(t, { ...vit, takenPlaces: 1 }, NOW) as { reason: string }).reason, /full/);
  });
});

describe("readTournamentFields", () => {
  const body = {
    title: "CodeFest 2026",
    format: "icpc",
    teamSize: 3,
    registrationClosesAt: "2026-10-05T00:00:00Z",
    startsAt: "2026-10-06T10:00:00Z",
    durationMinutes: 180,
    allowedDomains: ["@IITB.ac.in"],
    inviteCode: " fest-26 ",
  };

  it("reads and normalises a whole tournament", () => {
    const r = readTournamentFields(body, null, { formatLocked: false });
    assert.ok("fields" in r);
    assert.equal(r.fields.inviteCode, "FEST-26");
    assert.deepEqual(r.fields.allowedDomains, ["iitb.ac.in"]);
    assert.equal(r.fields.capacity, null);
  });
  it("forces a knockout's team size to 1", () => {
    const r = readTournamentFields({ ...body, format: "knockout", teamSize: 3 }, null, { formatLocked: false });
    assert.ok("fields" in r && r.fields.teamSize === 1);
  });
  it("refuses registration closing after the start", () => {
    const r = readTournamentFields({ ...body, registrationClosesAt: "2026-10-07T00:00:00Z" }, null, { formatLocked: false });
    assert.deepEqual(r, { error: "Registration must close before the tournament starts." });
  });
  it("keeps stored values on a partial edit and locks the format once published", () => {
    const first = readTournamentFields(body, null, { formatLocked: false });
    assert.ok("fields" in first);
    const edit = readTournamentFields({ title: "CodeFest 2026 Finals" }, first.fields, { formatLocked: true });
    assert.ok("fields" in edit && edit.fields.title === "CodeFest 2026 Finals" && edit.fields.teamSize === 3);
    const change = readTournamentFields({ format: "knockout" }, first.fields, { formatLocked: true });
    assert.ok("error" in change);
  });
});

describe("publishBlocker", () => {
  const draft = { ...base, status: "draft" };
  it("needs a verified org, a problem and open registration", () => {
    assert.match(publishBlocker(draft, 2, false, NOW) ?? "", /verification/);
    assert.match(publishBlocker(draft, 0, true, NOW) ?? "", /problem/);
    assert.match(publishBlocker(draft, 2, true, at("2026-10-05T01:00:00Z")) ?? "", /closed/);
    assert.equal(publishBlocker(draft, 2, true, NOW), null);
  });
});

describe("parseTeamList", () => {
  it("reads commas and pasted tabs, skipping a header row", () => {
    const r = parseTeamList("Team,Member 1,Member 2\nByte Me, asha@iitb.ac.in, rohan_k\nNull Pointers\tmeera\n", 3);
    assert.deepEqual(r, {
      teams: [
        { line: 2, name: "Byte Me", members: ["asha@iitb.ac.in", "rohan_k"] },
        { line: 3, name: "Null Pointers", members: ["meera"] },
      ],
    });
  });
  it("reports every problem with its line", () => {
    const r = parseTeamList("A, x, y, z, w\nA, q\nB\nC, X", 3);
    assert.ok("errors" in r);
    assert.equal(r.errors.length, 4);
    assert.match(r.errors[0], /Line 1: "A" has 4 members/);
    assert.match(r.errors[1], /Line 2: there is already a team called "A"/);
    assert.match(r.errors[2], /Line 3: "B" has no members/);
    assert.match(r.errors[3], /Line 4: X is already in the team on line 1/);
  });
});

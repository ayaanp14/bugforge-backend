import { prisma } from "../lib/prisma.js";
import { APPLICATION_LIMITS, linksFor, parseApplication, summaryOf, type CompanyLinks, type TrackerSummary } from "../lib/applications.js";
import { SIMULATIONS } from "../lib/simulations/catalog.js";
import { companyChoices, setTarget, TargetError } from "./readiness.js";
import { repickMissionToday } from "./mission.js";
import { invalidateDashboard } from "./dashboard.js";

/**
 * The application tracker (Phase 8 of ADAPTIVE_COACH.md, §15): a member's own
 * list of jobs and internships, private, every query scoped by `userId` in
 * its `where`. The rules are lib/applications.ts; the one thing a row does
 * beyond itself is "Make this my target" — the company and the next date
 * become the readiness target, which re-picks today's mission like a target
 * set on /readiness does.
 */

export class ApplicationError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "ApplicationError";
  }
}

const ROW_SELECT = {
  id: true,
  company: true,
  role: true,
  stage: true,
  source: true,
  link: true,
  appliedOn: true,
  nextOn: true,
  nextLabel: true,
  notes: true,
  createdAt: true,
  updatedAt: true,
} as const;

type Row = Awaited<ReturnType<typeof prisma.jobApplication.findMany<{ select: typeof ROW_SELECT }>>>[number];

const dateOnly = (d: Date | null) => (d ? d.toISOString().slice(0, 10) : null);

export interface ApplicationView extends Omit<Row, "appliedOn" | "nextOn"> {
  appliedOn: string | null;
  nextOn: string | null;
  links: CompanyLinks;
}

export interface TrackerView {
  applications: ApplicationView[];
  summary: TrackerSummary;
  /** The saved readiness target, so a row can say it is the one. */
  target: { company: string | null; date: string | null };
}

async function matchers() {
  const known = await companyChoices();
  return (company: string) => linksFor(company, known, SIMULATIONS);
}

const viewOf = (r: Row, links: (c: string) => CompanyLinks): ApplicationView => ({ ...r, appliedOn: dateOnly(r.appliedOn), nextOn: dateOnly(r.nextOn), links: links(r.company) });

export async function trackerFor(userId: string): Promise<TrackerView> {
  const [rows, links, user] = await Promise.all([
    prisma.jobApplication.findMany({ where: { userId }, orderBy: { updatedAt: "desc" }, take: APPLICATION_LIMITS.perAccount, select: ROW_SELECT }),
    matchers(),
    prisma.user.findUnique({ where: { id: userId }, select: { targetCompany: true, targetDate: true } }),
  ]);
  return {
    applications: rows.map((r) => viewOf(r, links)),
    summary: summaryOf(rows),
    target: { company: user?.targetCompany ?? null, date: dateOnly(user?.targetDate ?? null) },
  };
}

export async function createApplication(userId: string, body: unknown): Promise<ApplicationView> {
  const parsed = parseApplication(body, false);
  if ("error" in parsed) throw new ApplicationError(parsed.error, 400);
  const count = await prisma.jobApplication.count({ where: { userId } });
  if (count >= APPLICATION_LIMITS.perAccount) throw new ApplicationError(`The tracker holds ${APPLICATION_LIMITS.perAccount} applications. Delete an old one first.`, 409);
  const d = parsed.data;
  const row = await prisma.jobApplication.create({
    data: {
      userId,
      company: d.company!,
      role: d.role!,
      stage: d.stage ?? "applied",
      source: d.source ?? null,
      link: d.link ?? null,
      appliedOn: d.appliedOn ?? null,
      nextOn: d.nextOn ?? null,
      nextLabel: d.nextLabel ?? null,
      notes: d.notes ?? null,
    },
    select: ROW_SELECT,
  });
  return viewOf(row, await matchers());
}

export async function updateApplication(userId: string, id: string, body: unknown): Promise<ApplicationView> {
  const parsed = parseApplication(body, true);
  if ("error" in parsed) throw new ApplicationError(parsed.error, 400);
  const updated = await prisma.jobApplication.updateMany({ where: { id, userId }, data: parsed.data });
  if (!updated.count) throw new ApplicationError("No such application.", 404);
  const row = await prisma.jobApplication.findFirstOrThrow({ where: { id, userId }, select: ROW_SELECT });
  return viewOf(row, await matchers());
}

export async function deleteApplication(userId: string, id: string): Promise<void> {
  const gone = await prisma.jobApplication.deleteMany({ where: { id, userId } });
  if (!gone.count) throw new ApplicationError("No such application.", 404);
}

/**
 * "Make this my target": the row's company (as the site spells it) and its
 * next date, when it is still ahead, become the readiness target; today's
 * mission re-picks to lean on it. Refused for a company readiness cannot read.
 */
export async function targetFromApplication(userId: string, id: string): Promise<{ company: string; date: string | null }> {
  const row = await prisma.jobApplication.findFirst({ where: { id, userId }, select: { company: true, nextOn: true } });
  if (!row) throw new ApplicationError("No such application.", 404);
  const links = (await matchers())(row.company);
  if (!links.readiness || !links.company) throw new ApplicationError(`Readiness does not know ${row.company} yet, so it cannot be your target.`, 409);
  const date = row.nextOn && row.nextOn.getTime() >= Date.now() - 86_400_000 ? dateOnly(row.nextOn) : null;
  try {
    await setTarget(userId, { company: links.company, date });
  } catch (err) {
    if (err instanceof TargetError) throw new ApplicationError(err.message, 400);
    throw err;
  }
  await repickMissionToday(userId).catch(() => undefined);
  invalidateDashboard(userId);
  return { company: links.company, date };
}

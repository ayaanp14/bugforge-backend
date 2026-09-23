import { Router } from "express";
import { optionalAuth, requireAuth } from "../middleware/auth.js";
import { browserCache } from "../lib/http-cache.js";
import { invalidateDashboard } from "../services/dashboard.js";
import {
  calendarMonth,
  contestStreak,
  dayBoard,
  endOfDay,
  ensureContest,
  enterContest,
  isValidDay,
  myDayStanding,
  myStanding,
  solvedBeforeDay,
  standings,
  todayUtc,
} from "../services/daily-contest.js";

/**
 * The daily contest. Reads are cheap and cached in the service; the one write
 * a client can make is entering today's contest, which the workspace does on
 * its own when it opens the day's problem. Verdicts reach the contest through
 * the judge (routes/execution.ts), never through here.
 */
const router = Router();

/** Today's problem, the reader's sitting of it, and their streak. */
router.get("/daily", optionalAuth, browserCache(30), async (req, res) => {
  try {
    const today = todayUtc();
    const userId = req.user?.userId ?? null;
    // The catalogue page's rail draws today's kata and the month grid one above
    // the other and used to ask for them as two requests. `?calendar=1` folds
    // the month in — the server's own UTC month, never one named from this
    // answer's date, which would make the calendar the second hop of a chain
    // (that is the trace ending on it at 2.7 s, 2026-09-22). Asked for beside
    // the contest lookup rather than after it: neither needs the other.
    const wantsCalendar = req.query["calendar"] === "1";
    const [contest, calendar] = await Promise.all([
      ensureContest(today),
      wantsCalendar ? calendarMonth(today.slice(0, 7), userId) : Promise.resolve(undefined),
    ]);
    // Undefined unless it was asked for, and JSON drops the key — so every
    // other caller of this route sees the answer it has always seen.
    if (!contest) {
      res.json({ date: today, endsAt: endOfDay(today), contest: null, me: null, streak: null, board: { board: [], participants: 0, solvers: 0 }, calendar });
      return;
    }
    const [board, me, streak, solvedBefore] = await Promise.all([
      dayBoard(contest.id, 10),
      userId ? myDayStanding(contest.id, userId) : Promise.resolve(null),
      userId ? contestStreak(userId, today) : Promise.resolve(null),
      userId ? solvedBeforeDay(userId, contest.problemId, today) : Promise.resolve(false),
    ]);
    res.json({
      date: today,
      endsAt: endOfDay(today),
      contest: { id: contest.id, date: contest.date, difficulty: contest.difficulty, problem: contest.problem },
      me,
      streak,
      board,
      // An earlier solve of this problem, which the contest does not count.
      solvedBefore,
      calendar,
    });
  } catch (err) {
    console.error("GET /api/contests/daily error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

/** The calendar: one month of days, with the reader's marks on them. */
router.get("/daily/calendar", optionalAuth, browserCache(60), async (req, res) => {
  try {
    const month = typeof req.query.month === "string" && /^\d{4}-\d{2}$/.test(req.query.month) ? req.query.month : todayUtc().slice(0, 7);
    if (Number(month.slice(5, 7)) < 1 || Number(month.slice(5, 7)) > 12) {
      res.status(400).json({ error: "Bad month" });
      return;
    }
    res.json(await calendarMonth(month, req.user?.userId ?? null));
  } catch (err) {
    console.error("GET /api/contests/daily/calendar error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * Enter today's contest. Idempotent: the workspace calls it every time the
 * day's problem is opened, and only the first call starts the clock. A past day
 * cannot be entered — its board is closed.
 */
router.post("/daily/:date/enter", requireAuth, async (req, res) => {
  try {
    const date = String(req.params.date);
    if (!isValidDay(date) || date !== todayUtc()) {
      res.status(409).json({ error: "That contest is not open" });
      return;
    }
    const contest = await ensureContest(date);
    if (!contest) {
      res.status(404).json({ error: "No contest today" });
      return;
    }
    const entry = await enterContest(req.user!.userId, contest);
    // The dashboard's contest band shows whether today is entered.
    invalidateDashboard(req.user!.userId);
    res.json({ contest: { id: contest.id, date: contest.date, difficulty: contest.difficulty, problem: contest.problem }, entry });
  } catch (err) {
    console.error("POST /api/contests/daily/:date/enter error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

/** A day's board: the problem, its solvers fastest first, and the reader's line. */
router.get("/daily/:date", optionalAuth, browserCache(30), async (req, res) => {
  try {
    const date = String(req.params.date);
    if (!isValidDay(date)) {
      res.status(400).json({ error: "Bad date" });
      return;
    }
    const contest = await ensureContest(date);
    if (!contest) {
      res.status(404).json({ error: "No contest on that day" });
      return;
    }
    const userId = req.user?.userId ?? null;
    const [board, me] = await Promise.all([dayBoard(contest.id), userId ? myDayStanding(contest.id, userId) : Promise.resolve(null)]);
    res.json({
      date,
      endsAt: endOfDay(date),
      open: date === todayUtc(),
      contest: { id: contest.id, date: contest.date, difficulty: contest.difficulty, problem: contest.problem },
      board,
      me,
    });
  } catch (err) {
    console.error("GET /api/contests/daily/:date error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

/** Season standings — this month or all time — and where the reader stands. */
router.get("/standings", optionalAuth, browserCache(30), async (req, res) => {
  try {
    const period = req.query.period === "all" ? "all" : "month";
    const month = typeof req.query.month === "string" && /^\d{4}-\d{2}$/.test(req.query.month) ? req.query.month : todayUtc().slice(0, 7);
    const userId = req.user?.userId ?? null;
    const [table, me] = await Promise.all([standings(period, month), userId ? myStanding(userId, period, month) : Promise.resolve(null)]);
    res.json({ period, month: period === "month" ? month : null, ...table, me });
  } catch (err) {
    console.error("GET /api/contests/standings error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;

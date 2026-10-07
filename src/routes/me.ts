import { Router } from "express";
import { isAdminEmail, requireAuth } from "../middleware/auth.js";
import { prisma } from "../lib/prisma.js";
import { isOwnerEmail } from "../lib/plans.js";
import { getCachedHeatmap, getSubmissionHistory, getPairingHistory, getDifficultyStats, getCachedRank, getDashboard, invalidateDashboard } from "../services/dashboard.js";
import { forgetPublicUser } from "../services/public-profile.js";
import { ensureBaseline, listNotifications, getUnreadCount, markAllRead } from "../services/notifications.js";
import { ME_SELECT, getMePayload, invalidateMe, meUserOf } from "../services/me.js";
import { ONBOARDING_SELECT, onboardingStateOf, parseOnboarding } from "../lib/onboarding.js";
import { setTarget } from "../services/readiness.js";
import { repickMissionToday } from "../services/mission.js";
import { hashPassword, passwordProblem, verifyPassword } from "../lib/passwords.js";
import { forgetSessions } from "../lib/session-revocation.js";
import { establishSession } from "../lib/auth-session.js";
import { USERNAME_RULE, readUsername } from "../lib/identity.js";
import { oauthCallbackUri } from "../lib/sites.js";
import { githubConnectUrl, readLinkResult } from "../lib/github.js";
import { GitHubLinkError, getGitHubCard, linkGitHub, unlinkGitHub } from "../services/github-connection.js";
import { ALL_LANGUAGES } from "../lib/driver-codegen.js";

const router = Router();

/**
 * Page and page size from the query string, bounded. `?limit=100000` used to
 * pull a whole history in one query and `?page=-3` reached Prisma as a
 * negative skip and 500ed.
 */
function pageArgs(query: Record<string, unknown>, defaultLimit: number): { page: number; limit: number } {
  const page = Math.max(1, parseInt(String(query["page"] ?? ""), 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(String(query["limit"] ?? ""), 10) || defaultLimit));
  return { page, limit };
}

// GET /api/me/heatmap — Contribution data for the last 365 days
router.get("/heatmap", requireAuth, async (req, res) => {
  try {
    res.json(await getCachedHeatmap(req.user!.userId));
  } catch (err) {
    console.error("GET /api/me/heatmap error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Username availability is GET /api/username-check (index.ts), which both
// clients call; the copy that used to live here under /me was never called.

// GET /api/me — returns current authenticated user
router.get("/", requireAuth, async (req, res) => {
  try {
    const userId = req.user!.userId;

    // The profile row and trends are cached (they change only on submissions and
    // profile edits). The unread badge is cached separately, with a hard expiry
    // and invalidation on every write, so it is right the moment a notification
    // lands without costing a COUNT per page load.
    const [payload, unreadNotifications] = await Promise.all([
      getMePayload(userId),
      // Fail-soft: a notification-subsystem problem must never break /api/me,
      // since the whole app treats a failed /api/me as "not logged in".
      getUnreadCount(userId).catch((err) => {
        console.error("GET /api/me getUnreadCount error:", err);
        return 0;
      }),
    ]);

    if (!payload) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    // Derived from the token's email, not cached with the payload: whether the
    // account menu shows "Admin" must not lag a change to ADMIN_EMAIL.
    // isOwner: the owner accounts (lib/plans.ts) — they bypass every quota
    // here, and the client lets them out of the duel room's anti-cheat
    // strikes (they test the arena with screenshots and copy/paste).
    res.json({ ...payload, unreadNotifications, isAdmin: isAdminEmail(req.user!.email), isOwner: isOwnerEmail(req.user!.email) });
  } catch (err) {
    console.error("GET /api/me error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});


// PATCH /api/me — updates current user profile
router.patch("/", requireAuth, async (req, res) => {
  const { 
    username, instituteName, avatar_url, name, 
    gender, location, birthday, website, 
    github, linkedin, twitter, readme,
    remindStreak, remindDailyKata, weeklyDigest, remindReviews,
  } = req.body;

  // Reminder switches: a boolean or absent. Anything else is a bad request
  // rather than a silently coerced "true".
  const flag = (value: unknown, field: string): boolean | undefined | { error: string } => {
    if (value === undefined) return undefined;
    if (typeof value !== "boolean") return { error: `${field} must be true or false.` };
    return value;
  };
  const flags = {
    remindStreak: flag(remindStreak, "remindStreak"),
    remindDailyKata: flag(remindDailyKata, "remindDailyKata"),
    weeklyDigest: flag(weeklyDigest, "weeklyDigest"),
    remindReviews: flag(remindReviews, "remindReviews"),
  };
  for (const value of Object.values(flags)) {
    if (value && typeof value === "object") {
      res.status(400).json({ error: value.error });
      return;
    }
  }
  const prefs = flags as Record<keyof typeof flags, boolean | undefined>;

  // Every field is optional, but a field that is sent has a shape. They used
  // to be written as received: a non-string `username` reached `.length` and
  // 500ed, an empty one was stored (and the *second* person to do that got
  // "already taken"), and the link fields accepted anything — including a
  // `javascript:` URL for the profile page to render.
  const text = (value: unknown, max: number, field: string): string | null | { error: string } => {
    if (value === undefined) return null;
    if (value === null) return "";
    if (typeof value !== "string") return { error: `${field} must be text.` };
    if (value.length > max) return { error: `${field} is limited to ${max} characters.` };
    return value.trim();
  };
  const link = (value: unknown, field: string): string | null | { error: string } => {
    const raw = text(value, 300, field);
    if (raw === null || typeof raw === "object" || raw === "") return raw;
    if (!/^https?:\/\/[^\s]+$/i.test(raw)) return { error: `${field} must be an http(s) link.` };
    return raw;
  };
  const fields = {
    username: text(username, 20, "Username"),
    instituteName: text(instituteName, 120, "Institute"),
    avatar_url: text(avatar_url, 2048, "Avatar"),
    name: text(name, 80, "Name"),
    gender: text(gender, 32, "Gender"),
    location: text(location, 120, "Location"),
    website: link(website, "Website"),
    github: link(github, "GitHub"),
    linkedin: link(linkedin, "LinkedIn"),
    twitter: link(twitter, "Twitter"),
    readme: text(readme, 20_000, "Readme"),
  };
  for (const value of Object.values(fields)) {
    if (value && typeof value === "object") {
      res.status(400).json({ error: value.error });
      return;
    }
  }
  const clean = fields as Record<keyof typeof fields, string | null>;
  // Only an http(s) URL or a bundled avatar path may be an avatar. The path
  // branch must not start with "//": a protocol-relative URL is a foreign
  // host, and every viewer of the profile fetched from it (QA-024).
  if (clean.avatar_url && !/^(https?:\/\/[^\s]+|\/(?!\/)[^\s]*)$/i.test(clean.avatar_url)) {
    res.status(400).json({ error: "Avatar must be a link." });
    return;
  }

  // 1. Strict Username Validation — the registration rule (lib/identity.ts).
  if (clean.username !== null) {
    const handle = readUsername(clean.username);
    if (handle && typeof handle === "object") {
      res.status(400).json({ error: handle.error });
      return;
    }
    if (!handle) {
      res.status(400).json({ error: USERNAME_RULE });
      return;
    }
    clean.username = handle;

    // 2. Explicit Uniqueness Check
    const existingUser = await prisma.user.findFirst({
      where: {
        username: { equals: clean.username },
        id: { not: req.user!.userId }
      },
      select: { id: true },
    });
    if (existingUser) {
      res.status(400).json({ error: "Username is already taken." });
      return;
    }
  }

  try {
    const or = (value: string | null) => (value === null ? undefined : value);

    // A birthday is a date that has happened, and not too long ago: the
    // column took any parseable date, so the year 2999 and the year 0001
    // were both stored (QA-025). Unparseable text still clears the field —
    // that is how the form removes one.
    let birthdayValue: Date | null | undefined = undefined;
    if (birthday !== undefined) {
      const parsed = typeof birthday === "string" && birthday ? new Date(birthday) : null;
      if (parsed && !isNaN(parsed.getTime())) {
        const now = new Date();
        const oldest = new Date(now.getFullYear() - 120, now.getMonth(), now.getDate());
        if (parsed > now || parsed < oldest) {
          res.status(400).json({ error: "Birthday must be a date in the past (within the last 120 years)." });
          return;
        }
        birthdayValue = parsed;
      } else {
        birthdayValue = null;
      }
    }
    const updatedUser = await prisma.user.update({
      where: { id: req.user!.userId },
      data: {
        username: or(clean.username),
        instituteName: or(clean.instituteName),
        avatar_url: or(clean.avatar_url),
        name: or(clean.name),
        gender: or(clean.gender),
        location: or(clean.location),
        birthday: birthdayValue,
        website: or(clean.website),
        github: or(clean.github),
        linkedin: or(clean.linkedin),
        twitter: or(clean.twitter),
        readme: or(clean.readme),
        remindStreak: prefs.remindStreak,
        remindDailyKata: prefs.remindDailyKata,
        weeklyDigest: prefs.weeklyDigest,
        remindReviews: prefs.remindReviews,
      },
      // The response used to be the row as Prisma returned it, which put the
      // password hash and the session-revocation stamp in the browser's
      // Redux store after every profile save.
      select: ME_SELECT,
    });

    // The profile just changed — drop the cached /api/me so the next read
    // reflects it instead of serving the pre-edit copy for the TTL. The
    // dashboard carries its own copy of the name and avatar and preferred it,
    // so the hero kept the old identity for up to five minutes.
    invalidateMe(req.user!.userId);
    invalidateDashboard(req.user!.userId);
    // …and /u/<username> holds the identity for a minute, under the old name
    // too when this was a rename (dropped by account, so the old name is not
    // needed here).
    forgetPublicUser(req.user!.userId);

    // Shaped like GET /api/me's user (`onboarding`, not the four columns):
    // the profile page replaces the session user with this answer.
    res.json(meUserOf(updatedUser));
  } catch (err: any) {
    console.error("PATCH /api/me error:", err);
    if (err.code === "P2002") {
      res.status(400).json({ error: "Username already taken." });
      return;
    }
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * PUT /api/me/language — the judge language the editors open in, saved when
 * one is picked on a problem or in a duel (User.preferredLanguage), so it
 * follows the account to another device.
 *
 * Its own route rather than a PATCH /api/me field: a profile save drops the
 * cached dashboard and public profile too, and a language switch changes
 * neither — only the /api/me payload that carries it.
 */
router.put("/language", requireAuth, async (req, res) => {
  const language = req.body?.language;
  if (typeof language !== "string" || !(ALL_LANGUAGES as readonly string[]).includes(language)) {
    res.status(400).json({ error: `language must be one of: ${ALL_LANGUAGES.join(", ")}.` });
    return;
  }
  await prisma.user.update({ where: { id: req.user!.userId }, data: { preferredLanguage: language } });
  invalidateMe(req.user!.userId);
  res.json({ preferredLanguage: language });
});

/**
 * PUT /api/me/onboarding — what the account is preparing for (lib/onboarding):
 * `{ skip: true }`, or `{ goal, level?, details? }`. Asked by /welcome after
 * sign-up, by the dashboard's prompt line for older accounts, and from the
 * profile's goal setting — all three through this one write.
 *
 * A skip stamps `onboardedAt` and nothing else, so the question is not asked
 * again and a goal set earlier (a member dismissing the prompt after
 * answering on another device) survives. An answer writes goal, level,
 * details and the stamp in one update — four columns of one row, so there is
 * no half-saved answer to reason about. Details are `parseOnboarding`'s,
 * already reduced to what the goal uses (a language goal keeps no companies).
 *
 * A language goal that names a language also makes it the editors' language
 * (`preferredLanguage`, what PUT /language sets): someone learning Java should
 * not open their first problem in JavaScript. GOAL_LANGUAGES are judge ids,
 * so the value is one the editors know. It is echoed only when it was set, so
 * the client leaves the session copy alone otherwise.
 *
 * Then the dashboard and /api/me are dropped together (invalidateDashboard):
 * the plan, "Up next" and the `onboarding` field all moved.
 *
 * A company goal can carry `driveDate` (YYYY-MM-DD): the first company and
 * that date are saved as the placement target, echoed as `target` so the
 * client's session copy has it. Without one, the first company is still the
 * implicit target readiness and the mission read (lib/onboarding
 * implicitTargetCompany).
 */
router.put("/onboarding", requireAuth, async (req, res) => {
  const parsed = parseOnboarding(req.body);
  if (!parsed.ok) {
    res.status(400).json({ error: parsed.error });
    return;
  }
  const userId = req.user!.userId;
  const input = parsed.value;
  const language = !input.skip && input.goal === "language" ? input.details.language : undefined;

  const row = await prisma.user.update({
    where: { id: userId },
    data: input.skip
      ? { onboardedAt: new Date() }
      : {
          goal: input.goal,
          level: input.level,
          goalDetails: { ...input.details },
          onboardedAt: new Date(),
          ...(language ? { preferredLanguage: language } : {}),
        },
    select: { ...ONBOARDING_SELECT, preferredLanguage: true },
  });
  // A drive date given here saves the placement target (the first company and
  // the date) the way /readiness does — validated and its caches dropped by
  // setTarget — and today's undone mission items are re-picked for it.
  let target: { company: string; date: string } | null = null;
  if (!input.skip && input.driveDate && input.details.companies?.length) {
    target = { company: input.details.companies[0]!, date: input.driveDate.toISOString().slice(0, 10) };
    await setTarget(userId, target);
    await repickMissionToday(userId);
  }
  invalidateDashboard(userId);

  res.json({
    onboarding: onboardingStateOf(row),
    ...(language ? { preferredLanguage: row.preferredLanguage } : {}),
    ...(target ? { target } : {}),
  });
});

/**
 * POST /api/me/password — change the password while signed in.
 *
 * Under /api/me rather than /api/auth on purpose: /api/auth is exempt from
 * the platform guard, and a route that trusts the `__session` cookie there
 * would be reachable from a cross-site form. Here the guard's custom headers
 * force a preflight, which CORS refuses for any other origin.
 *
 * The current password is required even though the caller is signed in — a
 * session left open on a shared machine must not be enough to set a new
 * one. Every other session is ended, the way a reset does, and this one is
 * re-issued so the person who made the change stays signed in.
 *
 * An account with no password (a social sign-in) cannot set one here for the
 * same reason: that would turn any stolen session into a permanent
 * credential. "Forgot password" proves the inbox first.
 */
router.post("/password", requireAuth, async (req, res) => {
  const body = req.body && typeof req.body === "object" ? (req.body as Record<string, unknown>) : {};
  const currentPassword = body["currentPassword"];
  const newPassword = body["newPassword"];

  if (typeof currentPassword !== "string" || !currentPassword) {
    res.status(400).json({ error: "Enter your current password." });
    return;
  }
  const weak = passwordProblem(newPassword);
  if (weak) {
    res.status(400).json({ error: weak });
    return;
  }
  if (newPassword === currentPassword) {
    res.status(400).json({ error: "Choose a password you have not used here before." });
    return;
  }

  const user = await prisma.user.findUnique({
    where: { id: req.user!.userId },
    select: { id: true, email: true, password_hash: true },
  });
  if (!user) {
    res.status(404).json({ error: "Account not found." });
    return;
  }
  if (!user.password_hash) {
    res.status(400).json({ error: 'This account has no password yet. Use "Forgot password" on the sign-in page to set one.' });
    return;
  }
  if (!(await verifyPassword(currentPassword, user.password_hash))) {
    res.status(401).json({ error: "The current password is not right." });
    return;
  }

  // The stamp is floored to the second because a JWT's `iat` is whole
  // seconds: stamped at 12:00:00.500, a replacement token minted at
  // 12:00:00 would read as older than the stamp and be refused on its first
  // use. Flooring lets the token minted below survive; the price is that a
  // token minted earlier in this same second survives too, which is nobody.
  const stamp = new Date(Math.floor(Date.now() / 1000) * 1000);
  await prisma.user.update({
    where: { id: user.id },
    data: { password_hash: await hashPassword(newPassword as string), sessionsValidFrom: stamp },
    select: { id: true },
  });
  forgetSessions(user.id);
  const token = establishSession(res, user);

  res.json({ message: "Password updated. Other devices have been signed out.", token });
});

// GET /api/me/submissions/:id?type=problem|bug — the code of ONE submission,
// fetched on demand when a history row is opened (rows themselves are slim).
router.get("/submissions/:id", requireAuth, async (req, res) => {
  try {
    const userId = req.user!.userId;
    const id = String(req.params.id);
    if (req.query.type === "bug") {
      const sub = await prisma.bugSubmission.findFirst({ where: { id, userId }, select: { editedFiles: true } });
      if (!sub) {
        res.status(404).json({ error: "Submission not found" });
        return;
      }
      res.json({ code: JSON.stringify(sub.editedFiles, null, 2), language: "json" });
      return;
    }
    const sub = await prisma.submission.findFirst({ where: { id, userId }, select: { code: true, language: true } });
    if (!sub) {
      res.status(404).json({ error: "Submission not found" });
      return;
    }
    res.json({ code: sub.code, language: sub.language });
  } catch (err) {
    console.error("GET /api/me/submissions/:id error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/me/submissions — detailed history of all attempts
router.get("/submissions", requireAuth, async (req, res) => {
  try {
    const { page, limit } = pageArgs(req.query, 10);
    res.json(await getSubmissionHistory(req.user!.userId, page, limit));
  } catch (err) {
    console.error("GET /api/me/submissions error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/me/pairing-history — returns sessions where the user was a participant (paginated)
router.get("/pairing-history", requireAuth, async (req, res) => {
  try {
    const { page, limit } = pageArgs(req.query, 10);
    res.json(await getPairingHistory(req.user!.userId, page, limit));
  } catch (err) {
    console.error("GET /api/me/pairing-history error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/me/difficulty-stats — returns counts of solved, attempted, and total problems per difficulty
router.get("/difficulty-stats", requireAuth, async (req, res) => {
  try {
    res.json(await getDifficultyStats(req.user!.userId));
  } catch (err) {
    console.error("GET /api/me/difficulty-stats error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/me/rank?type=combined|questions|bugs — cached per (user, board), see getCachedRank
router.get("/rank", requireAuth, async (req, res) => {
  try {
    const { type = "combined" } = req.query;
    res.json(await getCachedRank(req.user!.userId, String(type)));
  } catch (err) {
    console.error("GET /api/me/rank error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/me/notifications — the bell dropdown payload
router.get("/notifications", requireAuth, async (req, res) => {
  try {
    const userId = req.user!.userId;
    // Backfill welcome/first-solve for accounts that predate notifications
    await ensureBaseline(userId);
    const [notifications, unreadCount] = await Promise.all([
      listNotifications(userId),
      getUnreadCount(userId),
    ]);
    res.json({ notifications, unreadCount });
  } catch (err) {
    console.error("GET /api/me/notifications error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/me/notifications/read — mark everything read
router.post("/notifications/read", requireAuth, async (req, res) => {
  try {
    await markAllRead(req.user!.userId);
    res.json({ unreadCount: 0 });
  } catch (err) {
    console.error("POST /api/me/notifications/read error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ── GitHub on the profile (services/github-connection.ts) ────────────
// Under /api/me rather than /api/auth for the reason /password is: these act
// on the signed-in account, so they sit behind the platform guard and the
// Bearer session, never a cookie a cross-site page could ride.

// GET /api/me/github — the profile's GitHub card: the connection and its activity
router.get("/github", requireAuth, async (req, res) => {
  res.json(await getGitHubCard(req.user!.userId));
});

// POST /api/me/github/connect — { url }: where to send the browser to prove a GitHub account
router.post("/github/connect", requireAuth, (req, res) => {
  const url = githubConnectUrl(oauthCallbackUri(req, "github"), req.user!.userId);
  if (!url) {
    res.status(503).json({ error: "Connecting GitHub is not available right now." });
    return;
  }
  res.json({ url });
});

// POST /api/me/github/complete — { code }: the ticket the callback put on /profile?github=
router.post("/github/complete", requireAuth, async (req, res) => {
  const code = (req.body as { code?: unknown } | undefined)?.code;
  const result = typeof code === "string" ? readLinkResult(code) : null;
  if (!result) {
    res.status(400).json({ error: "That GitHub link has expired. Connect again from your profile." });
    return;
  }
  // The ticket names the account that started the connect; only that
  // account's own session may apply it (lib/github.ts says why).
  if (result.userId !== req.user!.userId) {
    res.status(403).json({ error: "This GitHub link was started from a different CodeKairo account. Connect again from your profile." });
    return;
  }
  try {
    res.json(await linkGitHub(result.userId, result.githubId, result.login));
  } catch (err) {
    if (err instanceof GitHubLinkError) {
      res.status(409).json({ error: err.message });
      return;
    }
    throw err;
  }
});

// DELETE /api/me/github — disconnect; answers with the card as it now stands
router.delete("/github", requireAuth, async (req, res) => {
  res.json(await unlinkGitHub(req.user!.userId));
});

// GET /api/me/dashboard — everything the dashboard home needs, in one round-trip
router.get("/dashboard", requireAuth, async (req, res) => {
  try {
    res.json(await getDashboard(req.user!.userId));
  } catch (err) {
    console.error("GET /api/me/dashboard error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;

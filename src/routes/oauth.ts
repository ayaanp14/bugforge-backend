import { Router, type Request, type Response } from "express";
import crypto from "node:crypto";
import { prisma } from "../lib/prisma.js";
import { WELCOME, createNotificationOnce } from "../services/notifications.js";
import {
  establishSession,
  generateUsername,
  fireRegistrationWebhook,
  readSessionToken,
  SESSION_COOKIE,
} from "../lib/auth-session.js";
import { asSite, oauthCallbackUri as callbackUri, siteUrl, type Site } from "../lib/sites.js";
import { issueHandoff } from "../lib/handoff-store.js";
import {
  loopbackUrl,
  parseDesktopSignIn,
  readDesktopSignIn,
  serializeDesktopSignIn,
  type DesktopSignIn,
} from "../lib/desktop-oauth.js";
import { welcomeNewAccount } from "../lib/auth-mail.js";
import { forgetSessions, isSessionRevoked } from "../lib/session-revocation.js";
import { isLinkState, linkResult, readLinkState } from "../lib/github.js";
import { invalidateDashboard } from "../services/dashboard.js";
import { forgetPublicUser } from "../services/public-profile.js";

/**
 * Social sign-in, ported off NextAuth.
 *
 * The SPA has no server of its own, so both OAuth dances — GitHub and Google —
 * run here as plain OAuth 2.0 authorization-code flows straight against the
 * providers (no Firebase, no SDK): the client secret never leaves the backend.
 * Both paths end the same way the password routes do: a `__session` cookie
 * holding an HS256 `{ userId, email }` JWT.
 *
 * The `intent` distinction is preserved from the old signIn callback —
 * "register" refuses an email that already exists, "login" refuses one that
 * does not — so the error banners on /login and /register keep working.
 */

const router = Router();

const GITHUB_ID = process.env["GITHUB_ID"];
const GITHUB_SECRET = process.env["GITHUB_SECRET"];
const GOOGLE_CLIENT_ID = process.env["GOOGLE_CLIENT_ID"];
const GOOGLE_CLIENT_SECRET = process.env["GOOGLE_CLIENT_SECRET"];

type Intent = "login" | "register";

const STATE_COOKIE = "oauth_state";
const INTENT_COOKIE = "auth_intent";
/** Which site started the sign-in (lib/sites `Site`), so it is the one the browser returns to. */
const SITE_COOKIE = "auth_site";
/** Set when the Windows app started it (lib/desktop-oauth.ts): its loopback port and challenge. */
const DESKTOP_COOKIE = "auth_desktop";

/**
 * State and intent only need to survive the round-trip to the provider.
 * SameSite=Lax is required rather than None: the callback is a top-level GET
 * navigation, which Lax allows, and Lax doesn't force Secure on plain-http
 * localhost.
 */
const HANDOFF_COOKIE = {
  httpOnly: true,
  secure: process.env["NODE_ENV"] === "production",
  sameSite: "lax",
  maxAge: 10 * 60 * 1000,
  path: "/",
} as const;

const asIntent = (value: unknown): Intent => (value === "register" ? "register" : "login");

/** Where the user lands after a failed social sign-in — on the site that started it. */
const failureUrl = (site: Site, intent: Intent, error: string) =>
  `${siteUrl(site)}/${intent === "register" ? "register" : "login"}?error=${error}`;

/**
 * Where the browser lands after a successful one.
 *
 * The SPA cannot read the `__session` cookie the API just set — different
 * origin in production — so it has to be handed the token. It used to be
 * handed the token itself in the URL; now it gets a one-minute, single-use
 * code and exchanges it at POST /api/auth/handoff (lib/handoff-store.ts), so
 * the credential never sits in history or a request log.
 */
function handoffUrl(site: Site, token: string): string {
  const claims = readSessionToken(token);
  if (!claims) throw new Error("freshly minted session token did not verify");
  const code = issueHandoff({ id: claims.userId, email: claims.email || null }, claims);
  return `${siteUrl(site)}/auth/callback?code=${encodeURIComponent(code)}`;
}

/**
 * Issue the CSRF state and remember the intent, the starting site and - for
 * the Windows app - its loopback, for the callback leg. A sign-in the site
 * starts clears any desktop cookie an abandoned app sign-in left in this
 * browser, or that sign-in would end at the app instead of the page.
 */
function beginHandoff(res: Response, intent: Intent, site: Site, desktop: DesktopSignIn | null): string {
  const state = crypto.randomBytes(16).toString("hex");
  res.cookie(STATE_COOKIE, state, HANDOFF_COOKIE);
  res.cookie(INTENT_COOKIE, intent, HANDOFF_COOKIE);
  res.cookie(SITE_COOKIE, site, HANDOFF_COOKIE);
  if (desktop) res.cookie(DESKTOP_COOKIE, serializeDesktopSignIn(desktop), HANDOFF_COOKIE);
  else res.clearCookie(DESKTOP_COOKIE, { path: "/" });
  return state;
}

/**
 * The Windows app's loopback port and challenge, when the start URL carries
 * them. `invalid` when it tried and got them wrong: that is refused rather
 * than quietly turned into a sign-in on the site the app would never hear of.
 */
function desktopStart(req: Request): { desktop: DesktopSignIn | null; invalid: boolean } {
  const port = req.query["desktop_port"];
  const challenge = req.query["desktop_challenge"];
  if (port === undefined && challenge === undefined) return { desktop: null, invalid: false };
  const desktop = parseDesktopSignIn(port, challenge);
  return { desktop, invalid: desktop === null };
}

function refuseDesktopStart(res: Response): void {
  res.status(400).type("text/plain").send("This sign-in link from the CodeKairo app is not valid. Start again from the app.");
}

/** What the start leg left for the callback, read once and cleared. */
interface CallbackContext {
  intent: Intent;
  site: Site;
  expectedState: string | undefined;
  desktop: DesktopSignIn | null;
}

function takeHandoffCookies(req: Request, res: Response): CallbackContext {
  const cookies = req.cookies as Record<string, string | undefined> | undefined;
  const context: CallbackContext = {
    intent: asIntent(cookies?.[INTENT_COOKIE]),
    site: asSite(cookies?.[SITE_COOKIE]),
    expectedState: cookies?.[STATE_COOKIE],
    desktop: readDesktopSignIn(cookies?.[DESKTOP_COOKIE]),
  };
  for (const name of [STATE_COOKIE, INTENT_COOKIE, SITE_COOKIE, DESKTOP_COOKIE]) res.clearCookie(name, { path: "/" });
  return context;
}

/** A failed sign-in goes back where it started: the site's form, or the app's listener. */
const failTo = (context: CallbackContext, error: string): string =>
  context.desktop ? loopbackUrl(context.desktop, { error }) : failureUrl(context.site, context.intent, error);

/**
 * A signed-in account, handed to whoever started: the site gets the cookie
 * and a code for /auth/callback; the app gets no cookie (the session is the
 * app's, not this browser's) and a code only its verifier can spend.
 */
async function finishSignIn(res: Response, context: CallbackContext, record: SocialUserRecord): Promise<string> {
  if (!context.desktop) return handoffUrl(context.site, await establishSession(res, record));
  const token = await establishSession(res, record, { cookie: false });
  const claims = readSessionToken(token);
  if (!claims) throw new Error("freshly minted session token did not verify");
  const code = issueHandoff({ id: claims.userId, email: claims.email || null }, claims, context.desktop.challenge);
  return loopbackUrl(context.desktop, { code });
}

// GET /api/auth/github - start the OAuth dance
router.get("/github", (req, res) => {
  const { desktop, invalid } = desktopStart(req);
  if (invalid) {
    refuseDesktopStart(res);
    return;
  }
  if (!GITHUB_ID || !GITHUB_SECRET) {
    res.redirect(desktop ? loopbackUrl(desktop, { error: "oauth_failed" }) : failureUrl(asSite(req.query["return"]), "login", "oauth_failed"));
    return;
  }

  const intent = asIntent(req.query["intent"]);
  const state = beginHandoff(res, intent, asSite(req.query["return"]), desktop);

  const authorize = new URL("https://github.com/login/oauth/authorize");
  authorize.searchParams.set("client_id", GITHUB_ID);
  authorize.searchParams.set("redirect_uri", callbackUri(req, "github"));
  authorize.searchParams.set("scope", "read:user user:email");
  authorize.searchParams.set("state", state);

  res.redirect(authorize.toString());
});

/** The authorization code for an access token, or null (logged) when GitHub refuses it. */
async function exchangeGitHubCode(code: string, redirectUri: string): Promise<string | null> {
  const tokenRes = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({
      client_id: GITHUB_ID,
      client_secret: GITHUB_SECRET,
      code,
      redirect_uri: redirectUri,
    }),
  });
  const tokenData = (await tokenRes.json()) as {
    access_token?: string;
    token_type?: string;
    scope?: string;
    error?: string;
  };
  if (!tokenData.access_token) {
    console.error("[auth] GitHub token exchange failed:", tokenData.error);
    return null;
  }
  return tokenData.access_token;
}

const githubHeaders = (accessToken: string) => ({
  Authorization: `Bearer ${accessToken}`,
  Accept: "application/vnd.github+json",
  "User-Agent": "CodeKairo",
});

/**
 * The callback leg of connecting a GitHub account to a profile (started by
 * POST /api/me/github/connect). It signs nobody in and links nothing: it
 * learns which GitHub account approved, and hands /profile a signed ticket
 * naming it, which the page posts back under its own session
 * (POST /api/me/github/complete). lib/github.ts says why the link cannot
 * be made here. The user's GitHub token is used for the one /user call and
 * dropped.
 */
async function finishGitHubConnect(req: Request, res: Response, state: string): Promise<void> {
  const back = (query: string) => res.redirect(`${siteUrl("main")}/profile?${query}`);
  const started = readLinkState(state);
  if (!started) return back("github_error=expired");
  // "Cancel" on GitHub's consent screen.
  if (typeof req.query["error"] === "string") return back("github_error=denied");
  const code = typeof req.query["code"] === "string" ? req.query["code"] : null;
  if (!code || !GITHUB_ID || !GITHUB_SECRET) return back("github_error=failed");

  try {
    const accessToken = await exchangeGitHubCode(code, callbackUri(req, "github"));
    if (!accessToken) return back("github_error=failed");
    const profileRes = await fetch("https://api.github.com/user", { headers: githubHeaders(accessToken) });
    if (!profileRes.ok) return back("github_error=failed");
    const profile = (await profileRes.json()) as { id?: unknown; login?: unknown };
    if (typeof profile.id !== "number" || typeof profile.login !== "string") return back("github_error=failed");
    back(`github=${encodeURIComponent(linkResult(started.userId, String(profile.id), profile.login))}`);
  } catch (err) {
    console.error("[auth] GitHub connect callback error:", err);
    back("github_error=failed");
  }
}

// GET /api/auth/github/callback - exchange the code and sign the user in
router.get("/github/callback", async (req, res) => {
  // The connect flow shares this callback (so the OAuth app needs no second
  // URL) and is told apart by its state, which is signed and names the
  // account connecting — none of the sign-in cookies below are involved.
  const incomingState = typeof req.query["state"] === "string" ? req.query["state"] : "";
  if (isLinkState(incomingState)) {
    await finishGitHubConnect(req, res, incomingState);
    return;
  }

  const context = takeHandoffCookies(req, res);
  const { expectedState } = context;

  const code = typeof req.query["code"] === "string" ? req.query["code"] : null;
  const state = typeof req.query["state"] === "string" ? req.query["state"] : null;

  // CSRF: the state we issued must come back untouched.
  if (!code || !state || !expectedState || state !== expectedState) {
    res.redirect(failTo(context, "oauth_failed"));
    return;
  }

  try {
    const accessToken = await exchangeGitHubCode(code, callbackUri(req, "github"));
    if (!accessToken) {
      res.redirect(failTo(context, "oauth_failed"));
      return;
    }

    const ghHeaders = githubHeaders(accessToken);

    const profileRes = await fetch("https://api.github.com/user", { headers: ghHeaders });
    if (!profileRes.ok) {
      res.redirect(failTo(context, "oauth_failed"));
      return;
    }
    const profile = (await profileRes.json()) as {
      id: number;
      login: string;
      name?: string | null;
      email?: string | null;
      avatar_url?: string | null;
    };

    // The address comes from /user/emails, never from the profile's public
    // email field. Sign-in links to an existing account by address, so the
    // address has to be one GitHub has verified belongs to this person; the
    // profile field used to be trusted as-is, and whatever GitHub's own rules
    // about it are, they are not ours to rely on. The profile's public
    // address is preferred when it is among the verified ones, else the
    // primary, else any verified one.
    let email: string | null = null;
    const emailsRes = await fetch("https://api.github.com/user/emails", { headers: ghHeaders });
    if (emailsRes.ok) {
      const emails = ((await emailsRes.json()) as { email: string; primary: boolean; verified: boolean }[]).filter(
        (e) => e.verified && typeof e.email === "string",
      );
      const publicAddress = profile.email?.trim().toLowerCase() ?? null;
      email =
        emails.find((e) => publicAddress && e.email.toLowerCase() === publicAddress)?.email ??
        emails.find((e) => e.primary)?.email ??
        emails[0]?.email ??
        null;
    }

    if (!email) {
      console.warn("[auth] GitHub identity with no verified email refused");
      res.redirect(failTo(context, "oauth_failed"));
      return;
    }

    const result = await upsertSocialUser({
      email: email.trim().toLowerCase(),
      intent: context.intent,
      name: profile.name ?? profile.login,
      avatarUrl: profile.avatar_url ?? null,
      provider: "github",
      providerAccountId: String(profile.id),
      accountType: "oauth",
    });

    if ("error" in result) {
      res.redirect(failTo(context, result.error));
      return;
    }

    res.redirect(await finishSignIn(res, context, result.record));
  } catch (err) {
    console.error("[auth] GitHub callback error:", err);
    res.redirect(failTo(context, "oauth_failed"));
  }
});

// GET /api/auth/google - start the OAuth dance
router.get("/google", (req, res) => {
  const { desktop, invalid } = desktopStart(req);
  if (invalid) {
    refuseDesktopStart(res);
    return;
  }
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
    console.error("[auth] GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET are not configured");
    res.redirect(desktop ? loopbackUrl(desktop, { error: "oauth_failed" }) : failureUrl(asSite(req.query["return"]), "login", "oauth_failed"));
    return;
  }

  const intent = asIntent(req.query["intent"]);
  const state = beginHandoff(res, intent, asSite(req.query["return"]), desktop);

  const authorize = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  authorize.searchParams.set("client_id", GOOGLE_CLIENT_ID);
  authorize.searchParams.set("redirect_uri", callbackUri(req, "google"));
  authorize.searchParams.set("response_type", "code");
  authorize.searchParams.set("scope", "openid email profile");
  authorize.searchParams.set("state", state);
  // Always let the user pick the account, the way the old popup did.
  authorize.searchParams.set("prompt", "select_account");
  authorize.searchParams.set("include_granted_scopes", "true");

  res.redirect(authorize.toString());
});

// GET /api/auth/google/callback - exchange the code and sign the user in
router.get("/google/callback", async (req, res) => {
  const context = takeHandoffCookies(req, res);
  const { expectedState } = context;

  // The user pressed "Cancel" on Google's consent screen.
  if (typeof req.query["error"] === "string") {
    res.redirect(failTo(context, "oauth_failed"));
    return;
  }

  const code = typeof req.query["code"] === "string" ? req.query["code"] : null;
  const state = typeof req.query["state"] === "string" ? req.query["state"] : null;

  // CSRF: the state we issued must come back untouched.
  if (!code || !state || !expectedState || state !== expectedState) {
    res.redirect(failTo(context, "oauth_failed"));
    return;
  }

  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
    res.redirect(failTo(context, "oauth_failed"));
    return;
  }

  try {
    // Google's token endpoint takes form-encoded params, not JSON.
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" },
      body: new URLSearchParams({
        code,
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        redirect_uri: callbackUri(req, "google"),
        grant_type: "authorization_code",
      }).toString(),
    });
    const tokenData = (await tokenRes.json()) as {
      access_token?: string;
      id_token?: string;
      refresh_token?: string;
      expires_in?: number;
      token_type?: string;
      scope?: string;
      error?: string;
      error_description?: string;
    };

    const accessToken = tokenData.access_token;
    if (!tokenRes.ok || !accessToken) {
      console.error(
        "[auth] Google token exchange failed:",
        tokenData.error_description ?? tokenData.error,
      );
      res.redirect(failTo(context, "oauth_failed"));
      return;
    }

    // The profile comes straight from Google over TLS, fetched with the token
    // we just exchanged, so it needs no signature check of its own.
    const profileRes = await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
      headers: { Authorization: `Bearer ${accessToken}`, Accept: "application/json" },
    });
    if (!profileRes.ok) {
      console.error("[auth] Google userinfo failed:", profileRes.status);
      res.redirect(failTo(context, "oauth_failed"));
      return;
    }
    const profile = (await profileRes.json()) as {
      sub: string;
      email?: string;
      email_verified?: boolean;
      name?: string;
      picture?: string;
    };

    if (!profile.email) {
      res.redirect(failTo(context, "oauth_failed"));
      return;
    }
    // A Google identity is only trusted for an address Google has verified.
    // Sign-in links to an existing account by email, so an unverified one
    // (a Workspace account whose owner never confirmed it, a typo'd alias)
    // could otherwise claim a password account it does not own. Absent is
    // refused too: the claim is what the link rests on, not a default.
    if (profile.email_verified !== true) {
      console.warn("[auth] Google identity with unverified email refused");
      res.redirect(failTo(context, "oauth_failed"));
      return;
    }

    // Google sign-in auto-registers: there is no "not_registered" case here,
    // matching how the old popup behaved.
    const result = await upsertSocialUser({
      email: profile.email.trim().toLowerCase(),
      intent: "register-or-login",
      name: profile.name ?? null,
      avatarUrl: profile.picture ?? null,
      provider: "google",
      providerAccountId: profile.sub,
      accountType: "oidc",
    });

    if ("error" in result) {
      res.redirect(failTo(context, result.error));
      return;
    }

    res.redirect(await finishSignIn(res, context, result.record));
  } catch (err) {
    console.error("[auth] Google callback error:", err);
    res.redirect(failTo(context, "oauth_failed"));
  }
});

/**
 * GET /api/auth/session-token
 *
 * Hands the SPA the raw JWT behind its httpOnly `__session` cookie, so it can
 * store it and send `Authorization: Bearer` on cross-domain API calls (static
 * frontend on one host, API on another, where the cookie may not ride along).
 *
 * Replaces the old Next route of the same name. It only echoes a cookie the
 * browser already holds after verifying it — it never mints a new session.
 *
 * "No session" is answered with 200 `{ token: null }`, not 401. This is a
 * query, not a gate: the SPA probes it from every protected page (and the
 * 404 page) a signed-out visitor lands on, reads the body, and treats null as
 * "nobody is signed in". The 401 it used to send added nothing the body did
 * not say, but Chrome reports every non-2xx fetch as a red "Failed to load
 * resource" console error, so each such visit looked like a broken site.
 */
router.get("/session-token", async (req, res) => {
  const token = (req.cookies as Record<string, string | undefined>)?.[SESSION_COOKIE];
  const claims = token ? readSessionToken(token) : null;
  // A revoked one too: a session a sign-in elsewhere replaced (or a password
  // reset ended) still sits in this browser's cookie, and handing it back
  // let the tab adopt it, fail /api/me, and bounce to sign-in in a loop.
  const live = claims !== null && !(await isSessionRevoked(claims.userId, claims.iat, claims.jti));
  res.json({ token: live ? token : null });
});

type UpsertArgs = {
  email: string;
  /** "register-or-login" auto-creates; the others enforce the old intent rules. */
  intent: Intent | "register-or-login";
  name: string | null;
  avatarUrl: string | null;
  provider: string;
  providerAccountId: string;
  accountType: string;
};

/** Fields every caller needs off the resolved user. */
type SocialUserRecord = {
  id: string;
  email: string | null;
  username: string | null;
  name: string | null;
  avatar_url: string | null;
};

/** The same fields, as a Prisma select, so no read here pulls the whole row. */
const SOCIAL_USER_SELECT = { id: true, email: true, username: true, name: true, avatar_url: true, emailVerified: true } as const;

type SocialUserResult =
  | { error: "account_exists" | "not_registered" }
  | { record: SocialUserRecord };

/**
 * Find-or-create the user behind a social identity and link the provider
 * account. Mirrors the old NextAuth signIn callback, intent guards included.
 */
async function upsertSocialUser(args: UpsertArgs): Promise<SocialUserResult> {
  let dbUser = await prisma.user.findUnique({ where: { email: args.email }, select: SOCIAL_USER_SELECT });

  if (args.intent === "register" && dbUser) {
    return { error: "account_exists" as const };
  }
  if (args.intent === "login" && !dbUser) {
    return { error: "not_registered" as const };
  }

  // Both providers only ever hand over an address they have verified (the
  // callbacks above refuse anything else), which is the same proof the
  // sign-up code asks for — so a social account is born verified, and a
  // password account that was still waiting on its code is verified by the
  // social sign-in that just matched it.
  if (!dbUser) {
    const username = await generateUsername(args.name || "user");
    dbUser = await prisma.user.create({
      data: {
        email: args.email,
        username,
        name: args.name,
        avatar_url: args.avatarUrl,
        provider: args.provider,
        emailVerified: new Date(),
      },
      select: SOCIAL_USER_SELECT,
    });

    void createNotificationOnce(dbUser.id, WELCOME);
    fireRegistrationWebhook(dbUser);
    welcomeNewAccount(dbUser, args.provider);
  } else {
    // A password account still waiting on its code, proven by this sign-in:
    // its first way in, so it is welcomed like a new one.
    const firstProof = !dbUser.emailVerified;
    const updateData: {
      name: string | null;
      avatar_url: string | null;
      username?: string;
      emailVerified?: Date;
      password_hash?: null;
      sessionsValidFrom?: Date;
    } = {
      name: args.name || dbUser.name,
      avatar_url: args.avatarUrl || dbUser.avatar_url,
    };
    if (!dbUser.username) {
      updateData.username = await generateUsername(args.name || "user");
    }
    if (firstProof) {
      updateData.emailVerified = new Date();
      // Whoever registered an address that was never confirmed chose the
      // password without proving they own it — and anyone can register any
      // address. Keeping that password here is account pre-hijacking: sign
      // up as victim@x with your own password, wait for the victim to sign
      // in with Google (which verifies the account), then sign in with the
      // password and share the account from then on. The provider has just
      // proven who owns the address, so its password goes; the owner can set
      // one with "Forgot password", which the login route already offers an
      // account without one. Anything signed in before this point is ended
      // with it — floored to the second, as /me/password does, so the token
      // minted below (whose `iat` is whole seconds) is not refused with them.
      updateData.password_hash = null;
      updateData.sessionsValidFrom = new Date(Math.floor(Date.now() / 1000) * 1000);
    }
    const before = dbUser;
    dbUser = await prisma.user.update({ where: { email: args.email }, data: updateData, select: SOCIAL_USER_SELECT });
    if (firstProof) {
      forgetSessions(dbUser.id);
      welcomeNewAccount(dbUser, args.provider);
    }
    // Every sign-in rewrites the name and avatar from the provider. When that
    // changed what the account shows — a new picture, a new name, a first
    // username — the cached /api/me and dashboard (which carry both) and the
    // public profile's identity would otherwise keep the old ones for their
    // TTL. An unchanged sign-in, the usual case, drops nothing.
    if (
      firstProof ||
      before.name !== dbUser.name ||
      before.avatar_url !== dbUser.avatar_url ||
      before.username !== dbUser.username
    ) {
      invalidateDashboard(dbUser.id);
      forgetPublicUser(dbUser.id);
    }
  }

  // The link row records that this provider identity belongs to this
  // account, and nothing more. The provider's access, refresh and id tokens
  // used to be stored on it too, though nothing ever read them back: they
  // were only ever a liability, sitting in plain text on a shared database
  // host. Since 2026-10-10 the columns are gone (prisma/sql/2026-10-10-drop-
  // dead-objects.sql), so no token can be stored here at all.
  try {
    await prisma.account.upsert({
      where: {
        provider_providerAccountId: {
          provider: args.provider,
          providerAccountId: args.providerAccountId,
        },
      },
      update: {},
      create: {
        userId: dbUser.id,
        type: args.accountType,
        provider: args.provider,
        providerAccountId: args.providerAccountId,
      },
    });
  } catch (err) {
    console.error("[auth] Account upsert error:", err);
  }

  return { record: dbUser };
}

export default router;

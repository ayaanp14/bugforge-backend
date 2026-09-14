import { Router } from "express";
import crypto from "node:crypto";
import { prisma } from "../lib/prisma.js";
import { WELCOME, createNotificationOnce } from "../services/notifications.js";
import {
  establishSession,
  generateUsername,
  fireRegistrationWebhook,
  verifySessionToken,
  readSessionToken,
  SESSION_COOKIE,
} from "../lib/auth-session.js";
import { issueHandoff } from "../lib/handoff-store.js";

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

const FRONTEND_URL = (process.env["FRONTEND_URL"] ?? "http://localhost:3000").replace(/\/+$/, "");
const GITHUB_ID = process.env["GITHUB_ID"];
const GITHUB_SECRET = process.env["GITHUB_SECRET"];
const GOOGLE_CLIENT_ID = process.env["GOOGLE_CLIENT_ID"];
const GOOGLE_CLIENT_SECRET = process.env["GOOGLE_CLIENT_SECRET"];

type Intent = "login" | "register";
type Provider = "github" | "google";

const STATE_COOKIE = "oauth_state";
const INTENT_COOKIE = "auth_intent";

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

/** Where the user lands after a failed social sign-in. */
const failureUrl = (intent: Intent, error: string) =>
  `${FRONTEND_URL}/${intent === "register" ? "register" : "login"}?error=${error}`;

/**
 * Where the browser lands after a successful one.
 *
 * The SPA cannot read the `__session` cookie the API just set — different
 * origin in production — so it has to be handed the token. It used to be
 * handed the token itself in the URL; now it gets a one-minute, single-use
 * code and exchanges it at POST /api/auth/handoff (lib/handoff-store.ts), so
 * the credential never sits in history or a request log.
 */
function handoffUrl(token: string): string {
  const claims = readSessionToken(token);
  if (!claims) throw new Error("freshly minted session token did not verify");
  const code = issueHandoff({ id: claims.userId, email: claims.email || null }, claims);
  return `${FRONTEND_URL}/auth/callback?code=${encodeURIComponent(code)}`;
}

/** Callback URL registered with the provider's OAuth app. */
function callbackUri(
  req: { protocol: string; get: (h: string) => string | undefined },
  provider: Provider,
): string {
  const base =
    process.env["BACKEND_PUBLIC_URL"] ?? `${req.protocol}://${req.get("host") ?? "localhost:3001"}`;
  return `${base.replace(/\/+$/, "")}/api/auth/${provider}/callback`;
}

/** Issue the CSRF state and remember the intent for the callback leg. */
function beginHandoff(
  res: { cookie: (name: string, value: string, options: object) => unknown },
  intent: Intent,
): string {
  const state = crypto.randomBytes(16).toString("hex");
  res.cookie(STATE_COOKIE, state, HANDOFF_COOKIE);
  res.cookie(INTENT_COOKIE, intent, HANDOFF_COOKIE);
  return state;
}

// GET /api/auth/github - start the OAuth dance
router.get("/github", (req, res) => {
  if (!GITHUB_ID || !GITHUB_SECRET) {
    res.redirect(failureUrl("login", "oauth_failed"));
    return;
  }

  const intent = asIntent(req.query["intent"]);
  const state = beginHandoff(res, intent);

  const authorize = new URL("https://github.com/login/oauth/authorize");
  authorize.searchParams.set("client_id", GITHUB_ID);
  authorize.searchParams.set("redirect_uri", callbackUri(req, "github"));
  authorize.searchParams.set("scope", "read:user user:email");
  authorize.searchParams.set("state", state);

  res.redirect(authorize.toString());
});

// GET /api/auth/github/callback - exchange the code and sign the user in
router.get("/github/callback", async (req, res) => {
  const intent = asIntent(req.cookies?.[INTENT_COOKIE]);
  const expectedState = req.cookies?.[STATE_COOKIE];

  res.clearCookie(STATE_COOKIE, { path: "/" });
  res.clearCookie(INTENT_COOKIE, { path: "/" });

  const code = typeof req.query["code"] === "string" ? req.query["code"] : null;
  const state = typeof req.query["state"] === "string" ? req.query["state"] : null;

  // CSRF: the state we issued must come back untouched.
  if (!code || !state || !expectedState || state !== expectedState) {
    res.redirect(failureUrl(intent, "oauth_failed"));
    return;
  }

  try {
    const tokenRes = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        client_id: GITHUB_ID,
        client_secret: GITHUB_SECRET,
        code,
        redirect_uri: callbackUri(req, "github"),
      }),
    });
    const tokenData = (await tokenRes.json()) as {
      access_token?: string;
      token_type?: string;
      scope?: string;
      error?: string;
    };

    const accessToken = tokenData.access_token;
    if (!accessToken) {
      console.error("[auth] GitHub token exchange failed:", tokenData.error);
      res.redirect(failureUrl(intent, "oauth_failed"));
      return;
    }

    const ghHeaders = {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/vnd.github+json",
      "User-Agent": "CodeKairo",
    };

    const profileRes = await fetch("https://api.github.com/user", { headers: ghHeaders });
    if (!profileRes.ok) {
      res.redirect(failureUrl(intent, "oauth_failed"));
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
      res.redirect(failureUrl(intent, "oauth_failed"));
      return;
    }

    const result = await upsertSocialUser({
      email: email.trim().toLowerCase(),
      intent,
      name: profile.name ?? profile.login,
      avatarUrl: profile.avatar_url ?? null,
      provider: "github",
      providerAccountId: String(profile.id),
      accountType: "oauth",
    });

    if ("error" in result) {
      res.redirect(failureUrl(intent, result.error));
      return;
    }

    res.redirect(handoffUrl(establishSession(res, result.record)));
  } catch (err) {
    console.error("[auth] GitHub callback error:", err);
    res.redirect(failureUrl(intent, "oauth_failed"));
  }
});

// GET /api/auth/google - start the OAuth dance
router.get("/google", (req, res) => {
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
    console.error("[auth] GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET are not configured");
    res.redirect(failureUrl("login", "oauth_failed"));
    return;
  }

  const intent = asIntent(req.query["intent"]);
  const state = beginHandoff(res, intent);

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
  const intent = asIntent(req.cookies?.[INTENT_COOKIE]);
  const expectedState = req.cookies?.[STATE_COOKIE];

  res.clearCookie(STATE_COOKIE, { path: "/" });
  res.clearCookie(INTENT_COOKIE, { path: "/" });

  // The user pressed "Cancel" on Google's consent screen.
  if (typeof req.query["error"] === "string") {
    res.redirect(failureUrl(intent, "oauth_failed"));
    return;
  }

  const code = typeof req.query["code"] === "string" ? req.query["code"] : null;
  const state = typeof req.query["state"] === "string" ? req.query["state"] : null;

  // CSRF: the state we issued must come back untouched.
  if (!code || !state || !expectedState || state !== expectedState) {
    res.redirect(failureUrl(intent, "oauth_failed"));
    return;
  }

  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
    res.redirect(failureUrl(intent, "oauth_failed"));
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
      res.redirect(failureUrl(intent, "oauth_failed"));
      return;
    }

    // The profile comes straight from Google over TLS, fetched with the token
    // we just exchanged, so it needs no signature check of its own.
    const profileRes = await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
      headers: { Authorization: `Bearer ${accessToken}`, Accept: "application/json" },
    });
    if (!profileRes.ok) {
      console.error("[auth] Google userinfo failed:", profileRes.status);
      res.redirect(failureUrl(intent, "oauth_failed"));
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
      res.redirect(failureUrl(intent, "oauth_failed"));
      return;
    }
    // A Google identity is only trusted for an address Google has verified.
    // Sign-in links to an existing account by email, so an unverified one
    // (a Workspace account whose owner never confirmed it, a typo'd alias)
    // could otherwise claim a password account it does not own.
    if (profile.email_verified === false) {
      console.warn("[auth] Google identity with unverified email refused");
      res.redirect(failureUrl(intent, "oauth_failed"));
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
      res.redirect(failureUrl(intent, result.error));
      return;
    }

    res.redirect(handoffUrl(establishSession(res, result.record)));
  } catch (err) {
    console.error("[auth] Google callback error:", err);
    res.redirect(failureUrl(intent, "oauth_failed"));
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
router.get("/session-token", (req, res) => {
  const token = (req.cookies as Record<string, string | undefined>)?.[SESSION_COOKIE];
  res.json({ token: token && verifySessionToken(token) ? token : null });
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
  } else {
    const updateData: { name: string | null; avatar_url: string | null; username?: string; emailVerified?: Date } = {
      name: args.name || dbUser.name,
      avatar_url: args.avatarUrl || dbUser.avatar_url,
    };
    if (!dbUser.username) {
      updateData.username = await generateUsername(args.name || "user");
    }
    if (!dbUser.emailVerified) updateData.emailVerified = new Date();
    dbUser = await prisma.user.update({ where: { email: args.email }, data: updateData, select: SOCIAL_USER_SELECT });
  }

  // The link row records that this provider identity belongs to this
  // account, and nothing more. The provider's access, refresh and id tokens
  // used to be stored on it too, though nothing ever read them back: they
  // were only ever a liability, sitting in plain text on a shared database
  // host. Rows written before this change still hold them — the backfill
  // script clears those.
  try {
    await prisma.account.upsert({
      where: {
        provider_providerAccountId: {
          provider: args.provider,
          providerAccountId: args.providerAccountId,
        },
      },
      update: { access_token: null, refresh_token: null, id_token: null, expires_at: null },
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

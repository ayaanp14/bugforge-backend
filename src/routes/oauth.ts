import { Router } from "express";
import crypto from "node:crypto";
import { prisma } from "../lib/prisma.js";
import { WELCOME, createNotificationOnce } from "../services/notifications.js";
import {
  establishSession,
  generateUsername,
  fireRegistrationWebhook,
  verifySessionToken,
  SESSION_COOKIE,
} from "../lib/auth-session.js";

/**
 * Social sign-in, ported off NextAuth.
 *
 * The SPA has no server of its own, so the GitHub OAuth dance and the Firebase
 * ID-token exchange both run here. Both paths end the same way the password
 * routes do: a `__session` cookie holding an HS256 `{ userId, email }` JWT.
 *
 * The `intent` distinction is preserved from the old signIn callback —
 * "register" refuses an email that already exists, "login" refuses one that
 * does not — so the error banners on /login and /register keep working.
 */

const router = Router();

const FRONTEND_URL = (process.env["FRONTEND_URL"] ?? "http://localhost:3000").replace(/\/+$/, "");
const GITHUB_ID = process.env["GITHUB_ID"];
const GITHUB_SECRET = process.env["GITHUB_SECRET"];
const FIREBASE_API_KEY =
  process.env["FIREBASE_API_KEY"] ?? process.env["NEXT_PUBLIC_FIREBASE_API_KEY"];

type Intent = "login" | "register";

const STATE_COOKIE = "gh_oauth_state";
const INTENT_COOKIE = "auth_intent";

/**
 * State and intent only need to survive the round-trip to GitHub. SameSite=Lax
 * is required rather than None: the callback is a top-level GET navigation, which
 * Lax allows, and Lax doesn't force Secure on plain-http localhost.
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

/** Callback URL registered with the GitHub OAuth app. */
function githubRedirectUri(req: { protocol: string; get: (h: string) => string | undefined }): string {
  const base =
    process.env["BACKEND_PUBLIC_URL"] ?? `${req.protocol}://${req.get("host") ?? "localhost:3001"}`;
  return `${base.replace(/\/+$/, "")}/api/auth/github/callback`;
}

// GET /api/auth/github - start the OAuth dance
router.get("/github", (req, res) => {
  if (!GITHUB_ID || !GITHUB_SECRET) {
    res.redirect(failureUrl("login", "oauth_failed"));
    return;
  }

  const intent = asIntent(req.query["intent"]);
  const state = crypto.randomBytes(16).toString("hex");

  res.cookie(STATE_COOKIE, state, HANDOFF_COOKIE);
  res.cookie(INTENT_COOKIE, intent, HANDOFF_COOKIE);

  const authorize = new URL("https://github.com/login/oauth/authorize");
  authorize.searchParams.set("client_id", GITHUB_ID);
  authorize.searchParams.set("redirect_uri", githubRedirectUri(req));
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
        redirect_uri: githubRedirectUri(req),
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
      "User-Agent": "Codexa",
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

    // GitHub omits the email from /user when it is private - ask explicitly.
    let email = profile.email ?? null;
    if (!email) {
      const emailsRes = await fetch("https://api.github.com/user/emails", { headers: ghHeaders });
      if (emailsRes.ok) {
        const emails = (await emailsRes.json()) as {
          email: string;
          primary: boolean;
          verified: boolean;
        }[];
        email =
          emails.find((e) => e.primary && e.verified)?.email ??
          emails.find((e) => e.verified)?.email ??
          null;
      }
    }

    if (!email) {
      res.redirect(failureUrl(intent, "oauth_failed"));
      return;
    }

    const result = await upsertSocialUser({
      email,
      intent,
      name: profile.name ?? profile.login,
      avatarUrl: profile.avatar_url ?? null,
      provider: "github",
      providerAccountId: String(profile.id),
      accountType: "oauth",
      tokens: {
        access_token: accessToken,
        token_type: tokenData.token_type ?? null,
        scope: tokenData.scope ?? null,
      },
    });

    if ("error" in result) {
      res.redirect(failureUrl(intent, result.error));
      return;
    }

    const token = establishSession(res, result.record);
    // Hand the token to the SPA's /auth/callback, which mirrors it into
    // localStorage — the cookie alone can't be read cross-domain.
    res.redirect(`${FRONTEND_URL}/auth/callback?token=${encodeURIComponent(token)}`);
  } catch (err) {
    console.error("[auth] GitHub callback error:", err);
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
 */
router.get("/session-token", (req, res) => {
  const token = (req.cookies as Record<string, string | undefined>)?.[SESSION_COOKIE];
  if (!token || !verifySessionToken(token)) {
    res.status(401).json({ token: null });
    return;
  }
  res.json({ token });
});

// POST /api/auth/firebase-google - verify a Firebase ID token from the popup
router.post("/firebase-google", async (req, res) => {
  const idToken = typeof req.body?.idToken === "string" ? req.body.idToken : null;
  if (!idToken || !FIREBASE_API_KEY) {
    res.status(400).json({ error: "oauth_failed" });
    return;
  }

  try {
    const lookupRes = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${FIREBASE_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken }),
      },
    );
    const lookup = (await lookupRes.json()) as {
      users?: {
        localId: string;
        email?: string;
        displayName?: string;
        photoUrl?: string;
        providerUserInfo?: { providerId: string; rawId?: string }[];
      }[];
      error?: { message?: string };
    };

    if (!lookupRes.ok) {
      console.error("[auth] Firebase token verification failed:", lookup.error?.message);
      res.status(401).json({ error: "oauth_failed" });
      return;
    }

    const fbUser = lookup.users?.[0];
    if (!fbUser?.email) {
      res.status(401).json({ error: "oauth_failed" });
      return;
    }

    const googleInfo = (fbUser.providerUserInfo ?? []).find((p) => p.providerId === "google.com");

    // Google sign-in auto-registers: there is no "not_registered" case here,
    // matching the old firebase-google provider.
    const result = await upsertSocialUser({
      email: fbUser.email,
      intent: "register-or-login",
      name: fbUser.displayName ?? null,
      avatarUrl: fbUser.photoUrl ?? null,
      provider: "google",
      providerAccountId: googleInfo?.rawId ?? fbUser.localId,
      accountType: "oidc",
      tokens: { id_token: idToken },
    });

    if ("error" in result) {
      res.status(401).json({ error: result.error });
      return;
    }

    const token = establishSession(res, result.record);
    res.json({
      message: "Login successful",
      user: {
        id: result.record.id,
        email: result.record.email,
        username: result.record.username,
        name: result.record.name,
        avatar_url: result.record.avatar_url,
      },
      token,
    });
  } catch (err) {
    console.error("[auth] Firebase Google error:", err);
    res.status(500).json({ error: "oauth_failed" });
  }
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
  tokens: Record<string, string | number | null>;
};

/** Fields every caller needs off the resolved user. */
type SocialUserRecord = {
  id: string;
  email: string | null;
  username: string | null;
  name: string | null;
  avatar_url: string | null;
};

type SocialUserResult =
  | { error: "account_exists" | "not_registered" }
  | { record: SocialUserRecord };

/**
 * Find-or-create the user behind a social identity and link the provider
 * account. Mirrors the old NextAuth signIn callback, intent guards included.
 */
async function upsertSocialUser(args: UpsertArgs): Promise<SocialUserResult> {
  let dbUser = await prisma.user.findUnique({ where: { email: args.email } });

  if (args.intent === "register" && dbUser) {
    return { error: "account_exists" as const };
  }
  if (args.intent === "login" && !dbUser) {
    return { error: "not_registered" as const };
  }

  if (!dbUser) {
    const username = await generateUsername(args.name || "user");
    dbUser = await prisma.user.create({
      data: {
        email: args.email,
        username,
        name: args.name,
        avatar_url: args.avatarUrl,
        provider: args.provider,
      },
    });

    void createNotificationOnce(dbUser.id, WELCOME);
    fireRegistrationWebhook(dbUser);
  } else {
    const updateData: { name: string | null; avatar_url: string | null; username?: string } = {
      name: args.name || dbUser.name,
      avatar_url: args.avatarUrl || dbUser.avatar_url,
    };
    if (!dbUser.username) {
      updateData.username = await generateUsername(args.name || "user");
    }
    dbUser = await prisma.user.update({ where: { email: args.email }, data: updateData });
  }

  try {
    await prisma.account.upsert({
      where: {
        provider_providerAccountId: {
          provider: args.provider,
          providerAccountId: args.providerAccountId,
        },
      },
      update: args.tokens,
      create: {
        userId: dbUser.id,
        type: args.accountType,
        provider: args.provider,
        providerAccountId: args.providerAccountId,
        ...args.tokens,
      },
    });
  } catch (err) {
    console.error("[auth] Account upsert error:", err);
  }

  return { record: dbUser };
}

export default router;

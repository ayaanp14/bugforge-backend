import { Router } from "express";
import jwt from "jsonwebtoken";
import { prisma } from "../lib/prisma.js";
import { optionalAuth } from "../middleware/auth.js";
import { WELCOME, createNotificationOnce } from "../services/notifications.js";
import { establishSession, clearSessionCookie, generateUsername } from "../lib/auth-session.js";
import { JWT_SECRET } from "../lib/secrets.js";
import { consumeChallenge, generateOtp, issueChallenge } from "../lib/otp-store.js";
import { forgetSessions, revokeSession } from "../lib/session-revocation.js";
import { burnCompare, hashPassword, needsRehash, passwordProblem, verifyPassword } from "../lib/passwords.js";
import { emailVerificationRequired, sendAuthCode } from "../lib/auth-mail.js";
import { redeemHandoff } from "../lib/handoff-store.js";

const router = Router();

/* ── input shapes ─────────────────────────────────────────────────────── */
//
// Nothing here was checked beyond "present". A non-string reached Prisma and
// 500ed; an email with a leading space made a second account for the same
// person; a username could be anything — including somebody else's email
// address, which /login matched first and used to shadow that person's
// sign-in. The reset screen promised an eight-character password the server
// never asked for.

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const USERNAME_RE = /^[a-z0-9_]{3,20}$/;

/** A trimmed, lower-cased address, or null when it is not one. */
function readEmail(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const email = raw.trim().toLowerCase();
  return email.length <= 254 && EMAIL_RE.test(email) ? email : null;
}


/** A normalised handle, `null` for "none given", or an error string. */
function readUsername(raw: unknown): string | null | { error: string } {
  if (raw == null || raw === "") return null;
  if (typeof raw !== "string") return { error: "Username must be text." };
  const username = raw.trim().toLowerCase();
  if (!USERNAME_RE.test(username)) return { error: "Usernames are 3–20 characters: letters, numbers and underscores." };
  return username;
}

/** Express 5 leaves `req.body` undefined when nothing was parsed. */
const bodyOf = (req: { body?: unknown }): Record<string, unknown> =>
  req.body && typeof req.body === "object" ? (req.body as Record<string, unknown>) : {};

/* ── email verification ───────────────────────────────────────────────── */
//
// A password account has to prove it can read its address before it can
// sign in. Until it does, the address is a stranger's for every purpose
// that matters: reset codes would go there, reminders would go there, and
// the real owner could never register. The proof is a six-digit code
// through the same challenge store as the reset flow, under its own
// purpose so the two can never be swapped.
//
// An account that was registered but never verified is inert — it cannot
// sign in — so squatting an address gains nothing: the owner's "forgot
// password" reaches their inbox, and a successful reset is itself proof of
// ownership, so it marks the address verified.

/** What the client needs to show the code screen. */
interface VerificationChallenge {
  required: true;
  email: string;
  /** Opaque handle to quote back with the code. */
  otpToken: string;
}

/** Mint a verification code for an address and send it. */
async function beginVerification(email: string): Promise<VerificationChallenge> {
  const otp = generateOtp();
  const otpToken = await issueChallenge("verify_email", email, otp);
  await sendAuthCode(email, otp, "verify_email");
  return { required: true, email, otpToken };
}

const UNVERIFIED_MESSAGE = "Confirm your email address to sign in. We have sent a new code to your inbox.";

// POST /api/auth/register
router.post("/register", async (req, res) => {
  const body = bodyOf(req);
  const email = readEmail(body["email"]);
  const password = body["password"];
  const handle = readUsername(body["username"]);

  if (!email) {
    res.status(400).json({ error: "Enter a valid email address." });
    return;
  }
  const weak = passwordProblem(password);
  if (weak) {
    res.status(400).json({ error: weak });
    return;
  }
  if (handle && typeof handle === "object") {
    res.status(400).json({ error: handle.error });
    return;
  }
  const username = handle;

  try {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({ where: { email }, select: { id: true } });
    if (existingUser) {
      res.status(400).json({ error: "Email already registered." });
      return;
    }

    // Check if username already exists
    if (username) {
      const existingUsername = await prisma.user.findUnique({ where: { username }, select: { id: true } });
      if (existingUsername) {
        res.status(400).json({ error: "Username already taken." });
        return;
      }
    }

    const finalUsername = username || await generateUsername(email.split("@")[0]);
    const hashedPassword = await hashPassword(password as string);

    let user: { id: string; email: string | null; username: string | null };
    try {
      user = await prisma.user.create({
        data: {
          email,
          username: finalUsername,
          password_hash: hashedPassword,
          provider: "email",
        },
        select: { id: true, email: true, username: true },
      });
    } catch (err) {
      // Two registrations for the same address in the same instant: the
      // unique index catches what the check above could not, and the answer
      // is the same one it would have given.
      if ((err as { code?: string }).code === "P2002") {
        res.status(400).json({ error: "Email or username already registered." });
        return;
      }
      throw err;
    }

    // Seed the in-app welcome notification
    void createNotificationOnce(user.id, WELCOME);

    // Trigger registration webhook
    const registrationWebhookUrl = process.env["REGISTRATION_FLOW_URL"];
    if (registrationWebhookUrl) {
      fetch(registrationWebhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: user.email,
          username: user.username,
        }),
      }).catch(err => console.error("Registration webhook error:", err));
    }

    const verification = emailVerificationRequired() ? await beginVerification(email) : { required: false as const };

    res.status(201).json({
      message: verification.required ? "Account created. Enter the code we emailed you to finish." : "User registered successfully",
      userId: user.id,
      verification,
    });
  } catch (err) {
    console.error("Registration error:", err);
    res.status(500).json({ error: "Failed to register user." });
  }
});

// POST /api/auth/login
router.post("/login", async (req, res) => {
  const body = bodyOf(req);
  const rawIdentifier = body["identifier"]; // identifier can be email or username
  const password = body["password"];

  if (typeof rawIdentifier !== "string" || !rawIdentifier.trim() || typeof password !== "string" || !password) {
    res.status(400).json({ error: "Identifier and password are required." });
    return;
  }
  // Trimmed and lower-cased like registration, so a trailing space pasted
  // into the field does not read as the wrong account.
  const identifier = rawIdentifier.trim().toLowerCase();

  try {
    // Find user by email or username. Only what the check and the response
    // need: the full row drags the readme and every profile-link Text column
    // across a ~500ms link for nothing. An address goes to the email column
    // only, so a username can never stand in for someone else's email.
    const user = await prisma.user.findFirst({
      where: identifier.includes("@") ? { email: identifier } : { username: identifier },
      select: {
        id: true,
        email: true,
        username: true,
        name: true,
        avatar_url: true,
        password_hash: true,
        provider: true,
        emailVerified: true,
      },
    });

    if (!user) {
      // Costs what a real compare costs, so the answer's timing does not
      // say whether the account exists.
      await burnCompare(password);
      res.status(401).json({ error: "Invalid credentials." });
      return;
    }
    // An account made with Google or GitHub has no password. "Invalid
    // credentials" sent those people round in circles; the register form
    // already confirms the address exists, so naming the way in gives
    // nothing away.
    if (!user.password_hash) {
      const via = user.provider === "google" ? "Google" : user.provider === "github" ? "GitHub" : "a social login";
      res.status(401).json({
        error: `This account signs in with ${via}. Use that button, or set a password with "Forgot password".`,
        provider: user.provider,
      });
      return;
    }

    const isPasswordValid = await verifyPassword(password, user.password_hash);
    if (!isPasswordValid) {
      res.status(401).json({ error: "Invalid credentials." });
      return;
    }

    // Right password, unconfirmed address: a fresh code goes out and the
    // client shows the code screen. Only after the password check, so a
    // stranger who knows the address cannot make us mail it by guessing.
    if (emailVerificationRequired() && !user.emailVerified && user.email) {
      const verification = await beginVerification(user.email);
      res.status(403).json({ error: UNVERIFIED_MESSAGE, code: "email_unverified", verification });
      return;
    }

    // A hash made at the old, lower cost is rewritten now that the password
    // is in hand. Off the response path: the sign-in is already decided.
    if (needsRehash(user.password_hash)) {
      hashPassword(password)
        .then((password_hash) => prisma.user.update({ where: { id: user.id }, data: { password_hash }, select: { id: true } }))
        .catch((err) => console.error("[auth] password rehash failed:", (err as Error).message));
    }

    // Same token format and cookie flags as every other sign-in path
    const token = establishSession(res, user);

    res.json({
      message: "Login successful",
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        name: user.name,
        avatar_url: user.avatar_url
      },
      token
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "An unexpected error occurred during login." });
  }
});

// POST /api/auth/verify-email — the code from the sign-up mail.
//
// Success signs the person in: they set the password a moment ago and have
// just shown they hold the inbox, which is more than the login route asks.
router.post("/verify-email", async (req, res) => {
  const body = bodyOf(req);
  const otp = body["otp"];
  const otpToken = body["otpToken"];
  if (typeof otp !== "string" || !otp || typeof otpToken !== "string" || !otpToken) {
    res.status(400).json({ error: "Code and token are required." });
    return;
  }

  try {
    const outcome = await consumeChallenge("verify_email", otpToken, otp);
    if (!outcome.ok) {
      res.status(400).json({ error: "Invalid or expired code." });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { email: outcome.email },
      select: { id: true, email: true, username: true, name: true, avatar_url: true, emailVerified: true },
    });
    if (!user) {
      res.status(400).json({ error: "Invalid or expired code." });
      return;
    }
    if (!user.emailVerified) {
      await prisma.user.update({ where: { id: user.id }, data: { emailVerified: new Date() }, select: { id: true } });
    }

    const token = establishSession(res, user);
    res.json({
      message: "Email confirmed.",
      user: { id: user.id, email: user.email, username: user.username, name: user.name, avatar_url: user.avatar_url },
      token,
    });
  } catch (err) {
    console.error("Email verification error:", err);
    res.status(500).json({ error: "Could not confirm your email right now." });
  }
});

// POST /api/auth/resend-verification
//
// Answers the same way whether or not the address has an account, or has
// already been confirmed: a handle comes back either way, and only an
// unconfirmed account is actually sent a code.
router.post("/resend-verification", async (req, res) => {
  const email = readEmail(bodyOf(req)["email"]);
  if (!email) {
    res.status(400).json({ error: "Enter a valid email address." });
    return;
  }

  try {
    const user = await prisma.user.findUnique({ where: { email }, select: { emailVerified: true, password_hash: true } });
    const pending = Boolean(user && !user.emailVerified && user.password_hash);
    const otp = generateOtp();
    const otpToken = await issueChallenge("verify_email", pending ? email : null, otp);
    if (pending) await sendAuthCode(email, otp, "verify_email");
    res.json({ message: "If that address is waiting to be confirmed, a new code is on its way.", otpToken });
  } catch (err) {
    console.error("Resend verification error:", err);
    res.status(500).json({ error: "Could not send a code right now." });
  }
});

// POST /api/auth/logout
//
// The token this request carried is ended on the server, not merely
// forgotten by the client. Without a token there is nothing to end and the
// cookie is cleared anyway; with one that has already been ended, likewise.
//
// Only a token in the Authorization header is ended. This route sits outside
// the platform guard, so a cross-site form could reach it with the victim's
// cookie attached and — if the cookie alone counted — sign them out at will.
// A header cannot be set by a form, and both clients send one.
router.post("/logout", optionalAuth, async (req, res) => {
  if (req.user && req.headers.authorization?.startsWith("Bearer ")) {
    try {
      await revokeSession(req.user.userId, req.user.sessionId, req.user.sessionExpiresAt);
    } catch (err) {
      // The client is signing out regardless; a write that failed here is
      // logged, not turned into a sign-out that "did not work".
      console.error("[auth] could not record sign-out:", (err as Error).message);
    }
  }
  clearSessionCookie(res);
  res.json({ message: "Logout successful" });
});

// POST /api/auth/handoff — the second half of a social sign-in.
//
// The OAuth callback lands the browser on the SPA with a one-time code in
// the URL rather than the session itself (lib/handoff-store.ts); the SPA
// posts the code here and gets the token. Once.
router.post("/handoff", async (req, res) => {
  const code = bodyOf(req)["code"];
  if (typeof code !== "string" || !code || code.length > 128) {
    res.status(400).json({ error: "Sign-in code is required." });
    return;
  }
  const token = await redeemHandoff(code);
  if (!token) {
    res.status(400).json({ error: "This sign-in link has expired. Please try again." });
    return;
  }
  res.setHeader("Cache-Control", "no-store");
  res.json({ token });
});

// GET /api/auth/time — the server clock, for a client whose own is wrong.
//
// Under /api/auth so the platform guard lets it through unsigned: it exists
// for the device that cannot produce a valid signature because its clock is
// outside the guard's window. The client stores the offset and signs with it.
router.get("/time", (_req, res) => {
  res.setHeader("Cache-Control", "no-store");
  res.json({ now: Date.now() });
});

// POST /api/auth/forgot-password
router.post("/forgot-password", async (req, res) => {
  const email = readEmail(bodyOf(req)["email"]);

  if (!email) {
    res.status(400).json({ error: "Enter a valid email address." });
    return;
  }

  try {
    const user = await prisma.user.findUnique({ where: { email }, select: { id: true } });

    // A code is minted either way. The handle below carries no information, so
    // an address with no account produces an identical response and this
    // endpoint cannot be used to discover who has registered.
    const otp = generateOtp();
    const otpToken = await issueChallenge("password_reset", user ? email : null, otp);

    // Only a real account is ever sent a code.
    if (user) await sendAuthCode(email, otp, "password_reset");

    res.json({
      message: "If an account with that email exists, an OTP has been sent.",
      // Opaque handle. The code itself, and its hash, stay on the server.
      otpToken,
    });
  } catch (err) {
    console.error("Forgot password error:", err);
    res.status(500).json({ error: "Failed to process forgot password request." });
  }
});

// POST /api/auth/verify-otp
router.post("/verify-otp", async (req, res) => {
  const body = bodyOf(req);
  const otp = body["otp"];
  const otpToken = body["otpToken"];

  if (typeof otp !== "string" || !otp || typeof otpToken !== "string" || !otpToken) {
    res.status(400).json({ error: "OTP and token are required." });
    return;
  }

  try {
    const outcome = await consumeChallenge("password_reset", otpToken, otp);

    if (!outcome.ok) {
      // The reason is deliberately not passed on. Telling a caller that their
      // guesses are exhausted, rather than simply wrong, would confirm the
      // address has an account.
      res.status(400).json({ error: "Invalid or expired OTP." });
      return;
    }

    // Ten minutes to choose a new password, and this token is the only thing
    // that authorises the change.
    const resetToken = jwt.sign({ email: outcome.email, purpose: "password_reset" }, JWT_SECRET, {
      algorithm: "HS256",
      expiresIn: "10m",
    });

    res.json({
      message: "OTP verified successfully.",
      resetToken,
    });
  } catch (err) {
    console.error("OTP verification error:", err);
    res.status(400).json({ error: "Invalid or expired verification session." });
  }
});

// POST /api/auth/reset-password
router.post("/reset-password", async (req, res) => {
  const body = bodyOf(req);
  const newPassword = body["newPassword"];
  const resetToken = body["resetToken"];

  if (typeof resetToken !== "string" || !resetToken) {
    res.status(400).json({ error: "New password and reset token are required." });
    return;
  }
  const weak = passwordProblem(newPassword);
  if (weak) {
    res.status(400).json({ error: weak });
    return;
  }

  try {
    // Verify the reset token. The algorithm is pinned as it is for sessions:
    // the library would otherwise accept any HMAC variant the header named.
    const payload = jwt.verify(resetToken, JWT_SECRET, { algorithms: ["HS256"] }) as {
      email?: unknown;
      purpose?: unknown;
      iat?: number;
    };

    if (payload.purpose !== "password_reset" || typeof payload.email !== "string") {
      res.status(400).json({ error: "Invalid token purpose." });
      return;
    }

    // One reset per token. A reset stamps `sessionsValidFrom`, so a token
    // minted before that stamp has already been spent — it stayed good for
    // its full ten minutes before, and anyone who had captured it could set
    // the password a second time.
    const account = await prisma.user.findUnique({
      where: { email: payload.email },
      select: { id: true, sessionsValidFrom: true, emailVerified: true },
    });
    if (!account) {
      res.status(400).json({ error: "Invalid or expired reset session." });
      return;
    }
    const issuedAt = (payload.iat ?? 0) * 1000;
    if (account.sessionsValidFrom && issuedAt <= account.sessionsValidFrom.getTime()) {
      res.status(400).json({ error: "This reset link has already been used. Request a new code." });
      return;
    }

    // The new password and the end of every existing session are written
    // together. Whoever prompted the reset is usually someone who already has
    // a token, and leaving them signed in would defeat the point of resetting.
    //
    // Reading the code out of the inbox is the same proof the sign-up flow
    // asks for, so an address that was never confirmed is confirmed now.
    const hashedPassword = await hashPassword(newPassword as string);
    const updated = await prisma.user.update({
      where: { id: account.id },
      data: {
        password_hash: hashedPassword,
        sessionsValidFrom: new Date(),
        ...(account.emailVerified ? {} : { emailVerified: new Date() }),
      },
      select: { id: true },
    });
    forgetSessions(updated.id);

    res.json({ message: "Password reset successfully. You can now log in with your new password." });
  } catch (err) {
    console.error("Password reset error:", err);
    res.status(400).json({ error: "Invalid or expired reset session." });
  }
});

export default router;

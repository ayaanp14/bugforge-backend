import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "../lib/prisma.js";
import { optionalAuth } from "../middleware/auth.js";
import { WELCOME, createNotificationOnce } from "../services/notifications.js";
import { establishSession, clearSessionCookie, generateUsername } from "../lib/auth-session.js";
import { JWT_SECRET } from "../lib/secrets.js";
import { consumeChallenge, generateOtp, issueChallenge } from "../lib/otp-store.js";
import { forgetSessions } from "../lib/session-revocation.js";

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
const MIN_PASSWORD = 8;
const MAX_PASSWORD = 128;

/** A trimmed, lower-cased address, or null when it is not one. */
function readEmail(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const email = raw.trim().toLowerCase();
  return email.length <= 254 && EMAIL_RE.test(email) ? email : null;
}

/** A usable password, or the reason it is not. */
function passwordProblem(raw: unknown): string | null {
  if (typeof raw !== "string") return "Password is required.";
  if (raw.length < MIN_PASSWORD) return `Use at least ${MIN_PASSWORD} characters.`;
  if (raw.length > MAX_PASSWORD) return `Passwords are limited to ${MAX_PASSWORD} characters.`;
  return null;
}

/** A normalised handle, `null` for "none given", or an error string. */
function readUsername(raw: unknown): string | null | { error: string } {
  if (raw == null || raw === "") return null;
  if (typeof raw !== "string") return { error: "Username must be text." };
  const username = raw.trim().toLowerCase();
  if (!USERNAME_RE.test(username)) return { error: "Usernames are 3–20 characters: letters, numbers and underscores." };
  return username;
}

// POST /api/auth/register
router.post("/register", async (req, res) => {
  const email = readEmail(req.body?.email);
  const password = req.body?.password;
  const handle = readUsername(req.body?.username);

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
    const hashedPassword = await bcrypt.hash(password, 10);

    let user;
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
    const registrationWebhookUrl = process.env.REGISTRATION_FLOW_URL;
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

    res.status(201).json({ 
      message: "User registered successfully", 
      userId: user.id 
    });
  } catch (err) {
    console.error("Registration error:", err);
    res.status(500).json({ error: "Failed to register user." });
  }
});

// POST /api/auth/login
router.post("/login", async (req, res) => {
  const rawIdentifier = req.body?.identifier; // identifier can be email or username
  const password = req.body?.password;

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
      select: { id: true, email: true, username: true, name: true, avatar_url: true, password_hash: true },
    });

    if (!user || !user.password_hash) {
      res.status(401).json({ error: "Invalid credentials." });
      return;
    }

    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      res.status(401).json({ error: "Invalid credentials." });
      return;
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

// POST /api/auth/logout
router.post("/logout", (req, res) => {
  clearSessionCookie(res);
  res.json({ message: "Logout successful" });
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
  const email = readEmail(req.body?.email);

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
    const otpToken = await issueChallenge(user ? email : null, otp);

    // Only a real account is ever sent a code.
    if (user) {
      const webhookUrl = "https://flow.sokt.io/func/scriPfBslH2w";
      await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp }),
      }).catch((err) => console.error("[auth] OTP delivery failed:", err));
    }

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
  const { otp, otpToken } = req.body;

  if (!otp || !otpToken) {
    res.status(400).json({ error: "OTP and token are required." });
    return;
  }

  try {
    const outcome = await consumeChallenge(String(otpToken), String(otp));

    if (!outcome.ok) {
      // The reason is deliberately not passed on. Telling a caller that their
      // guesses are exhausted, rather than simply wrong, would confirm the
      // address has an account.
      res.status(400).json({ error: "Invalid or expired OTP." });
      return;
    }

    // Ten minutes to choose a new password, and this token is the only thing
    // that authorises the change.
    const resetToken = jwt.sign({ email: outcome.email, purpose: "password_reset" }, JWT_SECRET, { expiresIn: "10m" });

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
  const { newPassword, resetToken } = req.body ?? {};

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
    // Verify the reset token
    const payload = jwt.verify(resetToken, JWT_SECRET) as { email: string; purpose: string; iat?: number };

    if (payload.purpose !== "password_reset") {
      res.status(400).json({ error: "Invalid token purpose." });
      return;
    }

    // One reset per token. A reset stamps `sessionsValidFrom`, so a token
    // minted before that stamp has already been spent — it stayed good for
    // its full ten minutes before, and anyone who had captured it could set
    // the password a second time.
    const account = await prisma.user.findUnique({
      where: { email: payload.email },
      select: { id: true, sessionsValidFrom: true },
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
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    const updated = await prisma.user.update({
      where: { id: account.id },
      data: { password_hash: hashedPassword, sessionsValidFrom: new Date() },
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


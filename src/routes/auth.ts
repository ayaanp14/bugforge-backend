import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "../lib/prisma.js";
import { optionalAuth } from "../middleware/auth.js";

const router = Router();
const JWT_SECRET = process.env["JWT_SECRET"] || "your-secret-key";

// Helper to generate a unique username (same logic as frontend)
const generateUsername = async (baseName: string) => {
  let username = baseName.toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "");
  if (username.length < 3) username = "user_" + Math.random().toString(36).substring(2, 7);
  
  // Check uniqueness
  const existing = await prisma.user.findFirst({ where: { username } });
  if (existing) {
    username += "_" + Math.random().toString(36).substring(2, 5);
  }
  return username;
};

// POST /api/auth/register
router.post("/register", async (req, res) => {
  const { username, email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({ error: "Email and password are required." });
    return;
  }

  try {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      res.status(400).json({ error: "Email already registered." });
      return;
    }

    // Check if username already exists
    if (username) {
      const existingUsername = await prisma.user.findUnique({ where: { username } });
      if (existingUsername) {
        res.status(400).json({ error: "Username already taken." });
        return;
      }
    }

    const finalUsername = username || await generateUsername(email.split("@")[0]);
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email,
        username: finalUsername,
        password_hash: hashedPassword,
        provider: "email",
      }
    });

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
  const { identifier, password } = req.body; // identifier can be email or username

  if (!identifier || !password) {
    res.status(400).json({ error: "Identifier and password are required." });
    return;
  }

  try {
    // Find user by email or username
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: identifier },
          { username: identifier }
        ]
      }
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

    // Generate JWT (matching NextAuth custom JWT format)
    const payload = {
      userId: user.id,
      email: user.email
    };

    const token = jwt.sign(payload, JWT_SECRET, { algorithm: "HS256" });

    // Set __session cookie
    res.cookie("__session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      path: "/"
    });

    res.json({
      message: "Login successful",
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        name: user.name,
        avatar_url: user.avatar_url
      }
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "An unexpected error occurred during login." });
  }
});

// POST /api/auth/logout
router.post("/logout", (req, res) => {
  res.clearCookie("__session", {
    path: "/",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax"
  });
  res.json({ message: "Logout successful" });
});

// POST /api/auth/forgot-password
router.post("/forgot-password", async (req, res) => {
  const { email } = req.body;

  if (!email) {
    res.status(400).json({ error: "Email is required." });
    return;
  }

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      // For security, don't reveal if user exists or not
      res.json({ message: "If an account with that email exists, an OTP has been sent." });
      return;
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Create a hash of the OTP to store in the token (stateless)
    // Using bcrypt to match user password patterns
    const salt = await bcrypt.genSalt(10);
    const otpHash = await bcrypt.hash(otp, salt);
    
    // Create a temporary token that expires in 5 minutes
    const otpToken = jwt.sign({ email, otpHash }, JWT_SECRET, { expiresIn: "5m" });

    // Send to Pabbly webhook
    const webhookUrl = "https://flow.sokt.io/func/scriPfBslH2w";
    await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        otp,
      }),
    });

    res.json({ 
      message: "OTP sent successfully.",
      otpToken // Send this to the frontend so it can be used for verification
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
    // Verify the OTP token
    const payload = jwt.verify(otpToken, JWT_SECRET) as { email: string; otpHash: string };
    
    // Check if the provided OTP matches the hash in the token
    const isValid = await bcrypt.compare(otp, payload.otpHash);
    
    if (!isValid) {
      res.status(400).json({ error: "Invalid or expired OTP." });
      return;
    }

    // Generate a reset token that is valid for 10 minutes
    const resetToken = jwt.sign({ email: payload.email, purpose: "password_reset" }, JWT_SECRET, { expiresIn: "10m" });

    res.json({ 
      message: "OTP verified successfully.",
      resetToken 
    });
  } catch (err) {
    console.error("OTP verification error:", err);
    res.status(400).json({ error: "Invalid or expired verification session." });
  }
});

// POST /api/auth/reset-password
router.post("/reset-password", async (req, res) => {
  const { newPassword, resetToken } = req.body;

  if (!newPassword || !resetToken) {
    res.status(400).json({ error: "New password and reset token are required." });
    return;
  }

  try {
    // Verify the reset token
    const payload = jwt.verify(resetToken, JWT_SECRET) as { email: string; purpose: string };
    
    if (payload.purpose !== "password_reset") {
      res.status(400).json({ error: "Invalid token purpose." });
      return;
    }

    // Update user password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { email: payload.email },
      data: { password_hash: hashedPassword }
    });

    res.json({ message: "Password reset successfully. You can now log in with your new password." });
  } catch (err) {
    console.error("Password reset error:", err);
    res.status(400).json({ error: "Invalid or expired reset session." });
  }
});

export default router;


import "dotenv/config";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import authRouter from "./routes/auth.js";
import meRouter from "./routes/me.js";
import problemsRouter from "./routes/problems.js";
import executionRouter from "./routes/execution.js";
import leaderboardRouter from "./routes/leaderboard.js";
import bugChallengesRouter from "./routes/bug-challenges.js";
import pairRoomsRouter from "./routes/pair-rooms.js";
import { platformGuard } from "./middleware/platformGuard.js";
const app = express();
const PORT = Number(process.env["PORT"] ?? 3001);
const FRONTEND_URL = process.env["FRONTEND_URL"] ?? "http://localhost:3000";
// CORS — allow frontend origin with credentials
app.use(cors({
    origin: FRONTEND_URL,
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-App-Platform", "X-App-Signature", "X-App-Timestamp"],
}));
// Strict Platform Guard
app.use(platformGuard);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
// Routes
app.use("/api/auth", authRouter);
app.use("/api/me", meRouter);
app.use("/api/problems", problemsRouter);
app.use("/api/leaderboard", leaderboardRouter);
app.use("/api/bug-challenges", bugChallengesRouter);
app.use("/api/pair-rooms", pairRoomsRouter);
app.use("/api", executionRouter);
// Health check
app.get("/health", (_req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
});
app.listen(PORT, () => {
    console.log(`🚀 Backend running at http://localhost:${PORT}`);
    console.log(`   Auth:   GET /api/auth/google`);
    console.log(`   Me:     GET /api/me`);
    console.log(`   Problems: GET /api/problems`);
    console.log(`   Run:    POST /api/run`);
    console.log(`   Submit: POST /api/submit`);
    console.log(`   Leaderboard: GET /api/leaderboard`);
    console.log(`   Health: GET /health`);
});
//# sourceMappingURL=index.js.map
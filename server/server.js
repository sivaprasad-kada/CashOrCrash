import express from "express";
import http from "http";

import { Server } from "socket.io";
import dotenv from "dotenv";
import cors from "cors";

import { connectDB } from "./config/db.js";
import gameRoutes from "./routes/game.routes.js";
import teamRoutes from "./routes/team.routes.js";
import adminRoutes from "./routes/admin.routes.js"; // [NEW]
import gameStateRoutes from "./routes/gamestate.routes.js"; // [NEW] GameState
import roomRoutes from "./routes/room.routes.js"; // [NEW] Room Routes
import sugarCandyRoutes from "./routes/sugarcandy.routes.js"; // [NEW]
import Admin from "./models/Admin.model.js"; // [NEW] Seed
import leaderboardRoutes from "./routes/leaderboard.routes.js"; // [NEW] Leaderboard

dotenv.config();

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: "*" }
});

import cookieParser from "cookie-parser";

/* ============================= */
/* MIDDLEWARE */
/* ============================= */
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:3000",
  process.env.CLIENT_URL,
  "https://cashorcrash-frontend.onrender.com"
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));
app.use(express.json());
app.use(cookieParser());
app.use("/uploads", express.static("uploads")); // [NEW] Serve Static Files

/* 🔑 Inject io into every request */
app.use((req, res, next) => {
  req.io = io;
  next();
});

/* 🚫 Disable Caching */
app.use((req, res, next) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  next();
});

/* ============================= */
/* ROUTES */
/* ============================= */
app.use("/api/game", gameRoutes);
app.use("/api/teams", teamRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/state", gameStateRoutes);
app.use("/api/rooms", roomRoutes);
app.use("/api/sugarcandy", sugarCandyRoutes); // [NEW]
app.use("/api/leaderboard", leaderboardRoutes);

// [NEW] Health Check
app.get("/health", (req, res) => res.status(200).send("OK"));

/* ============================= */
/* DATABASE */
/* ============================= */
connectDB().then(async () => {
  // 🌱 SEED ROOT ADMIN
  const count = await Admin.countDocuments();
  if (count === 0) {
    await Admin.create({ username: "root", password: "root123", role: "root" });
    console.log("🌱 Root Admin Created: root / root123");
  }
});

/* ============================= */
/* SOCKET */
/* ============================= */
io.on("connection", socket => {
  console.log("🔌 Client connected:", socket.id);
});

/* ============================= */
/* SERVER */
/* ============================= */
const PORT = process.env.PORT || 5000;

app.get("/", (req, res) => {
  res.send("Backend API is running. Frontend is deployed separately.");
});

server.listen(PORT, () =>
  console.log(`🚀 Server running on port ${PORT}`)
);

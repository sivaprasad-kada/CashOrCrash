import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";

import gameRoutes from "./routes/game.routes.js";
import teamRoutes from "./routes/team.routes.js";

dotenv.config();

const app = express();

/* ============================= */
/* MIDDLEWARE */
/* ============================= */
app.use(cors());
app.use(express.json());

/* ============================= */
/* ROUTES */
/* ============================= */
app.use("/api/game", gameRoutes);
app.use("/api/teams", teamRoutes);

/* ============================= */
/* DB CONNECTION */
/* ============================= */
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch(err => console.error("MongoDB Error:", err));

export default app;

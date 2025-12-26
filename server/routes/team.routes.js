import express from "express";
import Team from "../models/Team.model.js";

const router = express.Router();

/* ============================= */
/* GET LEADERBOARD (TOP 10) */
/* ============================= */
router.get("/leaderboard", async (req, res) => {
  try {
    const teams = await Team.find({})
      .sort({ balance: -1 })     // highest balance first
      .limit(10)
      .limit(10)
      .select("name balance lifelines roomId")
      .populate("roomId", "name");

    res.json(teams);
  } catch (err) {
    res.status(500).json({ error: "Failed to load leaderboard" });
  }
});

/* ============================= */
/* GET ALL TEAMS (GAME) */
/* ============================= */
router.get("/", async (req, res) => {
  const { roomId } = req.query;
  const filter = roomId ? { roomId } : {};
  const teams = await Team.find(filter, { name: 1, balance: 1, lifelines: 1, unityTokens: 1, sugarCandy: 1 }).populate("roomId", "name");
  res.json(teams);
});

/* ============================= */
/* GET SINGLE TEAM */
/* ============================= */
router.get("/:id", async (req, res) => {
  try {
    const team = await Team.findById(req.params.id);
    if (!team) return res.status(404).json({ error: "Team not found" });
    res.json(team);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch team" });
  }
});

/* ============================= */
/* CREATE TEAM */
/* ============================= */
router.post("/", async (req, res) => {
  try {
    const { name, balance, roomId } = req.body;
    const newTeam = new Team({ name, balance: balance || 10000, roomId });
    await newTeam.save();
    res.json(newTeam);
  } catch (err) {
    res.status(500).json({ error: "Failed to create team" });
  }
});

/* ============================= */
/* UPDATE TEAM */
/* ============================= */
router.put("/:id", async (req, res) => {
  try {
    const { balance, name } = req.body;
    const updatedTeam = await Team.findByIdAndUpdate(
      req.params.id,
      { $set: { ...(name && { name }), ...(balance !== undefined && { balance }), ...(req.body.lifelines && { lifelines: req.body.lifelines }) } },
      { new: true }
    );
    res.json(updatedTeam);
  } catch (err) {
    res.status(500).json({ error: "Failed to update team" });
  }
});

/* ============================= */
/* DELETE TEAM */
/* ============================= */
router.delete("/:id", async (req, res) => {
  try {
    await Team.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Team deleted" });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete team" });
  }
});

export default router;

import express from "express";
import Team from "../models/Team.model.js";

const router = express.Router();

router.get("/", async (req, res) => {
  const teams = await Team.find()
    .sort({ balance: -1 })
    .limit(10);

  res.json(teams);
});

export default router;

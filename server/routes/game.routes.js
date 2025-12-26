import express from "express";
import Question from "../models/Question.model.js";
import Team from "../models/Team.model.js";
import { GAME_EVENTS } from "../config/constants.js";

const router = express.Router();

/* ============================= */
/* GET ALL QUESTIONS */
/* ============================= */
router.get("/questions", async (req, res) => {
  const questions = await Question.find(
    {},
    { text: 0, options: 0, correct: 0 }
  );
  console.log(`[DEBUG] BE Fetched ${questions.length} questions.`);
  res.json(questions);
});

/* ============================= */
/* GET SINGLE QUESTION */
/* ============================= */
router.get("/question/:id", async (req, res) => {
  const q = await Question.findOne({ number: req.params.id });
  res.json(q);
});

/* ============================= */
/* SUBMIT ANSWER */
/* ============================= */
router.post("/answer", async (req, res) => {
  const { teamId, questionId, answer, bid } = req.body;

  const q = await Question.findOne({ number: questionId });
  if (!q || q.locked) {
    return res.status(400).json({ error: "Question already locked" });
  }

  const isCorrect = answer === q.correct;

  q.locked = true;
  q.result = isCorrect ? "correct" : "wrong";
  await q.save();

  /* 🔑 FIX: use _id */
  const team = await Team.findById(teamId);
  if (!team) {
    return res.status(404).json({ error: "Team not found" });
  }

  // Update Team Balance
  team.balance += isCorrect ? bid : -bid;
  await team.save();

  // [NEW] Track House/Admin Profit on LOSS
  if (!isCorrect) {
    // Find the admin to credit based on GameState
    const GameState = (await import("../models/GameState.model.js")).default;
    const Admin = (await import("../models/Admin.model.js")).default;

    const state = await GameState.findOne();
    let adminToCredit = null;

    if (state && state.startedByAdminId) {
      adminToCredit = await Admin.findById(state.startedByAdminId);
    }

    if (!adminToCredit) {
      // Fallback to root if game wasn't started explicitly or state missing
      adminToCredit = await Admin.findOne({ role: "root" });
    }

    if (adminToCredit) {
      adminToCredit.balance += bid;
      await adminToCredit.save();
      console.log(`[HOUSE] Admin ${adminToCredit.username} collected ${bid} from Team ${team.name}`);

      req.io.emit("ADMIN_BALANCE_UPDATE", {
        adminId: adminToCredit._id,
        balance: adminToCredit.balance
      });
    }
  }

  /* 🔔 Broadcast */
  req.io.emit(GAME_EVENTS.QUESTION_LOCKED, {
    questionId,
    result: q.result,
    teamId,
    balance: team.balance
  });

  res.json({
    correct: isCorrect,
    result: q.result,
    balance: team.balance,
    questionId
  });
});

export default router;
/* ============================= */
/* APPLY LIFELINE */
/* ============================= */
/* ============================= */
/* APPLY LIFELINE (PER QUESTION) */
/* ============================= */
router.post("/lifeline", async (req, res) => {
  const { type, teamId, questionId } = req.body;
  // type is expected to be "50-50", "QUESTION-SWAP", or "EXTRA-TIME"

  try {
    const team = await Team.findById(teamId);
    if (!team) return res.status(404).json({ error: "Team not found" });

    // 1. Calculate Total Used Count
    let usedCount = 0;
    if (team.lifelines && Array.isArray(team.lifelines)) {
      team.lifelines.forEach(l => {
        const key = Object.keys(l)[0];
        if (l[key] === true) usedCount++;
      });
    }

    if (usedCount >= 2) {
      return res.status(400).json({ error: "Maximum 2 lifelines allowed per game." });
    }

    // 2. Find Specific Lifeline
    // Structure: [ { "50-50": false }, ... ]
    let lifelineIndex = -1;
    let lifelineKey = "";

    // Normalize input type if necessary (frontend sends "50-50", "Question Swap" etc)
    // We map generic names to our DB keys
    const map = {
      "50-50": "50-50",
      "Question Swap": "QUESTION-SWAP",
      "Extra Time": "EXTRA-TIME",
      "QUESTION-SWAP": "QUESTION-SWAP",
      "EXTRA-TIME": "EXTRA-TIME"
    };
    const dbKey = map[type];

    if (!dbKey) return res.status(400).json({ error: "Invalid lifeline type" });

    lifelineIndex = team.lifelines.findIndex(l => l.hasOwnProperty(dbKey));

    if (lifelineIndex === -1) {
      // --- DETECT & FIX OLD SCHEMA (Lazy Migration) ---
      // If the DB has old data (array of objects with 'name' property), we need to reset it.
      const hasOldSchema = team.lifelines.some(l => l.name);

      if (hasOldSchema || team.lifelines.length === 0) {
        console.log(`[MIGRATION] Updating team ${team.name} to new lifeline schema.`);
        team.lifelines = [
          { "50-50": false },
          { "QUESTION-SWAP": false },
          { "EXTRA-TIME": false }
        ];
        await team.save();

        // Retry finding index
        lifelineIndex = team.lifelines.findIndex(l => l.hasOwnProperty(dbKey));
      }

      if (lifelineIndex === -1) {
        return res.status(400).json({ error: "Lifeline not found in team inventory (Migration Failed)" });
      }
    }

    const lifelineObj = team.lifelines[lifelineIndex];
    if (lifelineObj[dbKey] === true) {
      return res.status(400).json({ error: "Lifeline already used" });
    }

    // 3. Mark as USED
    // We need to specifically update the object in the array
    team.lifelines[lifelineIndex][dbKey] = true;

    // Mongoose Mixed type detection
    team.markModified('lifelines');
    await team.save();

    // 4. Handle Specific Logic (Question Swap)
    let updatedQuestion = null;
    if (dbKey === "QUESTION-SWAP") {
      // Mark current question as swapped
      updatedQuestion = await Question.findOneAndUpdate(
        { number: questionId },
        { result: "swapped", locked: true },
        { new: true }
      );

      // Broadcast lock
      req.io.emit(GAME_EVENTS.QUESTION_LOCKED, {
        questionId,
        result: "swapped"
      });
    }

    res.json({ success: true, team, question: updatedQuestion });

  } catch (err) {
    console.error("Lifeline Error:", err);
    res.status(500).json({ error: "Failed to apply lifeline" });
  }
});

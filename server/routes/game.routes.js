
import express from "express";
import Question from "../models/Question.model.js";
import Team from "../models/Team.model.js";
import RoomQuestionState from "../models/RoomQuestionState.model.js";
import { GAME_EVENTS } from "../config/constants.js";

const router = express.Router();

/* ============================= */
/* GET ALL QUESTIONS (ROOM SCOPED) */
/* ============================= */
router.get("/questions", async (req, res) => {
  try {
    const { roomId } = req.query;

    // 1. Fetch Global Questions (Read-Only Template)
    // Use lean() to get plain objects we can modify
    const questions = await Question.find(
      {},
      { text: 0, options: 0, correct: 0 }
    ).lean();

    // 2. Fetch Room-Specific State if roomId is provided
    let roomStateMap = new Map();
    if (roomId) {
      const roomStates = await RoomQuestionState.find({ roomId });
      roomStates.forEach(s => roomStateMap.set(s.questionNumber, s));
    }

    // 3. Mege State
    const mergedQuestions = questions.map(q => {
      const state = roomStateMap.get(q.number);
      return {
        ...q,
        // Override global state with room state
        locked: state ? true : false,
        result: state ? state.result : null,
        // If needed, we can pass timestamps etc.
      };
    });

    console.log(`[DEBUG] BE Fetched ${mergedQuestions.length} questions(Room: ${roomId || "Global"}).`);
    res.json(mergedQuestions);
  } catch (err) {
    console.error("GET /questions error:", err);
    res.status(500).json({ error: "Failed to fetch questions" });
  }
});

/* ============================= */
/* GET SINGLE QUESTION (ROOM SCOPED) */
/* ============================= */
router.get("/question/:id", async (req, res) => {
  try {
    const { roomId } = req.query;
    const q = await Question.findOne({ number: req.params.id }).lean();
    if (!q) return res.status(404).json({ error: "Question not found" });

    if (roomId) {
      const state = await RoomQuestionState.findOne({ roomId, questionNumber: q.number });
      if (state) {
        q.locked = true;
        q.result = state.result;
      } else {
        q.locked = false;
        q.result = null;
      }
    } else {
      // Fallback for no-room calls (shouldn't happen in production logic)
      q.locked = false;
      q.result = null;
    }

    res.json(q);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch question" });
  }
});

/* ============================= */
/* SUBMIT ANSWER (ROOM SCOPED) */
/* ============================= */
router.post("/answer", async (req, res) => {
  const { teamId, questionId, answer, bid } = req.body;

  try {
    // 1. Get Team & Room
    const team = await Team.findById(teamId);
    if (!team) return res.status(404).json({ error: "Team not found" });
    if (!team.roomId) return res.status(400).json({ error: "Team is not assigned to a room" });

    // 2. Check Room-Specific Lock
    const existingState = await RoomQuestionState.findOne({
      roomId: team.roomId,
      questionNumber: questionId
    });

    if (existingState) {
      return res.status(400).json({ error: "Question already locked in this room" });
    }

    // 3. Validate Answer (Global Question Data)
    const q = await Question.findOne({ number: questionId });
    if (!q) return res.status(404).json({ error: "Question definition not found" });

    const isCorrect = answer === q.correct;
    const resultStatus = isCorrect ? "correct" : "wrong";

    // 4. Create Room State (LOCK IT)
    await RoomQuestionState.create({
      roomId: team.roomId,
      questionNumber: questionId,
      isAnswered: true,
      answeredByTeamId: team._id,
      result: resultStatus
    });

    // 5. Update Team Balance
    team.balance += isCorrect ? bid : -bid;
    await team.save();

    // 6. House Profit Logic
    if (!isCorrect) {
      const GameState = (await import("../models/GameState.model.js")).default;
      const Admin = (await import("../models/Admin.model.js")).default;

      // Find Admin associated with this Room's GameState
      const state = await GameState.findOne({ roomId: team.roomId });
      let adminToCredit = null;

      if (state && state.startedByAdminId) {
        adminToCredit = await Admin.findById(state.startedByAdminId);
      }

      if (adminToCredit) {
        adminToCredit.balance += bid;
        await adminToCredit.save();

        // Notify Admin (Client checks if event matches their ID)
        req.io.emit("ADMIN_BALANCE_UPDATE", {
          adminId: adminToCredit._id,
          balance: adminToCredit.balance
        });
      }
    }

    // 7. Broadcast Result (Include roomId so frontend filters)
    req.io.emit(GAME_EVENTS.QUESTION_LOCKED, {
      roomId: team.roomId, // IMPORTANT
      questionId,
      result: resultStatus,
      teamId,
      balance: team.balance
    });

    res.json({
      correct: isCorrect,
      result: resultStatus,
      balance: team.balance,
      questionId
    });

  } catch (err) {
    console.error("Answer Error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

/* ============================= */
/* APPLY LIFELINE (PER QUESTION) */
/* ============================= */
router.post("/lifeline", async (req, res) => {
  const { type, teamId, questionId } = req.body;
  // type is expected to be "50-50", "QUESTION-SWAP", or "EXTRA-TIME"

  try {
    const team = await Team.findById(teamId);
    if (!team) return res.status(404).json({ error: "Team not found" });
    if (!team.roomId) return res.status(400).json({ error: "Team not assigned to a room" });

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
    let lifelineIndex = -1;
    const map = {
      "50-50": "50-50",
      "Question Swap": "QUESTION-SWAP",
      "QUESTION-SWAP": "QUESTION-SWAP",
      "Extra Time": "EXTRA-TIME",
      "EXTRA-TIME": "EXTRA-TIME"
    };
    const dbKey = map[type];

    if (!dbKey) return res.status(400).json({ error: "Invalid lifeline type" });

    lifelineIndex = team.lifelines.findIndex(l => l.hasOwnProperty(dbKey));

    if (lifelineIndex === -1) {
      // Quick Migration Fix
      if (team.lifelines.length === 0 || team.lifelines.some(l => l.name)) {
        team.lifelines = [{ "50-50": false }, { "QUESTION-SWAP": false }, { "EXTRA-TIME": false }];
        await team.save();
        lifelineIndex = team.lifelines.findIndex(l => l.hasOwnProperty(dbKey));
      }
      if (lifelineIndex === -1) return res.status(400).json({ error: "Lifeline not found" });
    }

    const lifelineObj = team.lifelines[lifelineIndex];
    if (lifelineObj[dbKey] === true) {
      return res.status(400).json({ error: "Lifeline already used" });
    }

    // 3. Mark as USED
    team.lifelines[lifelineIndex][dbKey] = true;
    team.markModified('lifelines');
    await team.save();

    // 4. Handle Specific Logic (Question Swap)
    let updatedQuestion = await Question.findOne({ number: questionId }).lean();

    if (dbKey === "QUESTION-SWAP") {
      // [NEW] Check if already swapped/locked in room
      const existingState = await RoomQuestionState.findOne({ roomId: team.roomId, questionNumber: questionId });
      if (existingState) {
        return res.status(400).json({ error: "Question already locked/swapped in this room." });
      }

      // Create Room State: SWAP
      await RoomQuestionState.create({
        roomId: team.roomId,
        questionNumber: questionId,
        isAnswered: true,
        answeredByTeamId: team._id,
        result: "swapped"
      });

      // Broadcast lock
      req.io.emit(GAME_EVENTS.QUESTION_LOCKED, {
        roomId: team.roomId,
        questionId,
        result: "swapped"
      });

      // Return updated question state
      updatedQuestion.locked = true;
      updatedQuestion.result = "swapped";
    }

    res.json({ success: true, team, question: updatedQuestion });

  } catch (err) {
    console.error("Lifeline Error:", err);
    res.status(500).json({ error: "Failed to apply lifeline" });
  }
});

export default router;


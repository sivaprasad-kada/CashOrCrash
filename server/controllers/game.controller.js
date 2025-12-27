import Question from "../models/Question.model.js";
import Team from "../models/Team.model.js";
import RoomQuestionState from "../models/RoomQuestionState.model.js";
import Admin from "../models/Admin.model.js";
import { Server } from "socket.io";
import jwt from "jsonwebtoken";

const getAdminRoomId = (req) => {
  const token = req.cookies.token;
  if (!token) return null;
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "secret");
    return decoded.roomId;
  } catch (e) {
    return null;
  }
};

/* ============================= */
/* SUBMIT ANSWER (MULTI-ROOM) */
/* ============================= */
export const submitAnswer = async (req, res) => {
  try {
    const { teamId, questionId, selectedOption: reqOption, answer, bid } = req.body;
    // Fix: Frontend sends 'answer', Backend expected 'selectedOption'. Map them.
    const selectedOption = reqOption || answer;

    // 1. Validate Team & Room
    const team = await Team.findById(teamId);
    if (!team) return res.status(404).json({ error: "Team not found" });

    const roomId = team.roomId;
    if (!roomId) return res.status(400).json({ error: "Team not assigned to a room" });

    // 2. Fetch Question
    const question = await Question.findOne({ number: questionId });
    if (!question) return res.status(404).json({ error: "Question not found" });

    // 3. Check/Create Room State
    let roomState = await RoomQuestionState.findOne({ roomId, questionNumber: questionId });
    if (roomState && roomState.isAnswered) {
      return res.status(400).json({ error: "Question already locked for this room" });
    }

    if (!roomState) {
      roomState = new RoomQuestionState({ roomId, questionNumber: questionId });
    }

    // 4. Validate Logic
    // Normalize strings: Trim and Case-Insensitive for robustness
    const normalize = (str) => String(str || "").trim().toLowerCase();

    // Explicitly handle "TIME_UP" as a forced wrong answer
    const isTimeUp = selectedOption === "TIME_UP";
    const submittedNorm = normalize(selectedOption);
    const correctNorm = normalize(question.correct);

    const isCorrect = !isTimeUp && (submittedNorm === correctNorm);

    console.log(`[ANSWER CHECK] Q: ${questionId} | Team: ${team.name}`);
    console.log(`[ANSWER CHECK] In: "${selectedOption}" | Correct: "${question.correct}"`);
    console.log(`[ANSWER CHECK] Norm In: "${submittedNorm}" | Norm Correct: "${correctNorm}" | Result: ${isCorrect}`);

    // 5. Update State
    roomState.isAnswered = true;
    roomState.result = isCorrect ? "correct" : "wrong";
    roomState.answeredByTeamId = teamId;
    await roomState.save();

    // 6. Handle Money (Bid Logic)
    let updatedAdminBalance = null;

    if (bid && Number(bid) > 0) {
      const bidAmount = Number(bid);

      // STEP 1: Always Deduct Bid Amount initially (The "Investment")
      // This ensures the "Risk" is taken before evaluation
      console.log(`[GAME] Step 1: Deducting Bid ${bidAmount} from Team (Investment).`);
      team.balance = (team.balance || 0) - bidAmount;

      // STEP 2: Answer Evaluation
      if (isCorrect) {
        // STEP 2A: CORRECT => Reward = 2 * Bid
        // Final Balance = (Initial - Bid) + (2 * Bid) = Initial + Bid
        const reward = bidAmount * 2;
        console.log(`[GAME] Correct! Step 2A: Adding Reward ${reward} to team.`);
        team.balance += reward;
        // Admin balance UNCHANGED
      } else {
        // STEP 2B: WRONG => No Reward.
        // Final Balance = (Initial - Bid) + 0 = Initial - Bid
        // Bid amount credits to Admin
        console.log(`[GAME] Wrong! Step 2B: No Refund. Crediting ${bidAmount} to Admin.`);

        // Update Admin Balance (Only Room Admin)
        const updatedAdmin = await Admin.findOneAndUpdate(
          { roomId, role: 'admin' },
          { $inc: { balance: bidAmount } },
          { new: true }
        );

        if (updatedAdmin) {
          updatedAdminBalance = updatedAdmin.balance;
        }
      }

      // Save Team Balance
      await team.save();
    }

    // 7. Notify Room (Strict Events)
    if (req.io) {
      const roomChannel = `room:${roomId}`;

      // 1. Question Locked Event
      req.io.to(roomChannel).emit("question-locked", {
        questionNumber: questionId
      });

      if (bid && Number(bid) > 0) {
        if (isCorrect) {
          // 2. Correct Answer Event
          req.io.to(roomChannel).emit("team-balance-updated", {
            teamId: team._id,
            teamBalance: team.balance
          });
        } else {
          // 3. Incorrect Answer Event
          if (updatedAdminBalance !== null) {
            req.io.to(roomChannel).emit("admin-balance-updated", {
              adminBalance: updatedAdminBalance,
              teamId: team._id,
              teamBalance: team.balance
            });
          }
        }
      }

      // Keep legacy/generic update for components relying on full team object refresh
      req.io.to(roomChannel).emit("teamUpdate", team);
    }

    res.json({
      correct: isCorrect,
      result: roomState.result,
      team // Return updated team
    });

  } catch (err) {
    console.error("Submit error:", err);
    res.status(500).json({ error: err.message });
  }
};

/* ============================= */
/* GET ALL QUESTIONS (MERGED) */
/* ============================= */
export const getQuestions = async (req, res) => {
  try {
    let { roomId } = req.query;

    // SECURITY: If Admin, force their room
    const adminRoomId = getAdminRoomId(req);
    if (adminRoomId) {
      roomId = adminRoomId;
    }

    const questions = await Question.find({}).sort({ number: 1 });

    if (!roomId) {
      return res.json(questions);
    }

    // Fetch room states
    const states = await RoomQuestionState.find({ roomId });
    const stateMap = {};
    states.forEach(s => stateMap[s.questionNumber] = s);

    const merged = questions.map(q => {
      const s = stateMap[q.number];
      return {
        ...q.toObject(),
        locked: s ? s.isAnswered : false,
        result: s ? s.result : null
      };
    });

    res.json(merged);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* ============================= */
/* GET SINGLE QUESTION */
/* ============================= */
export const getQuestion = async (req, res) => {
  try {
    const { id } = req.params; // Number
    let { roomId } = req.query;

    // SECURITY: If Admin, force their room
    const adminRoomId = getAdminRoomId(req);
    if (adminRoomId) {
      roomId = adminRoomId;
    }

    const question = await Question.findOne({ number: id });
    if (!question) return res.status(404).json({ error: "Question not found" });

    let merged = question.toObject();

    if (roomId) {
      const state = await RoomQuestionState.findOne({ roomId, questionNumber: id });
      if (state) {
        merged.locked = state.isAnswered;
        merged.result = state.result;
      } else {
        merged.locked = false;
        merged.result = null;
      }
    }

    res.json(merged);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* ============================= */
/* USE LIFELINE */
/* ============================= */
export const useLifeline = async (req, res) => {
  try {
    const { type, teamId, questionId } = req.body;
    // type: "50-50", "QUESTION-SWAP", "EXTRA-TIME"

    const team = await Team.findById(teamId);
    // Check for null or undefined team
    if (!team) return res.status(404).json({ error: "Team not found" });

    // Defensive: Ensure lifelines array exists
    if (!team.lifelines) team.lifelines = [];

    // Check if used
    const existingUsage = team.lifelines.find(l => l && l.hasOwnProperty(type));
    if (existingUsage && existingUsage[type] === true) {
      return res.status(400).json({ error: "Lifeline already used" });
    }

    // Check global limit
    // Defensive check inside reduce to handle potential malformed objects
    const usedCount = team.lifelines.reduce((acc, curr) => {
      if (!curr) return acc;
      return acc + (Object.values(curr)[0] === true ? 1 : 0);
    }, 0);

    if (usedCount >= 2) return res.status(400).json({ error: "Max 2 lifelines used" });

    // Mark as used
    team.lifelines = team.lifelines.filter(l => !l.hasOwnProperty(type));
    team.lifelines.push({ [type]: true });

    await team.save();

    // Logic for Question Swap
    if (type === "QUESTION-SWAP") {
      const roomId = team.roomId;
      if (roomId) {
        await RoomQuestionState.findOneAndUpdate(
          { roomId, questionNumber: questionId },
          { isAnswered: true, result: "swapped", answeredByTeamId: teamId },
          { upsert: true }
        );

        // Notify room
        if (req.io) {
          req.io.to(`room:${roomId}`).emit("question-locked", {
            questionNumber: questionId
          });
        }
      }
    }

    // Return updated team AND updated question (if swap happened)
    // If swap, the client might fetch next question or we just return success.

    res.json({ success: true, team });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

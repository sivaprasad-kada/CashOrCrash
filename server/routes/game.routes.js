import express from "express";
import { submitAnswer, getQuestions, getQuestion, useLifeline } from "../controllers/game.controller.js";

const router = express.Router();

router.get("/questions", getQuestions);
router.get("/question/:id", getQuestion);
router.post("/answer", submitAnswer);
router.post("/lifeline", useLifeline);

export default router;

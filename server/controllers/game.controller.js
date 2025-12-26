import Question from "../models/Question.model.js";

export const submitAnswer = async (req, res) => {
  const { questionId, selectedOption } = req.body;

  const question = await Question.findOne({ number: questionId });

  if (!question || question.locked) {
    return res.status(400).json({ message: "Question already locked" });
  }

  const isCorrect = question.correct === selectedOption;

  question.locked = true;
  question.result = isCorrect ? "correct" : "wrong";

  await question.save();

  // 🔔 notify all clients
  req.io.emit("questionLocked", {
    questionId,
    result: question.result
  });

  res.json({
    correct: isCorrect,
    result: question.result
  });
};

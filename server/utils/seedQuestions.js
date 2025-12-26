import mongoose from "mongoose";
import dotenv from "dotenv";
import Question from "../models/Question.model.js";

dotenv.config();

await mongoose.connect(process.env.MONGO_URI);

/* wipe existing questions */
await Question.deleteMany({});

const questions = Array.from({ length: 100 }, (_, i) => ({
  number: i + 1,
  text: `What is the output of code snippet ${i + 1}?`,
  options: [
    "A. Compilation Error",
    "B. Runtime Error",
    "C. Correct Output",
    "D. Undefined Behavior"
  ],
  correct: ["A", "B", "C", "D"][i % 4],
  locked: false,
  result: null
}));

await Question.insertMany(questions);

console.log("✅ 100 Coding Questions Seeded");
process.exit();

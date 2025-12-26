import mongoose from "mongoose";

const QuestionSchema = new mongoose.Schema({
  number: { type: Number, required: true, unique: true },
  text: { type: String, required: true },
  options: { type: [String], required: true },
  correct: { type: String, required: true },

  locked: { type: Boolean, default: false },
  result: { type: String, enum: ["correct", "wrong", "swapped", null], default: null },

  // 🔑 lifeline metadata
  // 🔑 lifeline metadata (true = available, false = used)
  fiftyFifty: { type: Boolean, default: true },
  questionSwap: { type: Boolean, default: true },
  freezeOpponent: { type: Boolean, default: true },

  // [NEW] Enhanced Question Fields
  type: { type: String, enum: ["text", "image"], default: "text" },
  image: { type: String, default: null }, // e.g. "/uploads/questions/q1.jpeg"
  category: { type: String, default: "General" },
  timeLimit: { type: Number, default: 30 } // Seconds
});

export default mongoose.model("Question", QuestionSchema);

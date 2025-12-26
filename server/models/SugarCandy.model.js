import mongoose from "mongoose";

const SugarCandySchema = new mongoose.Schema({
    percentage: { type: Number, required: true, enum: [10, 20, 30, 40, 50], unique: true },
    question: { type: String, required: true },
    options: { type: [String], default: ["Approved", "Disapproved"] },
    correctAnswer: { type: String, default: "Approved" },
    createdAt: { type: Date, default: Date.now }
});

export default mongoose.model("SugarCandy", SugarCandySchema);

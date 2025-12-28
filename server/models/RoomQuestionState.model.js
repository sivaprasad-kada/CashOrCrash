import mongoose from "mongoose";

const RoomQuestionStateSchema = new mongoose.Schema({
    roomId: { type: mongoose.Schema.Types.ObjectId, ref: "Room", required: true },
    questionNumber: { type: Number, required: true },

    isAnswered: { type: Boolean, default: false },
    result: { type: String, enum: ["correct", "wrong", "swapped", "approved", "not_approved", null], default: null },

    answeredByTeamId: { type: mongoose.Schema.Types.ObjectId, ref: "Team", default: null },
    answeredAt: { type: Date, default: Date.now }
});

// Compound index to ensure unique state per question per room
RoomQuestionStateSchema.index({ roomId: 1, questionNumber: 1 }, { unique: true });

export default mongoose.model("RoomQuestionState", RoomQuestionStateSchema);

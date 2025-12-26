import mongoose from "mongoose";

const GameStateSchema = new mongoose.Schema({
    currentQuestionId: { type: Number, default: null },
    activeTeamId: { type: mongoose.Schema.Types.ObjectId, ref: "Team", default: null },
    phase: { type: String, enum: ["IDLE", "BIDDING", "LOCKED", "REVEAL"], default: "IDLE" },
    isGameActive: { type: Boolean, default: false },
    startedByAdminId: { type: mongoose.Schema.Types.ObjectId, ref: "Admin", default: null }, // Track who started session
    roomId: { type: mongoose.Schema.Types.ObjectId, ref: "Room" }, // Scope to room
    updatedAt: { type: Date, default: Date.now }
});

// Ensure only one document exists
export default mongoose.model("GameState", GameStateSchema);

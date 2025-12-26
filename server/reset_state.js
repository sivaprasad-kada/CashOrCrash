import mongoose from "mongoose";
import GameState from "./models/GameState.model.js";

const MONGO_URI = "mongodb://localhost:27017/cash-or-crash";

async function run() {
    await mongoose.connect(MONGO_URI);
    console.log("Connected to DB");

    // Upsert to ensure it exists and is reset
    const state = await GameState.findOneAndUpdate(
        {},
        { currentQuestionId: null },
        { new: true, upsert: true }
    );
    console.log("Reset Game State:", state);

    await mongoose.disconnect();
}

run().catch(console.error);

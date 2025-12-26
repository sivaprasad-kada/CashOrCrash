import mongoose from "mongoose";
import GameState from "./models/GameState.model.js"; // Adjust path if needed

const MONGO_URI = "mongodb://localhost:27017/cash-or-crash";

async function run() {
    await mongoose.connect(MONGO_URI);
    console.log("Connected to DB");

    const state = await GameState.findOne();
    console.log("Current Game State:", state);

    await mongoose.disconnect();
}

run().catch(console.error);

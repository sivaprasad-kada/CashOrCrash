import mongoose from "mongoose";
import GameState from "./models/GameState.model.js";

const MONGO_URI = "mongodb://localhost:27017/cash-or-crash";

async function run() {
    await mongoose.connect(MONGO_URI);
    console.log("Connected to DB");

    const count = await GameState.countDocuments();
    console.log("Total GameState Documents:", count);

    const all = await GameState.find();
    console.log("All States:", JSON.stringify(all, null, 2));

    // Clean up if > 1
    if (count > 1) {
        console.log("Cleaning up extra states...");
        await GameState.deleteMany({});
        await GameState.create({ currentQuestionId: null });
        console.log("Reset to single clean state.");
    }

    await mongoose.disconnect();
}

run().catch(console.error);

import mongoose from "mongoose";
import Question from "./models/Question.model.js";

const MONGO_URI = "mongodb://localhost:27017/cash-or-crash"; // Check actual URI if needed

async function run() {
    await mongoose.connect(MONGO_URI);
    console.log("Connected to DB");

    // 1. Find Question 1 (or any)
    let q = await Question.findOne({ number: 1 });
    if (!q) {
        // Create if missing for test
        q = await Question.create({
            number: 1, text: "Test Q", options: ["A", "B", "C", "D"], correct: "A"
        });
    }

    console.log("Initial state:", {
        fiftyFifty: q.fiftyFifty,
        questionSwap: q.questionSwap,
        freezeOpponent: q.freezeOpponent
    });

    // 2. Simulate Usage
    q.fiftyFifty = false;
    await q.save();
    console.log("Saved fiftyFifty = false");

    // 3. Fetch again
    const q2 = await Question.findOne({ number: 1 });
    console.log("Fetched state:", {
        fiftyFifty: q2.fiftyFifty,
        questionSwap: q2.questionSwap,
        freezeOpponent: q2.freezeOpponent
    });

    if (q2.fiftyFifty === false) {
        console.log("SUCCESS: Database persistence confirmed.");
    } else {
        console.log("FAILURE: Database did not persist.");
    }

    await mongoose.disconnect();
}

run().catch(console.error);

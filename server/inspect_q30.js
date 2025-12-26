import mongoose from "mongoose";
import Question from "./models/Question.model.js";

const MONGO_URI = "mongodb://localhost:27017/cash-or-crash";

async function run() {
    await mongoose.connect(MONGO_URI);
    console.log("Connected to DB");

    const q = await Question.findOne({ number: 30 });
    console.log("Question 30:", JSON.stringify(q, null, 2));

    await mongoose.disconnect();
}

run().catch(console.error);

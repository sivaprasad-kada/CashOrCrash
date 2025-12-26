import mongoose from "mongoose";
import Question from "./models/Question.model.js";

const MONGO_URI = "mongodb://localhost:27017/cash-or-crash";

async function run() {
    await mongoose.connect(MONGO_URI);
    console.log("Connected to DB");

    const count = await Question.countDocuments();
    console.log("Total Questions:", count);

    const first = await Question.findOne();
    console.log("First Question:", first);

    await mongoose.disconnect();
}

run().catch(console.error);

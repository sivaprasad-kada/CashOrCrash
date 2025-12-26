import mongoose from "mongoose";
import Question from "./models/Question.model.js";

const MONGO_URI = "mongodb://localhost:27017/cash-or-crash";

async function run() {
    await mongoose.connect(MONGO_URI);
    console.log("Connected to DB");

    const count = await Question.countDocuments();
    if (count < 100) {
        console.log(`Only ${count} questions found. Seeding up to 100...`);

        const newQuestions = [];
        for (let i = count + 1; i <= 100; i++) {
            newQuestions.push({
                number: i,
                text: `Test Question ${i}: Which data type is not primitive?`,
                options: ["Object", "String", "Number", "Boolean"],
                correct: "Object",
                fiftyFifty: true,
                questionSwap: true,
                freezeOpponent: true
            });
        }

        if (newQuestions.length > 0) {
            await Question.insertMany(newQuestions);
            console.log(`Inserted ${newQuestions.length} dummy questions.`);
        }
    } else {
        console.log("DB already has 100+ questions.");
    }

    await mongoose.disconnect();
}

run().catch(console.error);

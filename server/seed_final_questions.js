import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Question from './models/Question.model.js';
import { connectDB } from './config/db.js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

const seedQuestions = async () => {
    try {
        await connectDB();
        console.log("✅ Connected to Database");

        // Read final.json

        const finalJsonPath = path.join(__dirname, 'final.json');
        const data = await fs.readFile(finalJsonPath, 'utf-8');
        let questions = JSON.parse(data);

        console.log(`📄 Found ${questions.length} questions in final.json`);

        // Fix questions with empty 'correct' or 'text' field
        questions = questions.map(q => {
            if (q.correct === "" || q.correct === null || q.correct === undefined) {
                q.correct = "MANUAL_APPROVAL";
            }
            if (q.text === "" || q.text === null || q.text === undefined) {
                q.text = q.type === 'image' ? "IMAGE QUESTION" : "QUESTION TEXT MISSING";
            }
            return q;
        });

        // Clear existing questions
        await Question.deleteMany({});
        console.log("🧹 Cleared existing questions");

        // Insert new questions
        await Question.insertMany(questions);
        console.log(`🌱 Successfully seeded ${questions.length} questions`);

        process.exit(0);
    } catch (error) {
        console.error("❌ Seed Error:", error);
        process.exit(1);
    }
};

seedQuestions();

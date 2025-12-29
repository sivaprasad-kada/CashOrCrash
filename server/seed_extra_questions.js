
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Question from './models/Question.model.js';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

const seedExtraQuestions = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to MongoDB");

        // 1. Check existing count
        const existingCount = await Question.countDocuments();
        console.log(`Current existing questions: ${existingCount}`);

        // 2. Read the new JSON file
        const jsonPath = path.join(__dirname, 'CARTTON AND RIDDELS FROM 100 TO 110.json');

        if (!fs.existsSync(jsonPath)) {
            throw new Error(`File not found: ${jsonPath}`);
        }

        const fileContent = fs.readFileSync(jsonPath, 'utf-8');
        const newQuestions = JSON.parse(fileContent);

        console.log(`Found ${newQuestions.length} raw questions.`);

        // 3. Filter and clean data to match Schema validation
        // Filter out items with empty keys effectively (empty text)
        const validQuestions = newQuestions.filter(q => q.text && q.text.trim() !== "");

        console.log(`Filtered down to ${validQuestions.length} valid questions (removed empty text entries).`);

        // 4. Generate Random Numbers Range
        // Start from 100 as requested
        const startNumber = 100;
        const totalNew = validQuestions.length;

        // Create array [100, 101, ..., 100 + totalNew - 1]
        let availableNumbers = [];
        for (let i = 0; i < totalNew; i++) {
            availableNumbers.push(startNumber + i);
        }

        // Shuffle the numbers (Fisher-Yates shuffle)
        for (let i = availableNumbers.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [availableNumbers[i], availableNumbers[j]] = [availableNumbers[j], availableNumbers[i]];
        }

        // 5. Assign new numbers and prepare for insertion
        const questionsToInsert = validQuestions.map((q, index) => {
            return {
                ...q,
                number: availableNumbers[index], // Overwrite with random number
                // Ensure other fields are preserved or set defaults if missing
                locked: q.locked || false,
                result: q.result || null,
                category: q.category || "General",
                // Fix for required 'correct' field: if empty, set Placeholder
                correct: (q.correct && q.correct.trim() !== "") ? q.correct : "ADMIN_APPROVAL"
            };
        });

        // 6. Insert
        console.log("Inserting new questions...");
        await Question.insertMany(questionsToInsert);

        console.log("Successfully inserted extra questions!");
        console.log("New Questions Mapping (First 5):");
        questionsToInsert.slice(0, 5).forEach(q => {
            console.log(`- Original Text: "${q.text.substring(0, 20)}..." -> New Number: ${q.number}`);
        });

    } catch (error) {
        console.error("Error seeding extra questions:", error);
    } finally {
        await mongoose.disconnect();
        console.log("Disconnected from MongoDB");
    }
};

seedExtraQuestions();

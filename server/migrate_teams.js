import mongoose from "mongoose";
import dotenv from "dotenv";
import Team from "./models/Team.model.js";

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/cashorcrash";

const migrateTeams = async () => {
    try {
        await mongoose.connect(MONGO_URI);
        console.log("Connected to MongoDB...");

        const teams = await Team.find({});
        console.log(`Found ${teams.length} teams. Processing...`);

        for (const team of teams) {
            // Reset lifelines to the new structure
            // We are forcefully resetting them to ensure they match the [Object] schema defined in the model
            const newLifelines = [
                { "50-50": false },
                { "QUESTION-SWAP": false },
                { "EXTRA-TIME": false }
            ];

            // Mongoose might struggle with Mixed types unless we are explicit
            // We update using findOneAndUpdate to strip out old schema residue effectively
            await Team.findByIdAndUpdate(team._id, {
                $set: { lifelines: newLifelines }
            });

            console.log(`Updated team: ${team.name}`);
        }

        console.log("Migration Complete.");
        process.exit();
    } catch (err) {
        console.error("Migration Failed:", err);
        process.exit(1);
    }
};

migrateTeams();

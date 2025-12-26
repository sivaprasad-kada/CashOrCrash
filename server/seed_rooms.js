import mongoose from "mongoose";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import Room from "./models/Room.model.js";
import Team from "./models/Team.model.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, ".env") });

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/cash-or-crash";

const seed = async () => {
    try {
        await mongoose.connect(MONGO_URI);
        console.log("Connected to MongoDB.");

        // 1. Create Rooms
        const roomNames = ["Room A", "Room B"];
        const rooms = [];

        for (const name of roomNames) {
            let room = await Room.findOne({ name });
            if (!room) {
                room = await Room.create({ name });
                console.log(`Created Room: ${name}`);
            }
            rooms.push(room);
        }

        // 2. Migrate Existing Teams
        const teams = await Team.find({ roomId: { $exists: false } });
        if (teams.length > 0) {
            console.log(`Migrating ${teams.length} teams to ${rooms[0].name}...`);
            for (const team of teams) {
                team.roomId = rooms[0]._id;
                await team.save();
            }
            console.log("Teams migrated.");
        } else {
            console.log("No teams need migration.");
        }

        console.log("Seeding complete.");
        process.exit(0);
    } catch (err) {
        console.error("Seeding failed:", err);
        process.exit(1);
    }
};

seed();

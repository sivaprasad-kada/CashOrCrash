import mongoose from "mongoose";
import dotenv from "dotenv";
import Team from "../models/Team.model.js";

dotenv.config();

await mongoose.connect(process.env.MONGO_URI);

await Team.deleteMany();

const teams = Array.from({ length: 30 }, (_, i) => ({
  name: `Team ${i + 1}`,
  balance: 10000,
  lifelines: 2
}));

await Team.insertMany(teams);

console.log("✅ 30 Teams Seeded");
process.exit();

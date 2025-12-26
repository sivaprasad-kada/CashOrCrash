import mongoose from "mongoose";

const RoomSchema = new mongoose.Schema({
    name: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
});

export default mongoose.model("Room", RoomSchema);

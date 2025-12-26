import mongoose from "mongoose";

const AdminSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true }, // Plain text for "basic" requirement
    role: { type: String, enum: ["root", "admin"], default: "admin" },
    balance: { type: Number, default: 0 }, // [NEW] Track lost money collected by admin
    status: { type: String, enum: ["active", "inactive"], default: "inactive" }, // [NEW] Track login status
    roomId: { type: mongoose.Schema.Types.ObjectId, ref: "Room" } // [NEW] Selected room for this admin session
});

export default mongoose.model("Admin", AdminSchema);

import express from "express";
import Room from "../models/Room.model.js";

const router = express.Router();

// Get ALL rooms
router.get("/", async (req, res) => {
    try {
        const rooms = await Room.find();
        res.json(rooms);
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch rooms" });
    }
});

// Create Room (Root only - protected by auth middleware usually, but here we assume caller has rights or open for this internal app)
router.post("/", async (req, res) => {
    try {
        const { name } = req.body;
        if (!name) return res.status(400).json({ error: "Name required" });
        const newRoom = await Room.create({ name });
        res.json(newRoom);
    } catch (err) {
        res.status(500).json({ error: "Failed to create room" });
    }
});

export default router;

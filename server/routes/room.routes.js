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

export default router;

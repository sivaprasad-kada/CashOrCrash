import express from "express";
import GameState from "../models/GameState.model.js";

const router = express.Router();

// GET current state (Create if missing)
router.get("/", async (req, res) => {
    try {
        const { roomId } = req.query;
        let query = {};
        if (roomId) query.roomId = roomId;

        let state = await GameState.findOne(query);
        if (!state && roomId) {
            state = await GameState.create({ roomId });
        } else if (!state) {
            // Global/Fallback state if no roomId provided (backward compatibility)
            state = await GameState.findOne({}) || await GameState.create({});
        }
        res.json(state);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// UPDATE state
router.put("/", async (req, res) => {
    try {
        const { roomId } = req.body; // Expect roomId in body for updates
        // If roomId is in query params? Frontend might send it there or body.
        // Let's check body first.

        let filters = {};
        if (roomId) filters.roomId = roomId;
        else if (req.query.roomId) filters.roomId = req.query.roomId;

        // Safety: If no roomId, we might update the global one or arbitrary one. 
        // For now, allow it but prefer scoped.

        const update = { ...req.body, updatedAt: Date.now() };
        const options = { new: true, upsert: true };

        const state = await GameState.findOneAndUpdate(filters, update, options);
        res.json(state);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

export default router;

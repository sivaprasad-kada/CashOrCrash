import express from "express";
import GameState from "../models/GameState.model.js";

const router = express.Router();

// GET current state (Create if missing)
router.get("/", async (req, res) => {
    try {
        let state = await GameState.findOne();
        if (!state) {
            state = await GameState.create({});
        }
        res.json(state);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// UPDATE state
router.put("/", async (req, res) => {
    try {
        const filters = {}; // Update first found
        const update = { ...req.body, updatedAt: Date.now() };
        const options = { new: true, upsert: true };

        const state = await GameState.findOneAndUpdate(filters, update, options);
        res.json(state);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

export default router;

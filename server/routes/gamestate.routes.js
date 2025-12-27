import express from "express";
import GameState from "../models/GameState.model.js";
import jwt from "jsonwebtoken";

const router = express.Router();

const getAdminRoomId = (req) => {
    const token = req.cookies.token; // Changed to 'token' to match adminAuth/controller
    if (!token) return null;
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || "secret");
        return decoded.roomId;
    } catch (e) {
        return null;
    }
};

// GET current state
router.get("/", async (req, res) => {
    try {
        let { roomId } = req.query;

        // SECURITY: If Admin is logged in, forced to their room
        const adminRoomId = getAdminRoomId(req);
        if (adminRoomId) {
            roomId = adminRoomId;
        }

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
        let { roomId } = req.body;

        // SECURITY: If Admin, force their room for updates
        const adminRoomId = getAdminRoomId(req);
        if (adminRoomId) {
            roomId = adminRoomId;
        } else {
            // If not admin, maybe check body or query (for Teams? Teams ideally shouldn't control GameState)
            // But for now, preserve existing behavior for non-admins if any
            if (!roomId && req.query.roomId) roomId = req.query.roomId;
        }

        let filters = {};
        if (roomId) filters.roomId = roomId;

        const update = { ...req.body, updatedAt: Date.now() };
        // Prevent accidental roomId overwrite
        delete update.roomId;

        const options = { new: true, upsert: true };

        const state = await GameState.findOneAndUpdate(filters, update, options);
        res.json(state);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

export default router;

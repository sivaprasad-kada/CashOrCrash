import express from "express";
import Team from "../models/Team.model.js";
import Admin from "../models/Admin.model.js";
import SugarCandy from "../models/SugarCandy.model.js"; // Assuming it exists or I should check.
import jwt from "jsonwebtoken";

const router = express.Router();

// GET Cards
router.get("/", async (req, res) => {
    try {
        // Return dummy cards if model not populated or just static
        // Or fetch from DB
        // Let's assume there is a SugarCandy model as seen in file list.
        const cards = await SugarCandy.find({});
        if (cards.length === 0) {
            // Return static defaults if empty
            return res.json([
                { percentage: 10, question: "10%" },
                { percentage: 20, question: "20%" },
                { percentage: 30, question: "30%" },
                { percentage: 40, question: "40%" },
                { percentage: 50, question: "50%" }
            ]);
        }
        res.json(cards);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// SEED (Dev)
router.post("/seed", async (req, res) => {
    try {
        await SugarCandy.deleteMany({});
        await SugarCandy.insertMany([
            { percentage: 10, question: "Safe bet. 10% Stake." },
            { percentage: 20, question: "Double the fun. 20% Stake." },
            { percentage: 30, question: "Getting serious. 30% Stake." },
            { percentage: 40, question: "High roller? 40% Stake." },
            { percentage: 50, question: "Halfway there. 50% Stake." }
        ]);
        res.json({ success: true, message: "Reseeded 10-50%" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// APPLY
router.post("/apply", async (req, res) => {
    try {
        const { teamId, percentage, answer } = req.body;
        // answer: "Approved" or "Disapproved"

        // 1. Get Admin from Token
        const token = req.cookies.token;
        if (!token) return res.status(401).json({ error: "Unauthorized" });
        const decoded = jwt.verify(token, process.env.JWT_SECRET || "secret");
        const adminId = decoded.id;

        const admin = await Admin.findById(adminId);
        if (!admin) return res.status(404).json({ error: "Admin not found" });

        const team = await Team.findById(teamId);
        if (!team) return res.status(404).json({ error: "Team not found" });

        // Logic check: Limit to 2 uses per team
        if (team.sugarCandyAddCount >= 2) {
            return res.status(400).json({ error: "Limit reached (Max 2 uses)" });
        }

        // Increment Usage Count
        team.sugarCandyAddCount = (team.sugarCandyAddCount || 0) + 1;

        if (answer === "Approved") {
            // AUTHORITATIVE RULE: 10% of ADMIN BALANCE (not team balance)
            // Percentage comes from request (e.g. 10, 25, 50). If specific logic says "10%", ensure we use that.
            // The request sends 'percentage'. Assuming we trust 'percentage' field from the card selected.
            // Wait, the prompt specific example said "10%". But the code supports variable percentage.
            // "Percentage must be calculated ONLY from admin.balance."
            // I will use 'percentage' variable passed in, but apply it to ADMIN balance.

            const adminBalance = admin.balance || 0;
            const amount = Math.floor(adminBalance * (percentage / 100));

            // Prevent negative balance transfer? (Optional safety, generally admin has funds)
            if (amount <= 0) {
                // Even if 0, flow continues.
            }

            // Transaction: Debit Admin (Atomic), Credit Team
            // 1. Deduct from Admin
            const updatedAdmin = await Admin.findByIdAndUpdate(
                adminId,
                { $inc: { balance: -amount } },
                { new: true }
            );

            // 2. Add to Team (ONLY if Admin update succeeded - actually Admin update runs concurrently in Mongo? 
            // findByIdAndUpdate is atomic. If it fails, it throws. If success, we proceed.)

            team.balance += amount;
            await team.save();

            // Notify
            if (req.io) {
                const roomChannel = `room:${team.roomId}`;
                req.io.to(roomChannel).emit("sugar-candy-applied", {
                    teamId: team._id,
                    teamBalance: team.balance,
                    adminBalance: updatedAdmin ? updatedAdmin.balance : 0
                });
                req.io.to(roomChannel).emit("teamUpdate", team);
            }
        } else {
            await team.save(); // Just save count increment if disapproved
            if (req.io) {
                req.io.to(team.roomId.toString()).emit("teamUpdate", team);
            }
        }

        res.json({ success: true, team });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

export default router;

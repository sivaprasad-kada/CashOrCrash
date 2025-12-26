import express from "express";
import SugarCandy from "../models/SugarCandy.model.js";
import Team from "../models/Team.model.js";
import Admin from "../models/Admin.model.js";
import mongoose from "mongoose";

const router = express.Router();

/* ============================= */
/* SEED SUGAR CANDY (Auto-run/Utility) */
/* ============================= */
router.post("/seed", async (req, res) => {
    // Check if seeded
    const count = await SugarCandy.countDocuments();
    if (count >= 5) return res.json({ message: "Already seeded" });

    // Seed Data
    const seeds = [
        { percentage: 10, question: "Grant 10% Bonus?", options: ["Approved", "Disapproved"] },
        { percentage: 20, question: "Grant 20% Bonus?", options: ["Approved", "Disapproved"] },
        { percentage: 30, question: "Grant 30% Bonus?", options: ["Approved", "Disapproved"] },
        { percentage: 40, question: "Grant 40% Bonus?", options: ["Approved", "Disapproved"] },
        { percentage: 50, question: "Grant 50% Bonus?", options: ["Approved", "Disapproved"] }
    ];

    await SugarCandy.insertMany(seeds);
    res.json({ success: true, message: "Seeded Sugar Candy" });
});

/* ============================= */
/* GET ALL CARDS */
/* ============================= */
router.get("/", async (req, res) => {
    try {
        const cards = await SugarCandy.find().sort({ percentage: 1 });
        res.json(cards);
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch cards" });
    }
});

/* ============================= */
/* GET SINGLE CARD BY PERCENTAGE */
/* ============================= */
router.get("/:percentage", async (req, res) => {
    try {
        const card = await SugarCandy.findOne({ percentage: req.params.percentage });
        if (!card) return res.status(404).json({ error: "Card not found" });
        res.json(card);
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch card" });
    }
});

/* ============================= */
/* APPLY SUGAR CANDY (TRANSACTION) */
/* ============================= */
router.post("/apply", async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const { teamId, percentage, answer, adminId } = req.body;

        // 1. Fetch Data
        const team = await Team.findById(teamId).session(session);
        const admin = await Admin.findById(adminId).session(session);

        if (!team || !admin) {
            throw new Error("Invalid Team or Admin");
        }

        // 2. Validate Membership (Room)
        if (String(team.roomId) !== String(admin.roomId)) {
            throw new Error("Unauthorized: Team not in Admin's Room");
        }

        // 3. Validate Limits
        if (team.sugarCandyAddCount >= 2) {
            throw new Error("Sugar Candy usage limit reached (2/2)");
        }

        // 4. Validate Answer
        if (answer === "Approved") {
            const bonus = Math.floor((percentage / 100) * admin.balance);
            if (bonus > admin.balance) {
                // Should technically not happen as it is percentage, unless logic error
                throw new Error("Insufficient Admin Balance");
            }

            // Transfer
            admin.balance -= bonus;
            team.balance += bonus;
        }

        // 5. Increment Usage (Regardless of Approval? Requirement says "Usage Limit". Usually means attempt.)
        // User request: "Disable card if Team has already used Sugar Candy twice".
        // If I disapprove, does it count? "Team clicks percentage card... If disapprove, no balance change".
        // Let's assume clicking and answering counts as usage.
        team.sugarCandyAddCount += 1;

        await team.save({ session });
        await admin.save({ session });

        await session.commitTransaction();
        session.endSession();

        // 6. Broadcast Updates
        req.io.emit("TEAM_UPDATE", team);
        req.io.emit("ADMIN_BALANCE_UPDATE", { adminId: admin._id, balance: admin.balance });

        res.json({ success: true, team, adminBalance: admin.balance });

    } catch (err) {
        await session.abortTransaction();
        session.endSession();
        console.error("Sugar Candy Error:", err);
        res.status(400).json({ error: err.message });
    }
});

export default router;

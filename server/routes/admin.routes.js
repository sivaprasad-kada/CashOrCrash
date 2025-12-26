import express from "express";
import Admin from "../models/Admin.model.js";

const router = express.Router();

/* ============================= */
/* LOGIN */
/* ============================= */
router.post("/login", async (req, res) => {
    try {
        const { username, password, roomId } = req.body;
        const admin = await Admin.findOne({ username });

        if (!admin || admin.password !== password) {
            return res.status(401).json({ error: "Invalid credentials" });
        }

        // [UPDATED] Set status to active and assign room
        admin.status = "active";
        if (roomId) admin.roomId = roomId;
        await admin.save();

        res.json({
            success: true,
            user: {
                id: admin._id,
                username: admin.username,
                role: admin.role,
                status: admin.status,
                roomId: admin.roomId // Return selected room
            }
        });
    } catch (err) {
        res.status(500).json({ error: "Login failed" });
    }
});

/* ============================= */
/* LOGOUT */
/* ============================= */
router.post("/logout", async (req, res) => {
    try {
        const { username } = req.body; // Or pass ID
        // For simplicity, if we have ID from client context, use that.
        // But the previous login returned user object.
        // Let's accept username or ID.
        if (!username) return res.status(400).json({ error: "Username required" });

        const admin = await Admin.findOne({ username });
        if (admin) {
            admin.status = "inactive";
            await admin.save();
        }
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: "Logout failed" });
    }
});

/* ============================= */
/* CHECK GLOBAL ADMIN STATUS */
/* ============================= */
router.get("/status", async (req, res) => {
    try {
        const activeAdmin = await Admin.findOne({ status: "active" });
        res.json({ hasActiveAdmin: !!activeAdmin });
    } catch (err) {
        res.status(500).json({ error: "Failed to check status" });
    }
});

/* ============================= */
/* ADD ADMIN (Protected logic handled on client for now) */
/* ============================= */
router.post("/add", async (req, res) => {
    try {
        const { username, password, role } = req.body;

        // Simple check: Don't allow creating another root via API casually (optional)
        // For this app, we trust the caller (authenticated root on frontend)

        const newAdmin = new Admin({
            username,
            password,
            role: role || "admin"
        });

        await newAdmin.save();
        res.json(newAdmin);
    } catch (err) {
        res.status(500).json({ error: "Failed to create admin" });
    }
});

/* ============================= */
/* GET ALL ADMINS */
/* ============================= */
router.get("/", async (req, res) => {
    try {
        const admins = await Admin.find({}, "-password"); // Hide passwords
        res.json(admins);
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch admins" });
    }
});

/* ============================= */
/* DELETE ADMIN */
/* ============================= */
router.delete("/:id", async (req, res) => {
    try {
        await Admin.findByIdAndDelete(req.params.id);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: "Failed to delete" });
    }
});

/* ============================= */
/* UPDATE TEAM RESOURCES (Tokens/Candy) */
/* ============================= */
router.post("/update-team-resources", async (req, res) => {
    try {
        const { teamId, type, amount, adminId } = req.body;
        // type: "unityTokens" | "sugarCandy"
        // amount: Number to ADD

        const team = await import("../models/Team.model.js").then(m => m.default.findById(teamId));
        if (!team) return res.status(404).json({ error: "Team not found" });

        // Enforce Limits
        if (type === "unityTokens") {
            if (team.unityTokenAddCount >= 2) {
                return res.status(400).json({ error: "Limit reached: Cannot add UNITY TOKENS more than twice." });
            }
            team.unityTokens += amount;
            team.unityTokenAddCount += 1;
        } else if (type === "sugarCandy") {
            if (team.sugarCandyAddCount >= 2) {
                return res.status(400).json({ error: "Limit reached: Cannot add SUGAR CANDY more than twice." });
            }
            team.sugarCandy += amount;
            team.sugarCandyAddCount += 1;
        } else if (type === "balance") {
            // Money has no add limit
            team.balance += amount;
        }

        const sortedTeam = await team.save();

        // Broadcast Update to Game Clients
        if (req.io) {
            req.io.emit("TEAM_UPDATE", sortedTeam);
        }

        res.json({ success: true, team: sortedTeam });

    } catch (err) {
        console.error("Resource Update Error:", err);
        res.status(500).json({ error: "Failed to update resources" });
    }
});


/* ============================= */
/* ASSIGN ROOM TO TEAM */
/* ============================= */
router.post("/assign-team-room", async (req, res) => {
    try {
        const { teamId, roomId } = req.body;
        const team = await import("../models/Team.model.js").then(m => m.default.findById(teamId));
        if (!team) return res.status(404).json({ error: "Team not found" });

        team.roomId = roomId;
        await team.save();

        res.json({ success: true, team });
    } catch (err) {
        res.status(500).json({ error: "Failed to assign room" });
    }
});

export default router;

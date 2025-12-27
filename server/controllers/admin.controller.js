import Admin from "../models/Admin.model.js";
import Team from "../models/Team.model.js";
import jwt from "jsonwebtoken";
import crypto from "crypto";

/* ============================= */
/* LOGIN */
/* ============================= */
/* ============================= */
/* LOGIN */
/* ============================= */
export const loginAdmin = async (req, res) => {
    try {
        if (!req.body.username || !req.body.password) return res.status(400).json({ error: "Missing credentials" });
        const username = req.body.username.trim();
        const password = req.body.password;

        console.log(`[LOGIN ATTEMPT] User: ${username}`);

        // Escape special chars for regex
        const escapedUsername = username.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

        // Case insensitive search
        const admin = await Admin.findOne({ username: { $regex: new RegExp(`^${escapedUsername}$`, "i") } });
        if (!admin) {
            console.log("[LOGIN FAIL] Admin not found");
            return res.status(404).json({ error: "Admin not found" });
        }

        if (admin.password !== password) return res.status(401).json({ error: "Invalid password" });

        // 1. Generate Session ID
        const sessionId = crypto.randomBytes(16).toString("hex");

        let tokenPayload = {
            id: admin._id,
            role: admin.role,
            sessionId // Enforce Single Session
        };

        // 2. NORMAL ADMIN CHECK
        if (admin.role === "admin") {
            if (!admin.roomId) {
                return res.status(403).json({ error: "System Error: Admin has no assigned room." });
            }
            tokenPayload.roomId = admin.roomId;
        }

        // 3. Update DB (Enforce Single Session)
        admin.activeSessionId = sessionId;
        admin.status = "active";
        admin.isOnline = true;
        admin.lastActiveAt = new Date();
        await admin.save();

        // 4. Generate Token (24h)
        const token = jwt.sign(tokenPayload, process.env.JWT_SECRET || "secret", { expiresIn: "24h" });

        // 5. Set Cookie
        res.cookie("token", token, { httpOnly: true, secure: false, maxAge: 24 * 60 * 60 * 1000 });

        console.log(`[LOGIN SUCCESS] ${username} | Session: ${sessionId}`);

        res.json({ success: true, user: admin, roomId: tokenPayload.roomId });
    } catch (err) {
        console.error("Login Error:", err);
        res.status(500).json({ error: err.message });
    }
};

/* ============================= */
/* ROOT: ENTER ROOM */
/* ============================= */
export const enterRoom = async (req, res) => {
    try {
        const { roomId } = req.body;
        const token = req.cookies.token;
        if (!token) return res.status(401).json({ error: "Unauthorized" });

        const decoded = jwt.verify(token, process.env.JWT_SECRET || "secret");
        if (decoded.role !== "root") return res.status(403).json({ error: "Only Root can switch rooms" });

        // Issue new token with Room ID
        const newToken = jwt.sign(
            { id: decoded.id, role: "root", roomId },
            process.env.JWT_SECRET || "secret",
            { expiresIn: "1d" }
        );

        res.cookie("token", newToken, { httpOnly: true, secure: false });

        // Update DB status for tracking (optional)
        await Admin.findByIdAndUpdate(decoded.id, { roomId });

        res.json({ success: true, roomId });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

/* ============================= */
/* LOGOUT */
/* ============================= */
export const logoutAdmin = async (req, res) => {
    // Clear status
    const token = req.cookies.token;
    if (token) {
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET || "secret");
            await Admin.findByIdAndUpdate(decoded.id, { status: "inactive" });
        } catch (e) { }
    }

    res.clearCookie("token");
    res.json({ success: true });
};

/* ============================= */
/* GET ME */
/* ============================= */
export const getMe = async (req, res) => {
    try {
        const token = req.cookies.token;
        if (!token) return res.json({ success: false });

        const decoded = jwt.verify(token, process.env.JWT_SECRET || "secret");
        const admin = await Admin.findById(decoded.id).populate('roomId'); // Populate for UI 

        if (!admin) return res.json({ success: false });

        // Ensure we return the roomId from the TOKEN, which is the session of truth for Root
        // Actually, returning the admin object is fine, but for Root w/ temp room it might be different.
        // Let's attach the active room from token if Root.
        const responseData = admin.toObject();
        if (decoded.role === 'root' && decoded.roomId) {
            responseData.activeRoomId = decoded.roomId;
        }

        res.json({ success: true, admin: responseData });
    } catch (err) {
        res.json({ success: false });
    }
};

/* ============================= */
/* ADD ADMIN (ROOT) */
/* ============================= */
export const createAdmin = async (req, res) => {
    try {
        let { username, password, role, roomId } = req.body;
        username = username.trim().toLowerCase(); // Enforce lowercase for new admins

        if (role === 'admin' && !roomId) {
            return res.status(400).json({ error: "Regular admins MUST be assigned to a room." });
        }

        const newAdmin = await Admin.create({ username, password, role, roomId });
        res.json(newAdmin);
    } catch (err) {
        console.error("Create Admin Error:", err);
        if (err.code === 11000) {
            return res.status(400).json({ error: "Username already exists" });
        }
        res.status(500).json({ error: "Failed to create admin", details: err.message });
    }
};

/* ============================= */
/* LIST ADMINS */
/* ============================= */
export const getAdmins = async (req, res) => {
    try {
        const admins = await Admin.find({});
        res.json(admins);
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch admins" });
    }
};

/* ============================= */
/* ASSIGN TEAM ROOM */
/* ============================= */
export const assignTeamRoom = async (req, res) => {
    try {
        const { teamId, roomId } = req.body;
        const team = await Team.findByIdAndUpdate(teamId, { roomId }, { new: true });
        res.json(team);
    } catch (err) {
        res.status(500).json({ error: "Failed" });
    }
};

/* ============================= */
/* UPDATE RESOURCES */
/* ============================= */
export const updateTeamResources = async (req, res) => {
    try {
        const { teamId, type, amount, adminId } = req.body;
        // type: 'unityTokens' or 'sugarCandy'

        const team = await Team.findById(teamId);
        if (!team) return res.status(404).json({ error: "Team not found" });

        if (type === 'unityTokens') {
            const current = team.unityTokens || 0;
            if (current + amount > 2) return res.status(400).json({ error: "Max 2 Unity Tokens allowed" });
            team.unityTokens = current + amount;
        } else if (type === 'sugarCandy') {
            // Note: sugarCandy uses a separate counter for "additions" in some logic (e.g. sugarCandyAddCount),
            // but the prompt implies limiting the *adding* action or the *balance*.
            // Assuming "restrict that admin can add 2 candies" means resulting balance/count shouldn't exceed 2 OR added times.
            // Let's stick to balance limit = 2 based on phrasing "2 candies... per team"
            const current = team.sugarCandy || 0;
            if (current + amount > 2) return res.status(400).json({ error: "Max 2 Sugar Candies allowed" });
            team.sugarCandy = current + amount;
        }
        await team.save();
        res.json(team);
    } catch (err) {
        res.status(500).json({ error: "Failed to update resources" });
    }
};

/* ============================= */
/* GET ROOM ADMIN BALANCE */
/* ============================= */
export const getRoomAdminBalance = async (req, res) => {
    try {
        const { roomId } = req.params;
        if (!roomId) return res.status(400).json({ error: "Room ID required" });

        const admin = await Admin.findOne({ roomId, role: 'admin' });
        if (!admin) return res.status(404).json({ error: "No admin found for this room" });

        res.json({ success: true, balance: admin.balance, username: admin.username });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};


/* ============================= */
/* MANAGE TEAM LIFELINES */
/* ============================= */
export const updateTeamLifeline = async (req, res) => {
    try {
        const { teamId, lifelineName, action } = req.body;
        // action: 'reset' (restore to unused/available: false) or 'remove' (set to used: true)

        const team = await Team.findById(teamId);
        if (!team) return res.status(404).json({ error: "Team not found" });

        if (!team.lifelines) team.lifelines = [];

        // Mongoose Mixed Array update pitfall:
        // Direct modification of object inside mixed array sometimes doesn't persist even with markModified.
        // Solution: Clone, Modify, Reassign.

        let updatedLifelines = [...team.lifelines];
        const index = updatedLifelines.findIndex(l => Object.prototype.hasOwnProperty.call(l, lifelineName));

        // If action is 'remove', we set it to true (Used). 
        // If action is 'add' (restore), we set it to false (Not Used). (Frontend sends "reset" for this)
        const isUsedValue = action === 'remove';

        if (index > -1) {
            // Re-create the object completely
            updatedLifelines[index] = { [lifelineName]: isUsedValue };
        } else {
            updatedLifelines.push({ [lifelineName]: isUsedValue });
        }

        team.lifelines = updatedLifelines;
        team.markModified('lifelines');
        await team.save();

        res.json(team);

    } catch (err) {
        console.error("Lifeline Update Error:", err);
        res.status(500).json({ error: "Failed to update lifeline" });
    }
};

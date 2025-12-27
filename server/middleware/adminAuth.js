
import jwt from "jsonwebtoken";
import Admin from "../models/Admin.model.js";

export const adminAuth = async (req, res, next) => {
    try {
        const token = req.cookies.token;
        if (!token) return res.status(401).json({ error: "Unauthorized: No Token" });

        const decoded = jwt.verify(token, process.env.JWT_SECRET || "secret");

        // Single Session Check
        const admin = await Admin.findById(decoded.id);
        if (!admin) return res.status(401).json({ error: "Unauthorized: Admin not found" });

        // Force Logout if Session ID mismatch
        // Note: Old tokens might not have sessionId, so we check if it exists in DB.
        // If DB has session ID but token doesn't -> likely old token -> expire it.
        if (admin.activeSessionId && admin.activeSessionId !== decoded.sessionId) {
            return res.status(401).json({ error: "Session Expired: Logged in elsewhere" });
        }

        // Update Last Active
        admin.lastActiveAt = new Date();
        admin.isOnline = true;
        await admin.save();

        req.user = admin; // Attach full admin object
        req.roomId = decoded.roomId; // Attach room context from token
        req.role = decoded.role;
        next();
    } catch (err) {
        return res.status(401).json({ error: "Unauthorized: Invalid Token" });
    }
};

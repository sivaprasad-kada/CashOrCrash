import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "your_super_secret_key_123";

export const verifyToken = (req, res, next) => {
    const token = req.cookies.admin_token;

    if (!token) {
        return res.status(401).json({ error: "Access Denied. No Token Provided." });
    }

    try {
        const verified = jwt.verify(token, JWT_SECRET);
        req.admin = verified; // { id, username, role, roomId }
        next();
    } catch (err) {
        res.status(403).json({ error: "Invalid Token" });
    }
};

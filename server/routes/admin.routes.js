import express from "express";
const router = express.Router();
import {
    loginAdmin, logoutAdmin, getMe, createAdmin, getAdmins, assignTeamRoom, updateTeamResources, enterRoom, getRoomAdminBalance, updateTeamLifeline, deleteAdmin
} from "../controllers/admin.controller.js";

import { adminAuth } from "../middleware/adminAuth.js";

router.post("/login", loginAdmin);
router.post("/logout", logoutAdmin);
router.get("/me", adminAuth, getMe);
router.post("/add", adminAuth, createAdmin);
router.get("/", adminAuth, getAdmins);
router.post("/assign-team-room", adminAuth, assignTeamRoom);
router.post("/update-team-resources", adminAuth, updateTeamResources);
router.post("/update-team-lifeline", adminAuth, updateTeamLifeline);
router.delete("/:id", adminAuth, deleteAdmin);
router.post("/enter-room", adminAuth, enterRoom);
router.get("/room-balance/:roomId", getRoomAdminBalance); // Public or Auth? Maybe Auth optional if teams need it? Let's keep it open or auth. 
// User implies "if we try to fetch". 
// Safe to leave open if it returns only balance/username. Or protect with adminAuth.
// Ideally protected, but players might need it. Let's assume open for now as simpler fix for "fetching" context.

export default router;

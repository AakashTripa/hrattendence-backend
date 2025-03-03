import express from "express";
import { getAdminProfile, updateAdminProfile } from "../controllers/adminController.js";
import { verifyToken } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/profile", verifyToken, getAdminProfile);
router.put("/profile", verifyToken, updateAdminProfile);

export default router;

import express from "express";
import { getAdminProfile } from "../controllers/adminController.js";
import { verifyToken } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/profile", verifyToken, getAdminProfile);

export default router;

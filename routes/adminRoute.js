import express from "express";
import { getAdminProfile, updateAdminProfile, updatePassword } from "../controllers/adminController.js";
import { verifyToken } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/profile", verifyToken, getAdminProfile);
router.put("/update-profile", verifyToken, updateAdminProfile);
router.put("/change-password", verifyToken,updatePassword);

export default router;

import express from "express";
import {  employeeCount, getEmployeesByAdmin, registerEmployee } from "../controllers/employeeController.js";
import { verifyToken } from "../middleware/authMiddleware.js";

const router = express.Router();

// Protect employee registration with token verification
router.post("/register", verifyToken, registerEmployee);

router.get("/", verifyToken, getEmployeesByAdmin);
router.get("/count", verifyToken, employeeCount);

export default router;

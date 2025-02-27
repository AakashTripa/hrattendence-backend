import express from "express";
import {  getEmployeesByAdmin, registerEmployee } from "../controllers/employeeController.js";
import { verifyToken } from "../middleware/authMiddleware.js";

const router = express.Router();

// Protect employee registration with token verification
router.post("/register", verifyToken, registerEmployee);

router.get("/", verifyToken, getEmployeesByAdmin);

export default router;

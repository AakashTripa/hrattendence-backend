// routes/attendanceRouter.js
import express from "express";
import { submitAttendance, updateEmployeeAttendance } from "../controllers/attendenceController.js";

const router = express.Router();

// Route to submit attendance
router.post("/submit", submitAttendance);
router.put("/update/:emp_id", updateEmployeeAttendance);

export default router;
import express from 'express';
import { addOrUpdateSalary, getSalaryByEmpId } from '../controllers/salaryController.js';

const router = express.Router();

router.post('/salary', addOrUpdateSalary);
router.get('/salary/:emp_id', getSalaryByEmpId);

export default router;

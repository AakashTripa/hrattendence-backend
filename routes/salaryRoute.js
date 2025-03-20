import express from 'express';
import { addOrUpdateSalary, getEmployeeStatusAndSalary, getSalaryByEmpId } from '../controllers/salaryController.js';

const router = express.Router();

router.post('/salary', addOrUpdateSalary);
router.get('/salary/:emp_id', getSalaryByEmpId);
router.get('/:empId', getEmployeeStatusAndSalary);

export default router;

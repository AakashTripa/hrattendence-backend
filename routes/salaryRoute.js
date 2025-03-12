import express from 'express';
import { addOrUpdateSalary } from '../controllers/salaryController.js';

const router = express.Router();

router.post('/salary', addOrUpdateSalary);

export default router;

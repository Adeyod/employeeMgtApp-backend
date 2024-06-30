import express from 'express';
import { createDepartment } from '../controllers/departmentController.js';

const router = express.Router();

router.post('/create-department', createDepartment);

export default router;

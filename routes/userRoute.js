import express from 'express';
import {
  loginUser,
  regUser,
  emailVerification,
} from '../controllers/userController.js';

const router = express.Router();

router.post('/register-user', regUser);
router.post('/register-admin', regUser);
router.post('/login-user', loginUser);
router.post('/email-verification/:userId/:token', emailVerification);

export default router;

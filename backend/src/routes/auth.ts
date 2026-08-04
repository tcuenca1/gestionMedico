import express from 'express';
import rateLimit from 'express-rate-limit';
import { loginController } from '../controllers/authController';

const router = express.Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { message: 'Demasiados intentos. Intente de nuevo en 15 minutos.' },
  standardHeaders: true,
  legacyHeaders: false,
});

router.post('/login', loginLimiter, loginController);

export default router;

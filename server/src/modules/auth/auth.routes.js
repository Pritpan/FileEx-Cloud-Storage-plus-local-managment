import { Router } from 'express';
import * as authController from './auth.controller.js';
import authenticate from '../../middleware/authenticate.js';
import { loginLimiter, registerLimiter, refreshLimiter, apiLimiter, forgotPasswordLimiter, resetPasswordLimiter } from '../../middleware/rateLimiter.js';

const router = Router();

router.post('/register', registerLimiter, authController.register);
router.post('/login', loginLimiter, authController.login);
router.post('/refresh', refreshLimiter, authController.refresh);
router.post('/logout', authenticate, apiLimiter, authController.logout);

router.get('/me', authenticate, apiLimiter, authController.getMe);
router.patch('/me', authenticate, apiLimiter, authController.updateMe);

// Email verification
router.get('/verify-email', authController.verifyEmail);
router.post('/resend-verification', registerLimiter, authController.resendVerification);

// Account deletion
router.delete('/account', authenticate, apiLimiter, authController.deleteAccount);

router.post('/forgot-password', forgotPasswordLimiter, authController.forgotPassword);
router.post('/reset-password', resetPasswordLimiter, authController.resetPassword);
router.patch('/password', authenticate, apiLimiter, authController.changePassword);

export default router;

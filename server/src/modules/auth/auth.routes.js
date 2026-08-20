import { Router } from 'express';
import * as authController from './auth.controller.js';
import authenticate from '../../middleware/authenticate.js';

const router = Router();

router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/refresh', authController.refresh);
router.post('/logout', authController.logout);

router.get('/me', authenticate, authController.getMe);
router.patch('/me', authenticate, authController.updateMe);

export default router;

// =============================================================================
// auth.routes.js
//
// Responsibility: Route definitions only.
// Mounted at: /api/v1/auth  (registered in app.js)
// =============================================================================

import { Router } from 'express';
import * as authController from './auth.controller.js';
import authenticate from '../../middleware/authenticate.js';

const router = Router();

// Public routes — no token required
router.get ('/',          authController.getModuleStatus);
router.post('/register',  authController.register);
router.post('/login',     authController.login);
router.post('/logout',    authController.logout);

// Protected routes — valid access token required
router.get ('/me',        authenticate, authController.getMe);

export default router;

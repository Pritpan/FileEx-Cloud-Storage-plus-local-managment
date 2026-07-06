// =============================================================================
// auth.routes.js
//
// Responsibility: Define routes only.
// No business logic lives here. Every route delegates to the controller.
//
// Mounted at: /api/v1/auth  (registered in app.js)
// =============================================================================

import { Router } from 'express';
import * as authController from './auth.controller.js';

const router = Router();

// GET /api/v1/auth — module health check
router.get('/', authController.getModuleStatus);

export default router;

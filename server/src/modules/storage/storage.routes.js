import { Router } from 'express';
import { getStorageStats } from './storage.controller.js';
import authenticate from '../../middleware/authenticate.js';
import { apiLimiter } from '../../middleware/rateLimiter.js';

const router = Router();

router.use(authenticate);
router.use(apiLimiter);

router.get('/stats', getStorageStats);

export default router;

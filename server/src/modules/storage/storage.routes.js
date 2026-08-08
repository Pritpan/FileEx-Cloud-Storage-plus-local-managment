import { Router } from 'express';
import { getStorageStats } from './storage.controller.js';
import authenticate from '../../middleware/authenticate.js';

const router = Router();

router.use(authenticate);

router.get('/stats', getStorageStats);

export default router;

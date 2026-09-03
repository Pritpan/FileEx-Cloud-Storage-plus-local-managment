import { Router } from 'express';
import authenticate from '../../middleware/authenticate.js';
import * as fileController from './file.controller.js';
import { apiLimiter, uploadLimiter, downloadLimiter, destructiveLimiter } from '../../middleware/rateLimiter.js';

const router = Router();

router.post('/upload/initiate', authenticate, uploadLimiter, fileController.initiateUpload);
router.post('/upload/complete', authenticate, uploadLimiter, fileController.completeUpload);

router.get('/', authenticate, apiLimiter, fileController.listFiles);
router.get('/search', authenticate, apiLimiter, fileController.searchFiles);
router.get('/recent', authenticate, apiLimiter, fileController.getRecentFiles);

router.post('/folders', authenticate, destructiveLimiter, fileController.createFolder);
router.patch('/:id/rename', authenticate, destructiveLimiter, fileController.renameItem);
router.patch('/:id/move', authenticate, destructiveLimiter, fileController.moveItem);

router.get('/:id/download-url', authenticate, downloadLimiter, fileController.getDownloadUrl);
router.get('/:id/preview-url', authenticate, downloadLimiter, fileController.getPreviewUrl);
router.get('/:id/properties', authenticate, apiLimiter, fileController.getProperties);
router.delete('/:id', authenticate, destructiveLimiter, fileController.deleteItem);

router.get('/trash', authenticate, apiLimiter, fileController.getTrash);
router.post('/trash/:id/restore', authenticate, destructiveLimiter, fileController.restoreItem);
router.delete('/trash/:id', authenticate, destructiveLimiter, fileController.permanentlyDeleteItem);

export default router;

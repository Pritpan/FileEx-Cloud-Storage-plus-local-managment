import { Router } from 'express';
import authenticate from '../../middleware/authenticate.js';
import * as fileController from './file.controller.js';

const router = Router();

router.post('/upload/initiate', authenticate, fileController.initiateUpload);
router.post('/upload/complete', authenticate, fileController.completeUpload);

router.get('/', authenticate, fileController.listFiles);
router.get('/search', authenticate, fileController.searchFiles);
router.get('/recent', authenticate, fileController.getRecentFiles);

router.post('/folders', authenticate, fileController.createFolder);
router.patch('/:id/rename', authenticate, fileController.renameItem);
router.patch('/:id/move', authenticate, fileController.moveItem);

router.get('/:id/download-url', authenticate, fileController.getDownloadUrl);
router.get('/:id/preview-url', authenticate, fileController.getPreviewUrl);
router.get('/:id/properties', authenticate, fileController.getProperties);
router.delete('/:id', authenticate, fileController.deleteItem);

router.get('/trash', authenticate, fileController.getTrash);
router.post('/trash/:id/restore', authenticate, fileController.restoreItem);
router.delete('/trash/:id', authenticate, fileController.permanentlyDeleteItem);

export default router;

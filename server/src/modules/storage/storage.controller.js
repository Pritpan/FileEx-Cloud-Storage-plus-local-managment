import storageStatsRepository from './storage-stats.repository.js';
import fileRepository from '../files/file.repository.js';

// ---------------------------------------------------------------------------
// GET /api/v1/storage/stats
// ---------------------------------------------------------------------------
export const getStorageStats = async (req, res) => {
  try {
    const userId = req.user.id;

    const stats = await storageStatsRepository.findByUserId(userId);
    if (!stats) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Storage stats not found.' },
      });
    }

    const totalFiles = await fileRepository.countByType(userId, 'FILE');
    const totalFolders = await fileRepository.countByType(userId, 'FOLDER');

    res.status(200).json({
      success: true,
      data: {
        totalBytes: Number(stats.storageLimit),
        usedBytes: Number(stats.usedStorage),
        totalFiles,
        totalFolders,
      },
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Could not fetch storage stats.' },
    });
  }
};

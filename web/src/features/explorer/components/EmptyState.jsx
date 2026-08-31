import { FolderOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { UploadButton } from '@/features/upload/components/UploadButton';

export function EmptyState({ onNewFolder, currentFolderId }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center h-full">
      <div className="w-20 h-20 bg-surface-100 dark:bg-surface-800 rounded-full flex items-center justify-center mb-6">
        <FolderOpen className="w-10 h-10 text-surface-400 dark:text-surface-500" />
      </div>
      <h3 className="text-lg font-medium text-surface-600 dark:text-surface-100 mb-2">
        This folder is empty
      </h3>
      <p className="text-sm text-surface-500 dark:text-surface-400 max-w-sm mb-6">
        Drag and drop files here to upload, or create a new folder to get started.
      </p>
      <div className="flex gap-3">
        <Button variant="outline" onClick={onNewFolder} className="text-surface-900 dark:text-surface-100 dark:hover:text-white">
          New Folder
        </Button>
        <UploadButton currentFolderId={currentFolderId} />
      </div>
    </div>
  );
}

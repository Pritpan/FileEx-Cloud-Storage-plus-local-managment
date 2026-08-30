import { File, AlertCircle, CheckCircle2, X } from 'lucide-react';
import { UploadProgress } from './UploadProgress';
import { formatBytes } from '@/features/explorer/components/ExplorerItem';

const statusText = {
  PENDING:     'Waiting...',
  INITIATING:  'Preparing...',
  UPLOADING:   'Uploading...',
  DOWNLOADING: 'Downloading...',
  COMPLETING:  'Finishing...',
  COMPLETED:   'Done',
  FAILED:      'Failed',
};

const ACTIVE_STATUSES = ['INITIATING', 'UPLOADING', 'DOWNLOADING', 'COMPLETING'];

export function UploadItem({ upload, onRemove }) {
  const { file, label, size, progress, status, error } = upload;

  // Uploads have a browser File object; downloads pass label + size directly.
  const displayName = file?.name ?? label ?? 'Unknown';
  const displaySize = file?.size ?? size ?? 0;

  return (
    <div className="flex flex-col gap-2 p-3 bg-surface-0 dark:bg-surface-900 border-b border-surface-200 dark:border-surface-800 last:border-0 relative group">
      <div className="flex items-center gap-3">
        <File className="w-8 h-8 text-surface-400 shrink-0" />
        
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-surface-900 dark:text-surface-100 truncate" title={displayName}>
            {displayName}
          </p>
          
          <div className="flex justify-between items-center mt-1 text-xs text-surface-500">
            <span>{formatBytes(displaySize)}</span>
            <span className={status === 'FAILED' ? 'text-red-500 font-medium' : status === 'COMPLETED' ? 'text-green-500 font-medium' : ''}>
              {status === 'FAILED' ? error || 'Error' : statusText[status]}
              {(status === 'UPLOADING' || status === 'DOWNLOADING') && ` (${progress}%)`}
            </span>
          </div>
        </div>

        {/* Action icons */}
        <div className="shrink-0 flex items-center gap-2">
          {status === 'COMPLETED' && <CheckCircle2 className="w-5 h-5 text-green-500" />}
          {status === 'FAILED'    && <AlertCircle  className="w-5 h-5 text-red-500" />}
          
          <button 
            type="button"
            onClick={() => onRemove(upload.id)}
            className="opacity-0 group-hover:opacity-100 p-1 text-surface-400 hover:text-surface-700 dark:hover:text-surface-300 transition-opacity"
            title="Remove"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {ACTIVE_STATUSES.includes(status) && (
        <UploadProgress value={progress} className="mt-1" />
      )}
    </div>
  );
}


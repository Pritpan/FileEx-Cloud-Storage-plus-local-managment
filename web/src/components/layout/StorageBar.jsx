import { Progress } from '@/components/ui/progress';
import { useStorage } from '@/features/storage/hooks/useStorage';
import { formatBytes } from '@/features/explorer/components/ExplorerItem';
import { Loader2 } from 'lucide-react';

/**
 * StorageBar
 *
 * Shows storage usage at the bottom of the sidebar.
 * When `collapsed` is true, only the progress bar renders (no text labels).
 *
 * @param {{ collapsed?: boolean }} props
 */
export function StorageBar({ collapsed }) {
  const { stats, isLoading, isError } = useStorage();

  if (isLoading) {
    return (
      <div className="px-4 py-4 border-t border-surface-300 dark:border-surface-700 flex justify-center">
        <Loader2 className="w-4 h-4 animate-spin text-brand-600" />
      </div>
    );
  }

  if (isError || !stats) return null;

  const { totalBytes, usedBytes } = stats;
  const percentage = totalBytes > 0 ? (usedBytes / totalBytes) * 100 : 0;

  if (collapsed) {
    return (
      <div
        className="px-3 py-4 border-t border-surface-300 dark:border-surface-700"
        title={`${formatBytes(usedBytes)} of ${formatBytes(totalBytes)} used`}
      >
        <Progress value={percentage} className="h-1.5" />
      </div>
    );
  }

  return (
    <div className="px-4 py-5 border-t border-surface-300 dark:border-surface-700">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-surface-600 dark:text-surface-100">Storage</span>
        <span className="text-xs text-surface-500 dark:text-surface-400">
          {formatBytes(usedBytes)} / {formatBytes(totalBytes)}
        </span>
      </div>
      <Progress value={percentage} className="h-2" />
      <p className="text-xs text-surface-500 dark:text-surface-400 mt-1.5">
        {percentage.toFixed(0)}% used
      </p>
    </div>
  );
}

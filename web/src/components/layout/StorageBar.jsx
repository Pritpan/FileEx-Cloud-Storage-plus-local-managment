import { Progress } from '@/components/ui/progress';
import { useStorage } from '@/features/storage/hooks/useStorage';
import { formatBytes } from '@/features/explorer/components/ExplorerItem';
import { Loader2 } from 'lucide-react';

export function StorageBar() {
  const { stats, isLoading, isError } = useStorage();

  if (isLoading) {
    return (
      <div className="mt-auto px-4 py-6 border-t border-surface-200 dark:border-surface-800 flex justify-center">
        <Loader2 className="w-4 h-4 animate-spin text-surface-400" />
      </div>
    );
  }

  if (isError || !stats) {
    return null;
  }

  const { totalBytes, usedBytes } = stats;
  const percentage = totalBytes > 0 ? (usedBytes / totalBytes) * 100 : 0;

  return (
    <div className="mt-auto px-4 py-6 border-t border-surface-200 dark:border-surface-800">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-surface-700 dark:text-surface-300">Storage</span>
        <span className="text-xs text-surface-500 dark:text-surface-400">
          {formatBytes(usedBytes)} of {formatBytes(totalBytes)}
        </span>
      </div>
      <Progress value={percentage} className="h-2" />
      <p className="text-xs text-surface-500 dark:text-surface-400 mt-2">
        {percentage.toFixed(0)}% used
      </p>
    </div>
  );
}

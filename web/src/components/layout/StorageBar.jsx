import { Progress } from '@/components/ui/progress';

export function StorageBar() {
  const usedGB = 42;
  const totalGB = 100;
  const percentage = (usedGB / totalGB) * 100;

  return (
    <div className="mt-auto px-4 py-6 border-t border-surface-200 dark:border-surface-800">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-surface-700 dark:text-surface-300">Storage</span>
        <span className="text-xs text-surface-500 dark:text-surface-400">{usedGB} GB of {totalGB} GB</span>
      </div>
      <Progress value={percentage} className="h-2" />
      <p className="text-xs text-surface-500 dark:text-surface-400 mt-2">
        {percentage.toFixed(0)}% used
      </p>
    </div>
  );
}

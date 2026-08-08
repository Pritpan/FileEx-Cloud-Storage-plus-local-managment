import { HardDrive, File, Folder, Database, AlertTriangle, Loader2 } from 'lucide-react';
import { useStorage } from '../hooks/useStorage';
import { formatBytes } from '@/features/explorer/components/ExplorerItem';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

export function StoragePage() {
  const { stats, isLoading, isError, refetch } = useStorage();

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 text-surface-400">
        <Loader2 className="w-8 h-8 animate-spin" />
        <span className="text-sm">Loading storage statistics…</span>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 text-center py-24">
        <AlertTriangle className="w-10 h-10 text-red-400" />
        <p className="text-sm text-surface-500">Failed to load storage stats.</p>
        <Button variant="outline" size="sm" onClick={refetch}>Try again</Button>
      </div>
    );
  }

  if (!stats) return null;

  const { totalBytes, usedBytes, totalFiles, totalFolders } = stats;
  const percentage = totalBytes > 0 ? (usedBytes / totalBytes) * 100 : 0;
  const remainingBytes = Math.max(0, totalBytes - usedBytes);

  return (
    <div className="flex flex-col h-full w-full bg-surface-50 dark:bg-surface-950 overflow-y-auto">
      {/* ── Page Header ── */}
      <div className="px-8 py-8 border-b border-surface-200 dark:border-surface-800 bg-surface-0 dark:bg-surface-950 shrink-0">
        <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-100 flex items-center gap-3">
          <HardDrive className="w-7 h-7 text-brand-600 dark:text-brand-500" />
          Storage Dashboard
        </h1>
        <p className="text-surface-500 mt-2">
          Monitor your storage usage and file statistics.
        </p>
      </div>

      <div className="p-8 max-w-5xl mx-auto w-full space-y-8">
        
        {/* ── Main Storage Progress ── */}
        <div className="bg-surface-0 dark:bg-surface-900 border border-surface-200 dark:border-surface-800 rounded-xl p-8 shadow-sm">
          <div className="flex flex-col md:flex-row items-center gap-12">
            
            {/* Circular Progress */}
            <div className="relative w-48 h-48 shrink-0 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  className="stroke-surface-100 dark:stroke-surface-800"
                  strokeWidth="10"
                  fill="none"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  className="stroke-brand-500"
                  strokeWidth="10"
                  fill="none"
                  strokeDasharray={`${2 * Math.PI * 45}`}
                  strokeDashoffset={`${2 * Math.PI * 45 * (1 - percentage / 100)}`}
                  strokeLinecap="round"
                  style={{ transition: 'stroke-dashoffset 1s ease-in-out' }}
                />
              </svg>
              <div className="absolute flex flex-col items-center justify-center text-center">
                <span className="text-3xl font-bold text-surface-900 dark:text-surface-100">
                  {percentage.toFixed(1)}%
                </span>
                <span className="text-sm text-surface-500 font-medium">Used</span>
              </div>
            </div>

            {/* Storage Details */}
            <div className="flex-1 space-y-6 w-full">
              <div>
                <h3 className="text-lg font-semibold text-surface-900 dark:text-surface-100 mb-1">
                  Storage Usage
                </h3>
                <p className="text-sm text-surface-500">
                  You have used {formatBytes(usedBytes)} of your {formatBytes(totalBytes)} limit.
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm font-medium">
                  <span className="text-brand-600 dark:text-brand-400">{formatBytes(usedBytes)} used</span>
                  <span className="text-surface-500">{formatBytes(remainingBytes)} free</span>
                </div>
                <Progress value={percentage} className="h-3 rounded-full" />
              </div>
            </div>
          </div>
        </div>

        {/* ── Stats Grid ── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard 
            icon={Database} 
            title="Total Storage" 
            value={formatBytes(totalBytes)} 
            color="text-blue-500" 
            bg="bg-blue-50 dark:bg-blue-950" 
          />
          <StatCard 
            icon={File} 
            title="Total Files" 
            value={totalFiles.toLocaleString()} 
            color="text-emerald-500" 
            bg="bg-emerald-50 dark:bg-emerald-950" 
          />
          <StatCard 
            icon={Folder} 
            title="Total Folders" 
            value={totalFolders.toLocaleString()} 
            color="text-amber-500" 
            bg="bg-amber-50 dark:bg-amber-950" 
          />
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, title, value, color, bg }) {
  return (
    <div className="bg-surface-0 dark:bg-surface-900 border border-surface-200 dark:border-surface-800 rounded-xl p-6 shadow-sm flex items-center gap-5">
      <div className={`p-4 rounded-full ${bg}`}>
        <Icon className={`w-8 h-8 ${color}`} />
      </div>
      <div>
        <p className="text-sm font-medium text-surface-500 mb-1">{title}</p>
        <p className="text-2xl font-bold text-surface-900 dark:text-surface-100">{value}</p>
      </div>
    </div>
  );
}

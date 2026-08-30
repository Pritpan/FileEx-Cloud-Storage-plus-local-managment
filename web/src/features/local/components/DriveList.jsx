/**
 * DriveList.jsx — E5: Local Explorer
 *
 * Displays the "This PC" root view — a list of available drives/volumes.
 * Shown when currentPath is null (no directory selected yet).
 */

import { HardDrive } from 'lucide-react';
import { Card } from '@/components/ui/card';

/**
 * @param {{ drives, onSelect }} props
 *   drives   — Array<{ label, path }>
 *   onSelect — (path, label) => void
 */
export function DriveList({ drives, onSelect }) {
  if (drives.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center h-full">
        <div className="w-20 h-20 bg-surface-100 dark:bg-surface-800 rounded-full flex items-center justify-center mb-6">
          <HardDrive className="w-10 h-10 text-surface-400 dark:text-surface-500" />
        </div>
        <h3 className="text-lg font-medium text-surface-900 dark:text-surface-100 mb-2">
          No drives found
        </h3>
        <p className="text-sm text-surface-500 dark:text-surface-400 max-w-sm">
          Could not enumerate local drives. Try restarting the application.
        </p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h2 className="text-sm font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wider mb-4">
        Devices and Drives
      </h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {drives.map((drive) => (
          <Card
            key={drive.path}
            className="group flex flex-col items-center justify-center p-4 h-32 border border-surface-200 dark:border-surface-800 bg-surface-0 dark:bg-surface-900 hover:border-brand-300 dark:hover:border-brand-700 hover:bg-brand-50/50 dark:hover:bg-brand-900/10 transition-colors cursor-pointer shadow-sm"
            onDoubleClick={() => onSelect(drive.path, drive.label)}
            onClick={() => onSelect(drive.path, drive.label)}
          >
            <div className="mb-3 transition-transform group-hover:scale-105">
              <HardDrive className="w-10 h-10 text-brand-500" />
            </div>
            <p className="text-sm font-semibold text-surface-900 dark:text-surface-100">
              {drive.label}
            </p>
          </Card>
        ))}
      </div>
    </div>
  );
}

/**
 * DriveList.jsx — E5: Local Explorer
 *
 * Displays the "This PC" root view — a list of available drives/volumes.
 * Shown when currentPath is null (no directory selected yet).
 */

import { useState, useRef } from 'react';
import { HardDrive } from 'lucide-react';
import { Card } from '@/components/ui/card';

function DriveItem({ drive, onSelect }) {
  const [isDragOver, setIsDragOver] = useState(false);
  const hoverTimeout = useRef(null);

  const clearHoverTimeout = () => {
    if (hoverTimeout.current) {
      clearTimeout(hoverTimeout.current);
      hoverTimeout.current = null;
    }
  };

  return (
    <Card
      className={[
        "group flex flex-col items-center justify-center p-3 h-28 rounded-md border transition-colors cursor-pointer shadow-none select-none",
        "bg-surface-0 dark:bg-surface-800",
        "hover:border-brand-600/40 dark:hover:border-brand-600/40 hover:bg-surface-100/80 dark:hover:bg-surface-700/30",
        isDragOver ? "border-brand-600 ring-2 ring-brand-600/50 bg-brand-50/50 dark:bg-brand-900/30" : "border-surface-300 dark:border-surface-700"
      ].join(' ')}
      onDoubleClick={() => onSelect(drive.path, drive.label)}
      onClick={() => onSelect(drive.path, drive.label)}
      onDragOver={(e) => {
        e.preventDefault();
        e.stopPropagation();
        e.dataTransfer.dropEffect = 'copy';
        setIsDragOver(true);
        
        if (!hoverTimeout.current) {
          hoverTimeout.current = setTimeout(() => {
            onSelect(drive.path, drive.label);
            hoverTimeout.current = null;
            setIsDragOver(false);
          }, 600);
        }
      }}
      onDragLeave={(e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(false);
        clearHoverTimeout();
      }}
      onDragEnd={clearHoverTimeout}
      onDrop={(e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(false);
        clearHoverTimeout();
        // The page itself handles the drop if we navigate. We don't drop on drives directly in E6 yet, but we allow navigating into it.
      }}
    >
      <div className="mb-2 transition-transform group-hover:scale-105 pointer-events-none">
        <HardDrive className="w-8 h-8 text-brand-600 dark:text-brand-400" />
      </div>
      <p className="text-sm font-semibold text-surface-600 dark:text-surface-100 pointer-events-none">
        {drive.label}
      </p>
    </Card>
  );
}

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
        <h3 className="text-lg font-medium text-surface-600 dark:text-surface-100 mb-2">
          No drives found
        </h3>
        <p className="text-sm text-surface-500 dark:text-surface-400 max-w-sm">
          Could not enumerate local drives. Try restarting the application.
        </p>
      </div>
    );
  }

  return (
    <div className="p-4">
      <h2 className="text-sm font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wider mb-3">
        Devices and Drives
      </h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {drives.map((drive) => (
          <DriveItem key={drive.path} drive={drive} onSelect={onSelect} />
        ))}
      </div>
    </div>
  );
}

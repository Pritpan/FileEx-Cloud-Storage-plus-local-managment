/**
 * LocalExplorerItem.jsx — Local-specific file/folder card
 *
 * This is NOT a modification of the shared ExplorerItem.
 * It has a completely local-specific context menu:
 *
 *   Open              → shell.openPath (files) or navigate (folders)
 *   Upload to Cloud   → E6 upload pipeline (uses already-known path, NO picker)
 *   ─────
 *   Copy              → local clipboard copy
 *   Cut               → local clipboard cut
 *   ─────
 *   Rename            → LocalRenameDialog
 *   ─────
 *   Delete            → LocalDeleteDialog
 *   ─────
 *   Properties        → LocalPropertiesDialog
 *
 * Selection:
 *   Single click  → select (visual ring highlight)
 *   Double click  → open (navigate folder / OS-open file)
 *   Right click   → context menu via keyboard/mouse (dropdown)
 *
 * The 'isSelected' prop controls the selection ring.
 */

import { useState } from 'react';
import { getItemIcon, formatBytes, formatDate } from '@/features/explorer/components/ExplorerItem';
import { Card } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  FolderOpen, UploadCloud, Copy, Scissors,
  Pencil, Trash2, FileText, MoreVertical,
} from 'lucide-react';

export function LocalExplorerItem({
  item,
  isSelected,
  onSelect,
  onOpen,
  onUploadToCloud,
  onCopy,
  onCut,
  onRename,
  onDelete,
  onProperties,
  onDropItem, // drag and drop handler
}) {
  const isFolder = item.type === 'FOLDER';
  const subtitle = isFolder ? formatDate(item.updatedAt) : formatBytes(item.size);
  const [isDragOver, setIsDragOver] = useState(false);

  return (
    <Card
      draggable={!isFolder}
      onDragStart={(e) => {
        if (isFolder) {
          e.preventDefault();
          return;
        }
        e.dataTransfer.setData('application/json', JSON.stringify({
          type: 'LOCAL_FILE',
          path: item._local.path,
          name: item._local.name,
          size: item._local.size
        }));
        e.dataTransfer.effectAllowed = 'copy';
      }}
      onDragOver={(e) => {
        // Only allow dropping on folders
        if (!isFolder) return;
        
        // Prevent default to allow drop
        e.preventDefault();
        e.stopPropagation();
        e.dataTransfer.dropEffect = 'copy';
        setIsDragOver(true);
      }}
      onDragLeave={(e) => {
        if (!isFolder) return;
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(false);
      }}
      onDrop={(e) => {
        if (!isFolder) return;
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(false);
        onDropItem?.(e, item);
      }}
      className={[
        'group relative flex flex-col items-center justify-center p-4 h-40',
        'border bg-surface-0 dark:bg-surface-900',
        'hover:border-brand-300 dark:hover:border-brand-700',
        'hover:bg-brand-50/50 dark:hover:bg-brand-900/10',
        'transition-colors cursor-pointer shadow-sm select-none',
        isSelected
          ? 'border-brand-500 dark:border-brand-400 ring-2 ring-brand-500/30 dark:ring-brand-400/30'
          : 'border-surface-200 dark:border-surface-800',
        isDragOver ? 'ring-2 ring-blue-500 bg-blue-50/50 dark:bg-blue-900/20' : '',
      ].join(' ')}
      onClick={(e) => {
        e.stopPropagation();
        onSelect?.(item);
      }}
      onDoubleClick={(e) => {
        e.stopPropagation();
        onOpen?.(item);
      }}
    >
      {/* ── Three-dot context menu ─────────────────────────────────────── */}
      <DropdownMenu>
        <DropdownMenuTrigger
          className="h-7 w-7 absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity flex items-center justify-center rounded-md hover:bg-surface-100 dark:hover:bg-surface-800 text-surface-500 hover:text-surface-900 dark:hover:text-surface-100 outline-none ring-offset-surface-0 focus-visible:ring-2 focus-visible:ring-brand-500"
          onClick={(e) => e.stopPropagation()}
        >
          <MoreVertical className="w-4 h-4" />
          <span className="sr-only">Open menu</span>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          {/* Open */}
          <DropdownMenuItem onClick={() => onOpen?.(item)}>
            <FolderOpen className="w-4 h-4 mr-2" />
            Open
          </DropdownMenuItem>

          {/* Upload to Cloud — only files (folder upload not supported in E6) */}
          {!isFolder && (
            <DropdownMenuItem onClick={() => onUploadToCloud?.(item)}>
              <UploadCloud className="w-4 h-4 mr-2" />
              Upload to Cloud
            </DropdownMenuItem>
          )}

          <DropdownMenuSeparator />

          {/* Copy / Cut */}
          <DropdownMenuItem onClick={() => onCopy?.(item)}>
            <Copy className="w-4 h-4 mr-2" />
            Copy
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onCut?.(item)}>
            <Scissors className="w-4 h-4 mr-2" />
            Cut
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          {/* Rename */}
          <DropdownMenuItem onClick={() => onRename?.(item)}>
            <Pencil className="w-4 h-4 mr-2" />
            Rename
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          {/* Properties */}
          <DropdownMenuItem onClick={() => onProperties?.(item)}>
            <FileText className="w-4 h-4 mr-2" />
            Properties
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          {/* Delete */}
          <DropdownMenuItem
            onClick={() => onDelete?.(item)}
            className="text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* ── Icon ──────────────────────────────────────────────────────── */}
      <div className="mb-4 transition-transform group-hover:scale-105">
        {getItemIcon(item)}
      </div>

      {/* ── Name + subtitle ────────────────────────────────────────────── */}
      <div className="text-center w-full">
        <p
          className="text-sm font-medium text-surface-900 dark:text-surface-100 truncate w-full px-2"
          title={item.displayName}
        >
          {item.displayName}
        </p>
        <p className="text-xs text-surface-500 dark:text-surface-400 mt-1">{subtitle}</p>
      </div>
    </Card>
  );
}

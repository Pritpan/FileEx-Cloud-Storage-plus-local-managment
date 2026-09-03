/**
 * LocalExplorerItem.jsx — Local-specific file/folder card
 *
 * Right-click opens an inline ContextMenu (per-item) so the correct
 * actions always show immediately without any async state timing issues.
 * A three-dot DropdownMenu is also available on hover for mouse users.
 *
 * Selection:
 *   Single click  → select (visual ring highlight)
 *   Double click  → open (navigate folder / OS-open file)
 *   Right click   → ContextMenu with item-specific actions
 */

import { useState, useRef } from 'react';
import { getItemIcon, getFileTypeLabel, formatBytes } from '@/features/explorer/components/ExplorerItem';
import { Card } from '@/components/ui/card';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';
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
  onDropItem,
}) {
  const isFolder = item.type === 'FOLDER';
  // Subtitle: type label for folders, size for files
  const subtitle  = isFolder ? getFileTypeLabel(item) : formatBytes(item._local?.size ?? item.size);
  const [isDragOver, setIsDragOver] = useState(false);
  const hoverTimeout = useRef(null);

  const clearHoverTimeout = () => {
    if (hoverTimeout.current) {
      clearTimeout(hoverTimeout.current);
      hoverTimeout.current = null;
    }
  };

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <Card
          draggable={!isFolder}
          onDragStart={(e) => {
            if (isFolder) { e.preventDefault(); return; }
            e.dataTransfer.setData('application/json', JSON.stringify({
              type: 'LOCAL_FILE',
              path: item._local.path,
              name: item._local.name,
              size: item._local.size,
            }));
            e.dataTransfer.effectAllowed = 'copy';
          }}
          onDragOver={(e) => {
            if (!isFolder) return;
            e.preventDefault();
            e.stopPropagation();
            e.dataTransfer.dropEffect = 'copy';
            setIsDragOver(true);
            if (!hoverTimeout.current) {
              hoverTimeout.current = setTimeout(() => {
                onOpen?.(item);
                hoverTimeout.current = null;
                setIsDragOver(false);
              }, 600);
            }
          }}
          onDragLeave={(e) => {
            if (!isFolder) return;
            e.preventDefault();
            e.stopPropagation();
            setIsDragOver(false);
            clearHoverTimeout();
          }}
          onDragEnd={clearHoverTimeout}
          onDrop={(e) => {
            if (!isFolder) return;
            e.preventDefault();
            e.stopPropagation();
            setIsDragOver(false);
            clearHoverTimeout();
            onDropItem?.(e, item);
          }}
          className={[
            'glass-card group relative flex flex-col items-center justify-center gap-3 p-4 h-[120px] rounded-xl cursor-pointer select-none transition-all duration-150',
            'hover:bg-black/5 dark:hover:bg-white/5',
            isSelected
              ? 'ring-2 ring-[#587463]/60 dark:ring-[#587463]/50'
              : 'hover:border-surface-400/30',
            isDragOver ? 'ring-2 ring-[#587463]/50' : '',
          ].join(' ')}
          onClick={(e) => { e.stopPropagation(); onSelect?.(item); }}
          onDoubleClick={(e) => { e.stopPropagation(); onOpen?.(item); }}
        >
          {/* ── Three-dot dropdown (hover) ──────────────────────────────── */}
          <DropdownMenu>
            <DropdownMenuTrigger
              className="h-7 w-7 absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity flex items-center justify-center rounded-md hover:bg-surface-100 dark:hover:bg-surface-800 text-surface-500 hover:text-surface-900 dark:hover:text-surface-100 outline-none ring-offset-surface-0 focus-visible:ring-2 focus-visible:ring-brand-500"
              onClick={(e) => e.stopPropagation()}
            >
              <MoreVertical className="w-4 h-4" />
              <span className="sr-only">Open menu</span>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => onOpen?.(item)}>
                <FolderOpen className="w-4 h-4 mr-2" /> Open
              </DropdownMenuItem>
              {!isFolder && (
                <DropdownMenuItem 
                  onClick={() => onUploadToCloud?.(item)}
                  className="focus:bg-sky-50 dark:focus:bg-sky-900 focus:text-sky-600 dark:focus:text-sky-400"
                >
                  <UploadCloud className="w-4 h-4 mr-2" /> Upload to Cloud
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onCopy?.(item)}>
                <Copy className="w-4 h-4 mr-2" /> Copy
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onCut?.(item)}>
                <Scissors className="w-4 h-4 mr-2" /> Cut
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onRename?.(item)}>
                <Pencil className="w-4 h-4 mr-2" /> Rename
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onProperties?.(item)}>
                <FileText className="w-4 h-4 mr-2" /> Properties
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => onDelete?.(item)}
                className="text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950"
              >
                <Trash2 className="w-4 h-4 mr-2" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* ── Icon ────────────────────────────────────────────────────── */}
          <div className="transition-transform duration-150 group-hover:scale-105">
            {getItemIcon(item, 'w-9 h-9')}
          </div>

          {/* ── Name + subtitle ──────────────────────────────────────────── */}
          <div className="text-center w-full px-1">
            <p
              className="text-xs font-medium text-surface-900 dark:text-surface-100 truncate leading-tight"
              title={item.displayName}
            >
              {item.displayName}
            </p>
            <p className="text-[11px] text-foreground/70 dark:text-white/70 mt-0.5">{subtitle}</p>
          </div>
        </Card>
      </ContextMenuTrigger>

      {/* ── Right-click context menu ─────────────────────────────────────── */}
      <ContextMenuContent className="w-52">
        <ContextMenuItem onClick={() => onOpen?.(item)}>
          <FolderOpen className="w-4 h-4 mr-2" /> Open
        </ContextMenuItem>

        {!isFolder && (
          <ContextMenuItem 
            onClick={() => onUploadToCloud?.(item)}
            className="focus:bg-sky-50 dark:focus:bg-sky-900 focus:text-sky-600 dark:focus:text-sky-400"
          >
            <UploadCloud className="w-4 h-4 mr-2" /> Upload to Cloud
          </ContextMenuItem>
        )}

        <ContextMenuSeparator />

        <ContextMenuItem onClick={() => onCopy?.(item)}>
          <Copy className="w-4 h-4 mr-2" /> Copy
        </ContextMenuItem>
        <ContextMenuItem onClick={() => onCut?.(item)}>
          <Scissors className="w-4 h-4 mr-2" /> Cut
        </ContextMenuItem>

        <ContextMenuSeparator />

        <ContextMenuItem onClick={() => onRename?.(item)}>
          <Pencil className="w-4 h-4 mr-2" /> Rename
        </ContextMenuItem>

        <ContextMenuSeparator />

        <ContextMenuItem onClick={() => onProperties?.(item)}>
          <FileText className="w-4 h-4 mr-2" /> Properties
        </ContextMenuItem>

        <ContextMenuSeparator />

        <ContextMenuItem
          onClick={() => onDelete?.(item)}
          className="text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950"
        >
          <Trash2 className="w-4 h-4 mr-2" /> Delete
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}

import { useState, useRef } from 'react';
import {
  Folder, File, FileText, FileImage, FileSpreadsheet,
  FileArchive, FileVideo, FileAudio, FileCode,
  MoreVertical, Pencil, FolderInput, Trash2, Eye, Download,
  FolderOpen,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';

// ─── Formatters ──────────────────────────────────────────────────────────────

export const formatBytes = (bytes, decimals = 1) => {
  if (!+bytes) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(decimals))} ${sizes[i]}`;
};

export const formatDate = (dateString) => {
  if (!dateString) return '—';
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  }).format(date);
};

// ─── File type label ─────────────────────────────────────────────────────────

export const getFileTypeLabel = (item) => {
  if (item?.type === 'FOLDER') return 'File folder';
  const name = (item?.displayName || item?._local?.name || '').toLowerCase();
  if (name.endsWith('.pdf'))  return 'PDF Document';
  if (name.endsWith('.doc') || name.endsWith('.docx')) return 'Word Document';
  if (name.endsWith('.xls') || name.endsWith('.xlsx')) return 'Excel Worksheet';
  if (name.endsWith('.ppt') || name.endsWith('.pptx')) return 'PowerPoint';
  if (/\.(png|jpg|jpeg|gif|webp|svg|bmp|ico)$/i.test(name)) {
    const ext = name.split('.').pop().toUpperCase();
    return `${ext} Image`;
  }
  if (/\.(mp4|mov|avi|mkv|webm)$/i.test(name)) return 'Video File';
  if (/\.(mp3|wav|flac|aac|ogg)$/i.test(name)) return 'Audio File';
  if (/\.(zip|rar|7z|tar|gz|bz2)$/i.test(name)) return 'ZIP Archive';
  if (/\.(js|ts|jsx|tsx|py|java|c|cpp|cs|go|rs|rb|php|html|css)$/i.test(name)) return 'Code File';
  if (name.endsWith('.txt')) return 'Text Document';
  if (name.endsWith('.md'))  return 'Markdown';
  return 'File';
};

// ─── Icon component ──────────────────────────────────────────────────────────

/**
 * getItemIcon — returns a consistent, color-coded icon.
 * size: Tailwind size string e.g. 'w-5 h-5' or 'w-9 h-9'
 */
export const getItemIcon = (item, size = 'w-10 h-10') => {
  const isSmall = size === 'w-5 h-5' || size === 'w-4 h-4';

  if (item?.type === 'FOLDER') {
    return (
      <Folder
        className={`${size} shrink-0`}
        style={{ color: '#587463', fill: isSmall ? 'rgba(88,116,99,0.18)' : 'rgba(88,116,99,0.22)' }}
      />
    );
  }

  const name = (item?.displayName || item?._local?.name || '').toLowerCase();

  if (name.endsWith('.pdf'))
    return <FileText className={`${size} shrink-0`} style={{ color: '#dc2626' }} />;
  if (name.endsWith('.doc') || name.endsWith('.docx'))
    return <FileText className={`${size} shrink-0`} style={{ color: '#2563eb' }} />;
  if (name.endsWith('.xls') || name.endsWith('.xlsx'))
    return <FileSpreadsheet className={`${size} shrink-0`} style={{ color: '#16a34a' }} />;
  if (name.endsWith('.ppt') || name.endsWith('.pptx'))
    return <FileText className={`${size} shrink-0`} style={{ color: '#ea580c' }} />;
  if (/\.(png|jpg|jpeg|gif|webp|svg|bmp|ico)$/i.test(name))
    return <FileImage className={`${size} shrink-0`} style={{ color: '#5D82A6' }} />;
  if (/\.(mp4|mov|avi|mkv|webm)$/i.test(name))
    return <FileVideo className={`${size} shrink-0`} style={{ color: '#7c3aed' }} />;
  if (/\.(mp3|wav|flac|aac|ogg)$/i.test(name))
    return <FileAudio className={`${size} shrink-0`} style={{ color: '#db2777' }} />;
  if (/\.(zip|rar|7z|tar|gz|bz2)$/i.test(name))
    return <FileArchive className={`${size} shrink-0`} style={{ color: '#d97706' }} />;
  if (/\.(js|ts|jsx|tsx|py|java|c|cpp|cs|go|rs|rb|php|html|css)$/i.test(name))
    return <FileCode className={`${size} shrink-0`} style={{ color: '#0891b2' }} />;
  if (name.endsWith('.txt') || name.endsWith('.md'))
    return <FileText className={`${size} shrink-0`} style={{ color: '#64748b' }} />;

  return <File className={`${size} shrink-0`} style={{ color: '#8A7258' }} />;
};

// ─── Shared menu items ───────────────────────────────────────────────────────

function ItemMenuItems({ item, onDoubleClick, onRename, onMove, onDelete, onProperties, onPreview, onDownload, MenuItemComp, SeparatorComp }) {
  const isFile = item.type !== 'FOLDER';
  return (
    <>
      <MenuItemComp onClick={() => onDoubleClick?.(item)}>
        <FolderOpen className="w-4 h-4 mr-2" /> Open
      </MenuItemComp>
      {isFile && (
        <>
          <MenuItemComp onClick={() => onPreview?.(item)}>
            <Eye className="w-4 h-4 mr-2" /> Preview
          </MenuItemComp>
          <MenuItemComp onClick={() => onDownload?.(item)}>
            <Download className="w-4 h-4 mr-2" /> Download
          </MenuItemComp>
        </>
      )}
      <SeparatorComp />
      <MenuItemComp onClick={() => onRename?.(item)}>
        <Pencil className="w-4 h-4 mr-2" /> Rename
      </MenuItemComp>
      <MenuItemComp onClick={() => onMove?.(item)}>
        <FolderInput className="w-4 h-4 mr-2" /> Move
      </MenuItemComp>
      <SeparatorComp />
      <MenuItemComp onClick={() => onProperties?.(item)}>
        <FileText className="w-4 h-4 mr-2" /> Properties
      </MenuItemComp>
      <SeparatorComp />
      <MenuItemComp
        onClick={() => onDelete?.(item)}
        className="text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950"
      >
        <Trash2 className="w-4 h-4 mr-2" /> Move to Trash
      </MenuItemComp>
    </>
  );
}

// ─── Grid card ───────────────────────────────────────────────────────────────

export function ExplorerItem({
  item, onRename, onMove, onDelete, onProperties,
  onDoubleClick, onPreview, onDownload, onDropItem,
  isSelected, onItemClick,
}) {
  const isFolder  = item.type === 'FOLDER';
  const typeLabel = getFileTypeLabel(item);
  const subtitle  = isFolder ? typeLabel : formatBytes(item.size);
  const [isDragOver, setIsDragOver] = useState(false);
  const hoverTimeout = useRef(null);

  const clearHoverTimeout = () => {
    if (hoverTimeout.current) { clearTimeout(hoverTimeout.current); hoverTimeout.current = null; }
  };

  const dragHandlers = {
    draggable: !isFolder,
    onDragStart: (e) => {
      if (isFolder) { e.preventDefault(); return; }
      e.dataTransfer.setData('application/json', JSON.stringify({
        type: 'CLOUD_FILE', id: item.id, name: item.displayName, size: item.size,
      }));
      e.dataTransfer.effectAllowed = 'copy';
    },
    onDragOver: (e) => {
      if (!isFolder) return;
      e.preventDefault(); e.stopPropagation();
      e.dataTransfer.dropEffect = 'copy';
      setIsDragOver(true);
      if (!hoverTimeout.current) {
        hoverTimeout.current = setTimeout(() => {
          onDoubleClick?.(item); hoverTimeout.current = null; setIsDragOver(false);
        }, 600);
      }
    },
    onDragLeave: (e) => {
      if (!isFolder) return;
      e.preventDefault(); e.stopPropagation();
      setIsDragOver(false); clearHoverTimeout();
    },
    onDragEnd: clearHoverTimeout,
    onDrop: (e) => {
      if (!isFolder) return;
      e.preventDefault(); e.stopPropagation();
      setIsDragOver(false); clearHoverTimeout(); onDropItem?.(e, item);
    },
  };

  // Sky Blue for Cloud selected state
  const selectedRing = 'ring-2 ring-[#5D82A6]/60 dark:ring-[#5D82A6]/50';

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <Card
          {...dragHandlers}
          onClick={(e) => { e.stopPropagation(); onItemClick?.(item); }}
          onDoubleClick={() => onDoubleClick?.(item)}
          className={[
            'glass-card group relative flex flex-col items-center justify-center gap-3 p-4 rounded-xl cursor-pointer select-none transition-all duration-150',
            'h-[120px] hover:bg-black/5 dark:hover:bg-white/5',
            isSelected ? selectedRing : 'hover:border-surface-400/30',
            isDragOver ? 'ring-2 ring-[#5D82A6]/60' : '',
          ].join(' ')}
        >
          {/* Three-dot hover menu */}
          <DropdownMenu>
            <DropdownMenuTrigger
              className="h-7 w-7 absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity flex items-center justify-center rounded hover:bg-black/10 dark:hover:bg-white/10 text-surface-500 outline-none"
              onClick={(e) => e.stopPropagation()}
            >
              <MoreVertical className="w-4 h-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <ItemMenuItems
                item={item}
                onDoubleClick={onDoubleClick}
                onRename={onRename}
                onMove={onMove}
                onDelete={onDelete}
                onProperties={onProperties}
                onPreview={onPreview}
                onDownload={onDownload}
                MenuItemComp={DropdownMenuItem}
                SeparatorComp={DropdownMenuSeparator}
              />
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Icon */}
          <div className="transition-transform duration-150 group-hover:scale-105">
            {getItemIcon(item, 'w-9 h-9')}
          </div>

          {/* Name + subtitle */}
          <div className="text-center w-full px-1">
            <p
              className="text-xs font-medium text-foreground dark:text-white truncate leading-tight"
              title={item.displayName}
            >
              {item.displayName}
            </p>
            <p className="text-[11px] text-foreground/70 dark:text-white/70 mt-0.5">{subtitle}</p>
          </div>
        </Card>
      </ContextMenuTrigger>

      {/* Right-click context menu */}
      <ContextMenuContent className="w-44">
        <ItemMenuItems
          item={item}
          onDoubleClick={onDoubleClick}
          onRename={onRename}
          onMove={onMove}
          onDelete={onDelete}
          onProperties={onProperties}
          onPreview={onPreview}
          onDownload={onDownload}
          MenuItemComp={ContextMenuItem}
          SeparatorComp={ContextMenuSeparator}
        />
      </ContextMenuContent>
    </ContextMenu>
  );
}

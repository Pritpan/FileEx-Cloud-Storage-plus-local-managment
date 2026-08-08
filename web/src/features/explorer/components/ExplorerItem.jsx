import { File, Folder, Image, FileText, FileSpreadsheet, MoreVertical, Pencil, FolderInput, Trash2, Eye, Download } from 'lucide-react';
import { Card } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';

/**
 * Format bytes to human-readable string.
 */
export const formatBytes = (bytes, decimals = 1) => {
  if (!+bytes) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(decimals))} ${sizes[i]}`;
};

/**
 * Format ISO date string to a readable date.
 */
export const formatDate = (dateString) => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
};

/**
 * Derive an icon component based on a file/folder item's type and name.
 * @param {object} item - The file/folder item from the API.
 * @param {string} size - Tailwind size class (e.g. 'w-10 h-10')
 */
export const getItemIcon = (item, size = 'w-10 h-10') => {
  if (item.type === 'FOLDER') {
    return <Folder className={`${size} text-brand-500 fill-brand-100 dark:fill-brand-900/30`} />;
  }
  const name = item.displayName || '';
  if (name.endsWith('.pdf')) return <FileText className={`${size} text-red-500`} />;
  if (name.endsWith('.xlsx') || name.endsWith('.xls')) return <FileSpreadsheet className={`${size} text-green-500`} />;
  if (/\.(png|jpg|jpeg|gif|webp|svg)$/i.test(name)) return <Image className={`${size} text-blue-500`} />;
  return <File className={`${size} text-surface-500`} />;
};

/**
 * ItemActions — the three-dot dropdown menu for file operations.
 */
function ItemActions({ item, onRename, onMove, onDelete, onPreview, onDownload }) {
  const isFile = item.type !== 'FOLDER';
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="h-7 w-7 absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity flex items-center justify-center rounded-md hover:bg-surface-100 dark:hover:bg-surface-800 text-surface-500 hover:text-surface-900 dark:hover:text-surface-100 outline-none ring-offset-surface-0 focus-visible:ring-2 focus-visible:ring-brand-500"
        onClick={(e) => e.stopPropagation()}
      >
        <MoreVertical className="w-4 h-4" />
        <span className="sr-only">Open menu</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        {isFile && (
          <>
            <DropdownMenuItem onClick={() => onPreview(item)}>
              <Eye className="w-4 h-4 mr-2" />
              Preview
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onDownload(item)}>
              <Download className="w-4 h-4 mr-2" />
              Download
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </>
        )}
        <DropdownMenuItem onClick={() => onRename(item)}>
          <Pencil className="w-4 h-4 mr-2" />
          Rename
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onMove(item)}>
          <FolderInput className="w-4 h-4 mr-2" />
          Move
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => onDelete(item)}
          className="text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950"
        >
          <Trash2 className="w-4 h-4 mr-2" />
          Move to Trash
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/**
 * ExplorerItem — a card for grid view display of a single file or folder.
 *
 * @param {{ item, onRename, onMove, onDelete }} props
 */
export function ExplorerItem({ item, onRename, onMove, onDelete, onDoubleClick, onPreview, onDownload }) {
  const subtitle = item.type === 'FOLDER'
    ? formatDate(item.updatedAt)
    : formatBytes(item.size);

  return (
    <Card 
      className="group relative flex flex-col items-center justify-center p-4 h-40 border border-surface-200 dark:border-surface-800 bg-surface-0 dark:bg-surface-900 hover:border-brand-300 dark:hover:border-brand-700 hover:bg-brand-50/50 dark:hover:bg-brand-900/10 transition-colors cursor-pointer shadow-sm"
      onDoubleClick={() => onDoubleClick && onDoubleClick(item)}
    >
      {/* Action menu — appears on hover */}
      <ItemActions item={item} onRename={onRename} onMove={onMove} onDelete={onDelete} onPreview={onPreview} onDownload={onDownload} />

      <div className="mb-4 transition-transform group-hover:scale-105">
        {getItemIcon(item)}
      </div>
      <div className="text-center w-full">
        <p
          className="text-sm font-medium text-surface-900 dark:text-surface-100 truncate w-full px-2"
          title={item.displayName}
        >
          {item.displayName}
        </p>
        <p className="text-xs text-surface-500 dark:text-surface-400 mt-1">
          {subtitle}
        </p>
      </div>
    </Card>
  );
}

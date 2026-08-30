/**
 * LocalExplorerTable.jsx — list view for local files/folders
 *
 * Local-specific table with correct context menus and selection state.
 * Does NOT use the shared ExplorerTable (cloud-specific menu items).
 *
 * Context menu per row:
 *   Open | Upload to Cloud | Copy | Cut | Rename | Properties | Delete
 *
 * Selection: single click highlights the row.
 */
import { useState } from 'react';
import { getItemIcon, formatBytes, formatDate } from '@/features/explorer/components/ExplorerItem';
import {
  FolderOpen, UploadCloud, Copy, Scissors,
  Pencil, Trash2, FileText, MoreVertical,
} from 'lucide-react';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export function LocalExplorerTable({
  items,
  selectedId,
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
  return (
    <div className="px-6 py-4">
      <div className="border border-surface-200 dark:border-surface-800 rounded-md bg-surface-0 dark:bg-surface-900">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent border-surface-200 dark:border-surface-800">
              <TableHead className="w-[50%]">Name</TableHead>
              <TableHead>Date Modified</TableHead>
              <TableHead className="text-right">Size</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => (
              <LocalExplorerTableRow
                key={item.id}
                item={item}
                isSelected={selectedId === item.id}
                onSelect={onSelect}
                onOpen={onOpen}
                onUploadToCloud={onUploadToCloud}
                onCopy={onCopy}
                onCut={onCut}
                onRename={onRename}
                onDelete={onDelete}
                onProperties={onProperties}
                onDropItem={onDropItem}
              />
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function LocalExplorerTableRow({
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
  const [isDragOver, setIsDragOver] = useState(false);

  return (
    <TableRow
      onClick={() => onSelect?.(item)}
      onDoubleClick={() => onOpen?.(item)}
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
        if (!isFolder) return;
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
        'cursor-pointer border-surface-200 dark:border-surface-800 transition-colors group select-none',
        isSelected
          ? 'bg-brand-50 dark:bg-brand-900/20 hover:bg-brand-100 dark:hover:bg-brand-900/30'
          : 'hover:bg-surface-50 dark:hover:bg-surface-800/50',
        isDragOver ? 'bg-blue-50/50 dark:bg-blue-900/20' : '',
      ].join(' ')}
    >
      <TableCell className="font-medium">
        <div className="flex items-center gap-3">
          {getItemIcon(item, 'w-5 h-5')}
          <span className="truncate max-w-[200px] sm:max-w-[300px]">
            {item.displayName}
          </span>
        </div>
      </TableCell>
      <TableCell className="text-surface-500 dark:text-surface-400">
        {formatDate(item.updatedAt)}
      </TableCell>
      <TableCell className="text-right text-surface-500 dark:text-surface-400">
        {isFolder ? '--' : formatBytes(item.size)}
      </TableCell>
      <TableCell>
        <DropdownMenu>
          <DropdownMenuTrigger
            className="h-7 w-7 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity flex items-center justify-center rounded-md hover:bg-surface-100 dark:hover:bg-surface-800 text-surface-500 hover:text-surface-900 dark:hover:text-surface-100 outline-none ring-offset-surface-0 focus-visible:ring-2 focus-visible:ring-brand-500"
            onClick={(e) => e.stopPropagation()}
          >
            <MoreVertical className="w-4 h-4" />
            <span className="sr-only">Open menu</span>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={() => onOpen?.(item)}>
              <FolderOpen className="w-4 h-4 mr-2" />
              Open
            </DropdownMenuItem>

            {!isFolder && (
              <DropdownMenuItem onClick={() => onUploadToCloud?.(item)}>
                <UploadCloud className="w-4 h-4 mr-2" />
                Upload to Cloud
              </DropdownMenuItem>
            )}

            <DropdownMenuSeparator />

            <DropdownMenuItem onClick={() => onCopy?.(item)}>
              <Copy className="w-4 h-4 mr-2" />
              Copy
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onCut?.(item)}>
              <Scissors className="w-4 h-4 mr-2" />
              Cut
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            <DropdownMenuItem onClick={() => onRename?.(item)}>
              <Pencil className="w-4 h-4 mr-2" />
              Rename
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            <DropdownMenuItem onClick={() => onProperties?.(item)}>
              <FileText className="w-4 h-4 mr-2" />
              Properties
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            <DropdownMenuItem
              onClick={() => onDelete?.(item)}
              className="text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>

  );
}

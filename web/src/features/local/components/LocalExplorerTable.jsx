/**
 * LocalExplorerTable.jsx — list view for local files/folders
 *
 * Each row wraps itself in an inline ContextMenu (same approach as
 * LocalExplorerItem) so right-click reliably shows item-specific actions
 * without any async state timing issues.
 *
 * Context menu per row:
 *   Open | Upload to Cloud | Copy | Cut | Rename | Properties | Delete
 *
 * Selection: single click highlights the row.
 */
import { useState, useRef } from 'react';
import { getItemIcon, getFileTypeLabel, formatBytes, formatDate } from '@/features/explorer/components/ExplorerItem';
import {
  FolderOpen, UploadCloud, Copy, Scissors,
  Pencil, Trash2, FileText, MoreVertical, ArrowUp, ArrowDown
} from 'lucide-react';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  ContextMenu, ContextMenuContent, ContextMenuItem,
  ContextMenuSeparator, ContextMenuTrigger,
} from '@/components/ui/context-menu';
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
  sortBy,
  sortDirection,
  onSortChange,
}) {
  const folders = items.filter((i) => i.type === 'FOLDER').length;
  const files   = items.length - folders;
  const totalBytes = items.reduce((s, i) => s + (i._local?.size || i.size || 0), 0);

  const handleSort = (field) => {
    if (sortBy === field) {
      onSortChange(field, sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      onSortChange(field, field === 'modified' ? 'desc' : 'asc');
    }
  };

  const renderSortIcon = (field) => {
    if (sortBy !== field) return null;
    return sortDirection === 'asc' 
      ? <ArrowUp className="w-3 h-3 ml-1 inline text-brand-500" />
      : <ArrowDown className="w-3 h-3 ml-1 inline text-brand-500" />;
  };

  return (
    <div className="px-4 py-3 flex flex-col gap-0">
      <div className="glass-table rounded-lg overflow-hidden">
        <Table className="table-fixed w-full">
          <TableHeader>
            <TableRow className="hover:bg-transparent border-b border-white/20 dark:border-white/10">
              <TableHead className="w-8 pl-3"><span className="sr-only">Select</span></TableHead>
              <TableHead className="w-[40%] pl-2 cursor-pointer hover:bg-white/10 dark:hover:bg-white/5 transition-colors" onClick={() => handleSort('name')}>
                Name {renderSortIcon('name')}
              </TableHead>
              <TableHead className="w-[20%] cursor-pointer hover:bg-white/10 dark:hover:bg-white/5 transition-colors" onClick={() => handleSort('type')}>
                Type {renderSortIcon('type')}
              </TableHead>
              <TableHead className="w-[20%] cursor-pointer hover:bg-white/10 dark:hover:bg-white/5 transition-colors" onClick={() => handleSort('modified')}>
                Date Modified {renderSortIcon('modified')}
              </TableHead>
              <TableHead className="w-[14%] text-right cursor-pointer hover:bg-white/10 dark:hover:bg-white/5 transition-colors" onClick={() => handleSort('size')}>
                Size {renderSortIcon('size')}
              </TableHead>
              <TableHead className="w-[6%]" />
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

      {/* Status bar */}
      <div className="flex items-center gap-3 px-3 pt-2 pb-1 text-[11px] text-surface-600 dark:text-surface-400 select-none">
        <span>{items.length} {items.length === 1 ? 'item' : 'items'}</span>
        {(folders > 0 || files > 0) && (
          <>
            <span className="text-surface-300 dark:text-surface-600">|</span>
            <span>{folders} {folders === 1 ? 'folder' : 'folders'}, {files} {files === 1 ? 'file' : 'files'}</span>
          </>
        )}
        {totalBytes > 0 && (
          <>
            <span className="text-surface-300 dark:text-surface-600">|</span>
            <span>Total size: {formatBytes(totalBytes)}</span>
          </>
        )}
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
        <TableRow
          onClick={() => onSelect?.(item)}
          onDoubleClick={() => onOpen?.(item)}
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
            'cursor-pointer border-b border-white/15 dark:border-white/6 last:border-0 transition-colors group select-none',
            isSelected
              ? 'bg-[#587463]/12 dark:bg-[#587463]/18'
              : 'hover:bg-white/30 dark:hover:bg-white/5',
            isDragOver ? 'bg-[#587463]/10' : '',
          ].join(' ')}
        >
          {/* Checkbox */}
          <TableCell className="pl-3 w-8">
            <div className={`w-3.5 h-3.5 rounded border transition-colors ${
              isSelected
                ? 'border-[#587463] bg-[#587463]'
                : 'border-surface-300 dark:border-surface-600 group-hover:border-surface-400'
            }`} />
          </TableCell>

          {/* Name */}
          <TableCell className="pl-2 font-medium max-w-0">
            <div className="flex items-center gap-2.5 min-w-0 w-full">
              <div className="shrink-0">{getItemIcon(item, 'w-5 h-5')}</div>
              <span className="truncate text-sm font-medium text-foreground dark:text-white block" title={item.displayName}>
                {item.displayName}
              </span>
            </div>
          </TableCell>

          {/* Type */}
          <TableCell className="text-sm text-foreground/80 dark:text-white/80 truncate max-w-0">
            {getFileTypeLabel(item)}
          </TableCell>

          {/* Date Modified */}
          <TableCell className="text-sm text-foreground/80 dark:text-white/80 truncate max-w-0">
            {item._local?.modifiedAt ? formatDate(item._local.modifiedAt) : '--'}
          </TableCell>

          {/* Size */}
          <TableCell className="text-sm text-right text-foreground/80 dark:text-white/80 truncate max-w-0">
            {isFolder ? '—' : formatBytes(item._local?.size ?? item.size)}
          </TableCell>
          <TableCell>
            {/* Three-dot dropdown */}
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
          </TableCell>
        </TableRow>
      </ContextMenuTrigger>

      {/* Right-click context menu */}
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

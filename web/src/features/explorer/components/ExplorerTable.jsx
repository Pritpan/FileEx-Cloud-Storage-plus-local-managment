import { useState, useRef } from 'react';
import { getItemIcon, getFileTypeLabel, formatBytes, formatDate } from './ExplorerItem';
import {
  Pencil, FolderInput, Trash2, MoreVertical,
  Eye, Download, FileText, FolderOpen, ArrowUp, ArrowDown
} from 'lucide-react';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  ContextMenu, ContextMenuContent, ContextMenuItem,
  ContextMenuSeparator, ContextMenuTrigger,
} from '@/components/ui/context-menu';

/**
 * ExplorerTable — professional list view for cloud file/folder items.
 * Columns: [Checkbox] Name | Type | Date Modified | Size | Actions
 * Accent: Sky Blue (#5D82A6) for Cloud selection.
 */
export function ExplorerTable({
  items, onRename, onMove, onDelete, onProperties,
  onDoubleClick, onPreview, onDownload, onDropItem,
  selectedItem, onItemClick,
  sortBy, sortDirection, onSortChange
}) {
  const folders    = items.filter((i) => i.type === 'FOLDER').length;
  const files      = items.length - folders;
  const totalBytes = items.reduce((s, i) => s + (i.size || 0), 0);

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
              <ExplorerTableRow
                key={item.id}
                item={item}
                isSelected={selectedItem?.id === item.id}
                onItemClick={onItemClick}
                onRename={onRename}
                onMove={onMove}
                onDelete={onDelete}
                onProperties={onProperties}
                onDoubleClick={onDoubleClick}
                onPreview={onPreview}
                onDownload={onDownload}
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

// ─── Shared menu content ─────────────────────────────────────────────────────

function TableRowMenuItems({ item, MenuItemComp, SeparatorComp, onDoubleClick, onPreview, onDownload, onRename, onMove, onProperties, onDelete }) {
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

// ─── Table row ───────────────────────────────────────────────────────────────

function ExplorerTableRow({
  item, isSelected, onItemClick,
  onRename, onMove, onDelete, onProperties,
  onDoubleClick, onPreview, onDownload, onDropItem,
}) {
  const isFolder = item.type === 'FOLDER';
  const [isDragOver, setIsDragOver] = useState(false);
  const hoverTimeout = useRef(null);

  const clearHoverTimeout = () => {
    if (hoverTimeout.current) { clearTimeout(hoverTimeout.current); hoverTimeout.current = null; }
  };

  const menuProps = {
    item, onDoubleClick, onPreview, onDownload,
    onRename, onMove, onProperties, onDelete,
  };

  const rowContent = (
    <TableRow
      onClick={(e) => { e.stopPropagation(); onItemClick?.(item); }}
      onDoubleClick={() => onDoubleClick?.(item)}
      draggable={!isFolder}
      onDragStart={(e) => {
        if (isFolder) { e.preventDefault(); return; }
        e.dataTransfer.setData('application/json', JSON.stringify({
          type: 'CLOUD_FILE', id: item.id, name: item.displayName, size: item.size,
        }));
        e.dataTransfer.effectAllowed = 'copy';
      }}
      onDragOver={(e) => {
        if (!isFolder) return;
        e.preventDefault(); e.stopPropagation();
        e.dataTransfer.dropEffect = 'copy';
        setIsDragOver(true);
        if (!hoverTimeout.current) {
          hoverTimeout.current = setTimeout(() => {
            onDoubleClick?.(item); hoverTimeout.current = null; setIsDragOver(false);
          }, 600);
        }
      }}
      onDragLeave={(e) => {
        if (!isFolder) return;
        e.preventDefault(); e.stopPropagation();
        setIsDragOver(false); clearHoverTimeout();
      }}
      onDragEnd={clearHoverTimeout}
      onDrop={(e) => {
        if (!isFolder) return;
        e.preventDefault(); e.stopPropagation();
        setIsDragOver(false); clearHoverTimeout(); onDropItem?.(e, item);
      }}
      className={[
        'cursor-pointer transition-colors group select-none border-b border-white/15 dark:border-white/6 last:border-0',
        // Sky Blue for Cloud selection
        isSelected
          ? 'bg-[#5D82A6]/12 dark:bg-[#5D82A6]/18'
          : 'hover:bg-white/30 dark:hover:bg-white/5',
        isDragOver ? 'bg-[#5D82A6]/10 ring-1 ring-inset ring-[#5D82A6]/40' : '',
      ].join(' ')}
    >
      {/* Checkbox */}
      <TableCell className="pl-3 w-8">
        <div
          className={`w-3.5 h-3.5 rounded border transition-colors ${
            isSelected
              ? 'border-[#5D82A6] bg-[#5D82A6]'
              : 'border-surface-300 dark:border-surface-600 group-hover:border-surface-400'
          }`}
        />
      </TableCell>

      {/* Name */}
      <TableCell className="pl-2 font-medium max-w-0">
        <div className="flex items-center gap-2.5 min-w-0 w-full">
          <div className="shrink-0">{getItemIcon(item, 'w-5 h-5')}</div>
          <span
            className="truncate text-sm font-medium text-foreground dark:text-white block"
            title={item.displayName}
          >
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
        {item.updatedAt ? formatDate(item.updatedAt) : '--'}
      </TableCell>

      {/* Size */}
      <TableCell className="text-sm text-right text-foreground/80 dark:text-white/80 truncate max-w-0">
        {isFolder ? '—' : formatBytes(item.size)}
      </TableCell>

      {/* Actions */}
      <TableCell className="pr-2">
        <DropdownMenu>
          <DropdownMenuTrigger
            className="h-7 w-7 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity flex items-center justify-center rounded hover:bg-black/10 dark:hover:bg-white/10 text-surface-500 outline-none"
            onClick={(e) => e.stopPropagation()}
          >
            <MoreVertical className="w-4 h-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            <TableRowMenuItems
              {...menuProps}
              MenuItemComp={DropdownMenuItem}
              SeparatorComp={DropdownMenuSeparator}
            />
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  );

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>{rowContent}</ContextMenuTrigger>
      <ContextMenuContent className="w-44">
        <TableRowMenuItems
          {...menuProps}
          MenuItemComp={ContextMenuItem}
          SeparatorComp={ContextMenuSeparator}
        />
      </ContextMenuContent>
    </ContextMenu>
  );
}

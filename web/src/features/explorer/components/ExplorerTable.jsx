import { getItemIcon, formatBytes, formatDate } from './ExplorerItem';
import { Pencil, FolderInput, Trash2, MoreVertical, Eye, Download } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';

/**
 * ExplorerTable — list view for file/folder items.
 *
 * @param {{ items, onRename, onMove, onDelete }} props
 */
export function ExplorerTable({ items, onRename, onMove, onDelete, onDoubleClick, onPreview, onDownload }) {
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
              <TableRow
                key={item.id}
                onDoubleClick={() => onDoubleClick && onDoubleClick(item)}
                className="cursor-pointer hover:bg-surface-50 dark:hover:bg-surface-800/50 border-surface-200 dark:border-surface-800 transition-colors group"
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
                  {item.type === 'FOLDER' ? '--' : formatBytes(item.size)}
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
                    <DropdownMenuContent align="end" className="w-44">
                      {item.type !== 'FOLDER' && (
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
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

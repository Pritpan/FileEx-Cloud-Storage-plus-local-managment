import { ArrowDown, ArrowUp, Calendar, FileType, HardDrive, Type } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const SORT_OPTIONS = [
  { value: 'name', label: 'Name', icon: Type },
  { value: 'size', label: 'Size', icon: HardDrive },
  { value: 'type', label: 'Type', icon: FileType },
  { value: 'modified', label: 'Date Modified', icon: Calendar },
];

export function SortDropdown({ sortBy, direction, onChange }) {
  const currentOption = SORT_OPTIONS.find(o => o.value === sortBy) || SORT_OPTIONS[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger 
        className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors hover:bg-muted hover:text-foreground h-7 px-2 text-surface-500 dark:text-surface-400 dark:hover:text-white dark:hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
      >
        <span className="mr-1.5 text-xs">Sort: {currentOption.label}</span>
        {direction === 'asc' ? <ArrowDown className="w-3.5 h-3.5" /> : <ArrowUp className="w-3.5 h-3.5" />}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {SORT_OPTIONS.map((option) => (
          <DropdownMenuItem
            key={option.value}
            onClick={() => {
              if (sortBy === option.value) {
                // Toggle direction if same field
                onChange(sortBy, direction === 'asc' ? 'desc' : 'asc');
              } else {
                // Default to asc when switching fields (or desc for Date/Size if preferred, but asc is standard)
                onChange(option.value, option.value === 'modified' ? 'desc' : 'asc');
              }
            }}
            className="flex items-center justify-between"
          >
            <div className="flex items-center gap-2">
              <option.icon className="w-4 h-4 text-surface-500" />
              <span>{option.label}</span>
            </div>
            {sortBy === option.value && (
              <span className="text-brand-500">
                {direction === 'asc' ? '↑' : '↓'}
              </span>
            )}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => onChange(sortBy, 'asc')} className="flex items-center justify-between">
          <span>Ascending</span>
          {direction === 'asc' && <span className="text-brand-500">✓</span>}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onChange(sortBy, 'desc')} className="flex items-center justify-between">
          <span>Descending</span>
          {direction === 'desc' && <span className="text-brand-500">✓</span>}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

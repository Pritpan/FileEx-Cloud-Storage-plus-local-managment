import { UploadCloud, FolderPlus, LayoutGrid, List, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export function Toolbar({ viewMode, setViewMode }) {
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 py-4 px-6 border-b border-surface-200 dark:border-surface-800 bg-surface-0 dark:bg-surface-950">
      <div className="flex items-center gap-2">
        <Button className="bg-brand-600 hover:bg-brand-700 text-white" disabled>
          <UploadCloud className="w-4 h-4 mr-2" />
          Upload
        </Button>
        <Button variant="outline" disabled>
          <FolderPlus className="w-4 h-4 mr-2" />
          New Folder
        </Button>
      </div>

      <div className="flex items-center gap-2 w-full sm:w-auto">
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-surface-500" />
          <Input 
            type="text" 
            placeholder="Search files..." 
            className="pl-9 bg-surface-50 dark:bg-surface-900 border-surface-200 dark:border-surface-800"
            disabled
          />
        </div>
        
        <div className="flex items-center border border-surface-200 dark:border-surface-800 rounded-md p-1 bg-surface-50 dark:bg-surface-900">
          <Button 
            variant="ghost" 
            size="icon" 
            className={`h-7 w-7 rounded-sm ${viewMode === 'list' ? 'bg-surface-200 dark:bg-surface-800 shadow-sm' : ''}`}
            onClick={() => setViewMode('list')}
          >
            <List className="w-4 h-4 text-surface-700 dark:text-surface-300" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            className={`h-7 w-7 rounded-sm ${viewMode === 'grid' ? 'bg-surface-200 dark:bg-surface-800 shadow-sm' : ''}`}
            onClick={() => setViewMode('grid')}
          >
            <LayoutGrid className="w-4 h-4 text-surface-700 dark:text-surface-300" />
          </Button>
        </div>
      </div>
    </div>
  );
}

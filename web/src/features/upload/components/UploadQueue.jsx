import { useState } from 'react';
import { X, ChevronDown, ChevronUp, ArrowUpDown } from 'lucide-react';
import { useUploadStore } from '../store/upload.store';
import { UploadItem } from './UploadItem';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export function UploadQueue() {
  const { uploads, removeUpload, clearCompleted } = useUploadStore();
  const [isMinimized, setIsMinimized] = useState(false);

  if (uploads.length === 0) return null;

  const inProgressCount = uploads.filter(
    (u) => !['COMPLETED', 'FAILED'].includes(u.status)
  ).length;

  return (
    <Card className="fixed bottom-4 right-4 w-80 sm:w-96 shadow-2xl flex flex-col overflow-hidden z-50 border-surface-200 dark:border-surface-800 transition-all duration-300">
      {/* Header */}
      <div 
        className="bg-surface-900 dark:bg-surface-900 text-surface-50 flex items-center justify-between p-3 cursor-pointer"
        onClick={() => setIsMinimized(!isMinimized)}
      >
        <div className="flex items-center gap-2">
          <ArrowUpDown className="w-5 h-5 text-brand-400" />
          <span className="font-medium text-sm">
            {inProgressCount > 0 
              ? `Transferring ${inProgressCount} file${inProgressCount > 1 ? 's' : ''}...` 
              : 'Transfers complete'}
          </span>
        </div>

        
        <div className="flex items-center gap-1">
          {inProgressCount === 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs text-surface-400 hover:text-surface-100 hover:bg-surface-800"
              onClick={(e) => {
                e.stopPropagation();
                clearCompleted();
              }}
            >
              Clear
            </Button>
          )}
          <button className="p-1 hover:bg-surface-800 rounded transition-colors text-surface-400 hover:text-surface-100">
            {isMinimized ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* List */}
      {!isMinimized && (
        <div className="max-h-80 overflow-y-auto bg-surface-50 dark:bg-surface-950">
          {uploads.map((upload) => (
            <UploadItem 
              key={upload.id} 
              upload={upload} 
              onRemove={removeUpload} 
            />
          ))}
        </div>
      )}
    </Card>
  );
}

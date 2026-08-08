import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function ErrorState({ message, onRetry }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center h-full">
      <div className="w-20 h-20 bg-red-50 dark:bg-red-950/30 rounded-full flex items-center justify-center mb-6">
        <AlertTriangle className="w-10 h-10 text-red-500 dark:text-red-600" />
      </div>
      <h3 className="text-lg font-medium text-surface-900 dark:text-surface-100 mb-2">
        Something went wrong
      </h3>
      <p className="text-sm text-surface-500 dark:text-surface-400 max-w-sm mb-6">
        {message || "We couldn't load your files at this time. Please try again."}
      </p>
      <Button 
        onClick={onRetry} 
        variant="outline" 
        className="border-surface-300 hover:bg-surface-100 dark:border-surface-700 dark:hover:bg-surface-800"
      >
        Try Again
      </Button>
    </div>
  );
}

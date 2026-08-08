import { Skeleton } from '@/components/ui/skeleton';

export function LoadingSkeleton({ viewMode }) {
  if (viewMode === 'list') {
    return (
      <div className="px-6 py-4">
        <div className="border border-surface-200 dark:border-surface-800 rounded-md bg-surface-0 dark:bg-surface-900 p-4">
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <Skeleton className="h-5 w-5 rounded-full" />
              <Skeleton className="h-5 w-[40%]" />
              <Skeleton className="h-5 w-[20%] ml-auto" />
            </div>
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center gap-4 pt-4 border-t border-surface-100 dark:border-surface-800">
                <Skeleton className="h-8 w-8 rounded-md" />
                <Skeleton className="h-4 w-[30%]" />
                <Skeleton className="h-4 w-[15%] ml-auto" />
                <Skeleton className="h-4 w-[10%]" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Grid view skeleton
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 p-6">
      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
        <div key={i} className="flex flex-col items-center p-4 h-40 border border-surface-200 dark:border-surface-800 rounded-xl bg-surface-0 dark:bg-surface-900 shadow-sm">
          <Skeleton className="w-12 h-12 rounded-lg mb-4 mt-2" />
          <Skeleton className="h-4 w-3/4 mb-2" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      ))}
    </div>
  );
}

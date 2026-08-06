import { ChevronRight, Home } from 'lucide-react';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';

export function BreadcrumbNav({ items }) {
  return (
    <div className="px-6 py-3 border-b border-surface-200 dark:border-surface-800 bg-surface-50/50 dark:bg-surface-900/50">
      <Breadcrumb>
        <BreadcrumbList>
          {items.map((item, index) => {
            const isLast = index === items.length - 1;
            
            return (
              <div key={item.id} className="flex items-center">
                <BreadcrumbItem>
                  {isLast ? (
                    <BreadcrumbPage className="font-medium text-surface-900 dark:text-surface-100">
                      {item.label}
                    </BreadcrumbPage>
                  ) : (
                    <BreadcrumbLink href="#" className="flex items-center text-surface-600 hover:text-surface-900 dark:text-surface-400 dark:hover:text-surface-100">
                      {index === 0 && <Home className="w-4 h-4 mr-1.5" />}
                      {item.label}
                    </BreadcrumbLink>
                  )}
                </BreadcrumbItem>
                {!isLast && <BreadcrumbSeparator className="mx-2"><ChevronRight className="w-4 h-4" /></BreadcrumbSeparator>}
              </div>
            );
          })}
        </BreadcrumbList>
      </Breadcrumb>
    </div>
  );
}

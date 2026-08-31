import { ChevronRight } from 'lucide-react';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';

export function BreadcrumbNav({ items, onNavigate }) {
  return (
    <div className="px-5 py-2 border-b border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-900 shrink-0">
      <Breadcrumb>
        <BreadcrumbList>
          {items.map((item, index) => {
            const isLast = index === items.length - 1;
            return (
              <div key={item.id ?? item.label} className="flex items-center">
                <BreadcrumbItem>
                  {isLast ? (
                    <BreadcrumbPage className="text-sm font-medium text-brand-600 dark:text-brand-400">
                      {item.label}
                    </BreadcrumbPage>
                  ) : (
                    <button
                      type="button"
                      onClick={() => onNavigate && onNavigate(item, index)}
                      className="text-sm text-surface-500 hover:text-surface-700 dark:text-surface-400 dark:hover:text-surface-100 transition-colors"
                    >
                      {item.label}
                    </button>
                  )}
                </BreadcrumbItem>
                {!isLast && (
                  <BreadcrumbSeparator className="mx-1.5">
                    <ChevronRight className="w-3.5 h-3.5 text-surface-400" />
                  </BreadcrumbSeparator>
                )}
              </div>
            );
          })}
        </BreadcrumbList>
      </Breadcrumb>
    </div>
  );
}

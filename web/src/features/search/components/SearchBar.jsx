import { Search, X, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';

/**
 * SearchBar — the live search input in the Explorer toolbar.
 *
 * Props:
 *   query        (string)   — current raw input value (controlled)
 *   onChange     (fn)       — called with the new string on every keystroke
 *   onClear      (fn)       — called when user clicks the X button
 *   isLoading    (boolean)  — shows a spinner while results are fetching
 */
export function SearchBar({ query, onChange, onClear, isLoading }) {
  return (
    <div className="relative w-full sm:w-72">
      {/* Left icon: spinner when loading, magnifier otherwise */}
      <div className="absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-surface-400">
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Search className="h-4 w-4" />
        )}
      </div>

      <Input
        id="explorer-search"
        type="text"
        value={query}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search files and folders…"
        autoComplete="off"
        className="pl-9 pr-8 bg-surface-50 dark:bg-surface-900 border-surface-200 dark:border-surface-800 focus-visible:ring-brand-500 transition-all"
      />

      {/* Clear button — only visible when there is text */}
      {query.length > 0 && (
        <button
          onClick={onClear}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-surface-400 hover:text-surface-700 dark:hover:text-surface-200 transition-colors"
          aria-label="Clear search"
          type="button"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}

import { useState, useCallback } from 'react';

const STORAGE_KEY = 'fileex-sort-preference';

export function useSort(defaultSortBy = 'name', defaultDirection = 'asc') {
  const [sortState, setSortState] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.error('Failed to parse sort preference', e);
    }
    return { sortBy: defaultSortBy, direction: defaultDirection };
  });

  const setSort = useCallback((sortBy, direction) => {
    setSortState({ sortBy, direction });
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ sortBy, direction }));
  }, []);

  return {
    sortBy: sortState.sortBy,
    direction: sortState.direction,
    setSort,
  };
}

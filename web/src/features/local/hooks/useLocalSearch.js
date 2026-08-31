/**
 * useLocalSearch.js — E6.3: Local Filesystem Search
 *
 * Handles calling window.electronAPI.searchFiles() and managing the
 * async/stale-result lifecycle.
 *
 * Architecture:
 *   React  →  electronAPI.searchFiles(dirPath, query)
 *           →  IPC  →  Main Process  →  Filesystem traversal  →  Results
 *
 * Stale-result protection:
 *   Each search call increments a generation counter. Results from
 *   older calls are discarded when a newer call resolves.
 *
 * Returns: { results, isLoading, isError, error }
 */

import { useState, useEffect, useRef } from 'react';
import { adaptEntry } from './useLocalDirectory';

/**
 * @param {string|null} dirPath   - The directory to search in (null → no search)
 * @param {string}      query     - The search query (already debounced by caller)
 */
export function useLocalSearch(dirPath, query) {
  const [results,   setResults]   = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isError,   setIsError]   = useState(false);
  const [error,     setError]     = useState(null);

  // Generation counter — increment on each new search to discard stale results
  const generationRef = useRef(0);

  const isActive = Boolean(dirPath) && query.trim().length >= 2;

  useEffect(() => {
    if (!isActive) {
      setResults([]);
      setIsLoading(false);
      setIsError(false);
      setError(null);
      return;
    }

    if (!window.electronAPI?.searchFiles) return;

    // Bump generation so any in-flight previous call is ignored
    const myGeneration = ++generationRef.current;

    setIsLoading(true);
    setIsError(false);
    setError(null);

    window.electronAPI.searchFiles(dirPath, query.trim())
      .then((result) => {
        // Discard stale result
        if (generationRef.current !== myGeneration) return;

        if (result.success) {
          setResults(result.data.map(adaptEntry));
          setIsError(false);
          setError(null);
        } else {
          setResults([]);
          setIsError(true);
          setError(result.error?.message ?? 'Search failed.');
        }
      })
      .catch((err) => {
        if (generationRef.current !== myGeneration) return;
        setResults([]);
        setIsError(true);
        setError(err.message ?? 'Search failed.');
      })
      .finally(() => {
        if (generationRef.current === myGeneration) {
          setIsLoading(false);
        }
      });
  }, [dirPath, query, isActive]);

  return { results, isLoading, isError, error };
}

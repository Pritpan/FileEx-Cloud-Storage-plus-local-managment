import { useState, useEffect } from 'react';

/**
 * useDebounce — delays the value update until the user stops typing.
 *
 * @param {*} value     - The value to debounce (e.g. a search string)
 * @param {number} delay - Delay in ms (default 400ms)
 * @returns {*} The debounced value
 */
export function useDebounce(value, delay = 400) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Clear the timer every time `value` changes before delay expires
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}

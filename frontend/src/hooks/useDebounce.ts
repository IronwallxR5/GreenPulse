import { useState, useEffect } from 'react';

/**
 * Delays updating a value until the user stops typing for `delay` ms.
 * Used to avoid firing an API request on every individual keystroke.
 */
export function useDebounce<T>(value: T, delay = 400): T {
  const [debounced, setDebounced] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}

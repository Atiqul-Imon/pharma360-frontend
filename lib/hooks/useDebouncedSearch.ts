import { useCallback, useEffect, useRef, useState } from 'react';

export interface UseDebouncedSearchOptions<Result> {
  delay?: number;
  minLength?: number;
  initialQuery?: string;
  search: (query: string, signal: AbortSignal) => Promise<Result>;
  onError?: (error: unknown) => void;
}

export interface UseDebouncedSearchResult<Result> {
  query: string;
  setQuery: (value: string) => void;
  results: Result | null;
  isSearching: boolean;
  clear: () => void;
}

const isAbortError = (error: unknown): boolean => {
  if (!error) {
    return false;
  }

  const name = (error as { name?: string }).name;
  return name === 'CanceledError' || name === 'AbortError';
};

export function useDebouncedSearch<Result>(
  options: UseDebouncedSearchOptions<Result>
): UseDebouncedSearchResult<Result> {
  const { delay = 300, minLength = 2, initialQuery = '', search, onError } = options;

  const [query, setQueryState] = useState(initialQuery);
  const [results, setResults] = useState<Result | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  const abortControllerRef = useRef<AbortController | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const clearPending = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  }, []);

  const executeSearch = useCallback(
    (value: string) => {
      clearPending();
      setQueryState(value);

      const trimmed = value.trim();
      if (trimmed.length < minLength) {
        setResults(null);
        return;
      }

      timeoutRef.current = setTimeout(async () => {
        setIsSearching(true);
        const controller = new AbortController();
        abortControllerRef.current = controller;

        try {
          const data = await search(trimmed, controller.signal);
          setResults(data);
        } catch (error) {
          if (!isAbortError(error)) {
            console.error('[useDebouncedSearch] search failed', error);
            onError?.(error);
          }
        } finally {
          if (abortControllerRef.current === controller) {
            abortControllerRef.current = null;
          }
          setIsSearching(false);
        }
      }, delay);
    },
    [clearPending, delay, minLength, onError, search]
  );

  const clear = useCallback(() => {
    clearPending();
    setQueryState('');
    setResults(null);
    setIsSearching(false);
  }, [clearPending]);

  useEffect(() => {
    if (initialQuery) {
      executeSearch(initialQuery);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(
    () => () => {
      clearPending();
    },
    [clearPending]
  );

  return {
    query,
    setQuery: executeSearch,
    results,
    isSearching,
    clear,
  };
}

export default useDebouncedSearch;


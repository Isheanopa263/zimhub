import { useState, useEffect, useRef } from "react";
import { searchApi } from "../api/endpoints/search.api";

/**
 * Debounced global search hook
 */
const useSearch = (initialQuery = "", delay = 400) => {
  const [query, setQuery] = useState(initialQuery);
  const [debouncedQuery, setDebouncedQuery] = useState(initialQuery);
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchingRef = useRef(false);
  const debounceTimerRef = useRef(null);

  /* Debounce input → debouncedQuery */
  useEffect(() => {
    clearTimeout(debounceTimerRef.current);

    debounceTimerRef.current = setTimeout(() => {
      setDebouncedQuery(query);
    }, delay);

    return () => clearTimeout(debounceTimerRef.current);
  }, [query, delay]);

  /* Fetch when debouncedQuery changes */
  useEffect(() => {
    const q = debouncedQuery.trim();

    if (q.length < 2) {
      setResults(null);
      setError(null);
      return;
    }

    if (fetchingRef.current) return;
    fetchingRef.current = true;

    setLoading(true);
    setError(null);

    searchApi
      .global(q, 5)
      .then((response) => {
        setResults(response.data);
      })
      .catch((err) => {
        const msg = err?.response?.data?.message || "Search failed";
        setError(msg);
        setResults(null);
      })
      .finally(() => {
        setLoading(false);
        fetchingRef.current = false;
      });
  }, [debouncedQuery]);

  return {
    query,
    setQuery,
    debouncedQuery,
    results,
    loading,
    error,
  };
};

export default useSearch;

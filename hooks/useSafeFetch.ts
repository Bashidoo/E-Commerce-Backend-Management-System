import { useState, useCallback, useRef } from 'react';

interface SafeFetchOptions {
  limit?: number;      // Max requests
  windowMs?: number;   // Time window in ms (default 60s)
}

/**
 * A wrapper around fetch/api calls that prevents infinite loops.
 * If called more than 'limit' times within 'windowMs', it throws an error.
 */
export const useSafeFetch = (options: SafeFetchOptions = {}) => {
  const { limit = 10, windowMs = 60000 } = options;
  
  // We use a ref to store timestamps so re-renders don't reset the counter
  const historyRef = useRef<number[]>([]);
  const [isLocked, setIsLocked] = useState(false);

  const checkRateLimit = useCallback(() => {
    const now = Date.now();
    
    // Filter out requests older than the window
    historyRef.current = historyRef.current.filter(t => now - t < windowMs);

    // Check if we exceeded the limit
    if (historyRef.current.length >= limit) {
      setIsLocked(true);
      const error = new Error(`SAFETY LOCK: Request limit exceeded (${limit} reqs/${windowMs/1000}s). API calls paused to prevent billing spikes.`);
      console.error(error.message);
      return false;
    }

    // Add current timestamp
    historyRef.current.push(now);
    return true;
  }, [limit, windowMs]);

  const safeExecute = useCallback(async <T>(fn: () => Promise<T>): Promise<T | null> => {
    if (isLocked) {
      console.warn("API call blocked by Safety Hook.");
      return null;
    }

    if (!checkRateLimit()) {
      return null;
    }

    try {
      return await fn();
    } catch (error) {
      throw error;
    }
  }, [isLocked, checkRateLimit]);

  return { safeExecute, isLocked };
};

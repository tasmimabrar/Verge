import { QueryClient } from '@tanstack/react-query';

/**
 * React Query Client Configuration
 * 
 * Balanced configuration for Firebase integration:
 * 1. Moderate staleTime (5 min) - data stays fresh but not too long
 * 2. Long gcTime (30 min) - cache persists longer
 * 3. Smart refetching - refetch stale data on mount, not fresh data
 * 4. Automatic recovery from errors
 * 
 * Key behavior:
 * - Fresh data (< 5 min old): No refetch on mount
 * - Stale data (> 5 min old): Refetch on mount
 * - Failed queries: Refetch on mount to recover
 * - Background refetch on window focus for stale data
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Caching strategy
      staleTime: 5 * 60 * 1000, // 5 minutes - data stays fresh
      gcTime: 30 * 60 * 1000, // 30 minutes - cache persists in memory
      
      // Refetch strategy - smart refetching
      refetchOnWindowFocus: true, // Refetch stale data when returning to tab (helps catch updates)
      refetchOnMount: true, // Refetch stale/failed data on component mount (CRITICAL for error recovery)
      refetchOnReconnect: true, // Refetch stale data after network reconnection
      
      // These ensure ONLY stale data is refetched, not fresh data
      // So you still minimize Firebase reads while ensuring data freshness
      
      // Retry strategy for failed requests
      retry: 2, // Retry twice to handle temporary Firebase issues
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 5000), // Exponential backoff (max 5s)
    },
    mutations: {
      // Retry failed mutations twice
      retry: 2,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 5000),
    },
  },
});

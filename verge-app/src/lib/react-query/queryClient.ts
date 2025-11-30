import { QueryClient } from '@tanstack/react-query';

/**
 * React Query Client Configuration
 * 
 * Optimized for Firebase integration with:
 * 1. Long staleTime (10 min) - data stays fresh longer
 * 2. Long gcTime (30 min) - cache persists longer
 * 3. Minimal refetching to reduce Firebase reads
 * 
 * Trade-off: Page refreshes will refetch (in-memory cache only),
 * but this is better than complex persistence setup. Firebase SDK
 * has its own offline persistence anyway.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Caching strategy - keep data fresh longer
      staleTime: 10 * 60 * 1000, // 10 minutes - data stays fresh (increased from 5)
      gcTime: 30 * 60 * 1000, // 30 minutes - cache lifetime (increased from 10)
      
      // Refetch strategy - minimize Firebase reads
      refetchOnWindowFocus: false, // Don't refetch on tab focus
      refetchOnMount: false, // Don't refetch if data is still fresh
      refetchOnReconnect: false, // Don't refetch on network reconnect
      
      // Retry strategy for failed requests
      retry: 1, // Only retry once to avoid excessive Firebase calls
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
    mutations: {
      // Retry failed mutations once
      retry: 1,
    },
  },
});

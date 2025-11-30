import { QueryClient } from '@tanstack/react-query';

/**
 * React Query Client Configuration
 * 
 * Optimized for Firebase integration with aggressive caching
 * to minimize reads and reduce costs.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Caching strategy to minimize Firebase reads
      staleTime: 5 * 60 * 1000, // 5 minutes - data stays fresh
      gcTime: 10 * 60 * 1000, // 10 minutes - cache lifetime (formerly cacheTime)
      
      // Refetch strategy
      refetchOnWindowFocus: false, // Don't refetch on tab focus (reduces reads)
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

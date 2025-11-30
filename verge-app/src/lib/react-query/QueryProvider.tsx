import type { FC, ReactNode } from 'react';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import type { PersistedClient, Persister } from '@tanstack/react-query-persist-client';
import { queryClient } from './queryClient';

interface QueryProviderProps {
  children: ReactNode;
}

/**
 * Custom localStorage persister for React Query
 * 
 * Stores the entire query cache in localStorage so data survives page refreshes.
 * This dramatically reduces Firebase reads after the initial load.
 */
const createLocalStoragePersister = (): Persister => {
  const STORAGE_KEY = 'VERGE_REACT_QUERY_CACHE';
  
  return {
    persistClient: async (client: PersistedClient) => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(client));
      } catch (error) {
        console.warn('Failed to persist query cache:', error);
      }
    },
    restoreClient: async () => {
      try {
        const cached = localStorage.getItem(STORAGE_KEY);
        if (!cached) return undefined;
        
        const parsed = JSON.parse(cached) as PersistedClient;
        
        // Check if cache is expired (older than 30 minutes)
        const now = Date.now();
        const cacheAge = now - parsed.timestamp;
        const maxAge = 30 * 60 * 1000; // 30 minutes
        
        if (cacheAge > maxAge) {
          localStorage.removeItem(STORAGE_KEY);
          return undefined;
        }
        
        return parsed;
      } catch (error) {
        console.warn('Failed to restore query cache:', error);
        return undefined;
      }
    },
    removeClient: async () => {
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch (error) {
        console.warn('Failed to remove query cache:', error);
      }
    },
  };
};

const persister = createLocalStoragePersister();

/**
 * React Query Provider
 * 
 * Wraps the app with React Query context for server state management.
 * 
 * Features:
 * - localStorage persistence (data survives page refreshes!)
 * - 30-minute cache lifetime
 * - Only persists successful queries
 * - Devtools in development for debugging
 */
export const QueryProvider: FC<QueryProviderProps> = ({ children }) => {
  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{ persister }}
    >
      {children}
      {/* Only show devtools in development */}
      {import.meta.env.DEV && (
        <ReactQueryDevtools
          initialIsOpen={false}
          position="bottom"
          buttonPosition="bottom-right"
        />
      )}
    </PersistQueryClientProvider>
  );
};

// Export React Query setup
export { QueryProvider } from './QueryProvider';
export { queryClient } from './queryClient';
export { queryKeys } from './queryKeys';

// Re-export commonly used React Query hooks for convenience
export {
  useQuery,
  useMutation,
  useQueryClient,
  useIsFetching,
  useIsMutating,
} from '@tanstack/react-query';

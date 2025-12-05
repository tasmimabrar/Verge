/**
 * useInfiniteScroll Hook
 * 
 * Reusable hook for implementing infinite scroll / load more functionality.
 * Detects when user scrolls near bottom of container and triggers callback.
 * 
 * @example
 * const [displayCount, setDisplayCount] = useState(10);
 * const { containerRef } = useInfiniteScroll({
 *   onLoadMore: () => setDisplayCount(prev => prev + 10),
 *   threshold: 100, // Load when 100px from bottom
 *   hasMore: items.length > displayCount,
 *   isLoading: false,
 * });
 * 
 * <div ref={containerRef} style={{ height: '400px', overflow: 'auto' }}>
 *   {items.slice(0, displayCount).map(item => <Item key={item.id} {...item} />)}
 *   {hasMore && <div>Scroll for more...</div>}
 * </div>
 */

import { useEffect, useRef, useCallback } from 'react';

export interface UseInfiniteScrollOptions {
  /** Callback triggered when user scrolls near bottom */
  onLoadMore: () => void;
  /** Distance from bottom (in pixels) to trigger load. Default: 100 */
  threshold?: number;
  /** Whether more items are available to load */
  hasMore: boolean;
  /** Whether currently loading (prevents duplicate requests) */
  isLoading: boolean;
  /** Debounce delay in ms. Default: 200 */
  debounceMs?: number;
}

export interface UseInfiniteScrollReturn {
  /** Ref to attach to scrollable container */
  containerRef: React.RefObject<HTMLDivElement | null>;
}

export const useInfiniteScroll = ({
  onLoadMore,
  threshold = 100,
  hasMore,
  isLoading,
  debounceMs = 200,
}: UseInfiniteScrollOptions): UseInfiniteScrollReturn => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const timeoutRef = useRef<number | null>(null);

  const handleScroll = useCallback(() => {
    if (!containerRef.current || isLoading || !hasMore) return;

    const container = containerRef.current;
    const scrollTop = container.scrollTop;
    const scrollHeight = container.scrollHeight;
    const clientHeight = container.clientHeight;

    // Calculate distance from bottom
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
    
    // Trigger load more when near bottom
    if (distanceFromBottom <= threshold && hasMore && !isLoading) {
      // Clear existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      // Debounce the load more call
      timeoutRef.current = window.setTimeout(() => {
        onLoadMore();
      }, debounceMs);
    }
  }, [onLoadMore, threshold, hasMore, isLoading, debounceMs]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Attach scroll listener
    container.addEventListener('scroll', handleScroll, { passive: true });

    // Cleanup
    return () => {
      container.removeEventListener('scroll', handleScroll);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [handleScroll]);

  return {
    containerRef,
  };
};

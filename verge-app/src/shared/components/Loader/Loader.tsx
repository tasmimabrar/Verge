/**
 * Loader Component
 * 
 * Loading states for different contexts throughout the app.
 * Multiple variants for different use cases.
 * 
 * Features:
 * - Global: Full-screen overlay (app initialization)
 * - Screen: Centered in container (page loading)
 * - Component: Inline spinner (button loading)
 * - Skeleton: Animated placeholders (list loading)
 */

import type { HTMLAttributes } from 'react';
import styles from './Loader.module.css';

export interface LoaderProps extends HTMLAttributes<HTMLDivElement> {
  /** Loading indicator variant */
  variant?: 'global' | 'screen' | 'component' | 'skeleton';
  
  /** Number of skeleton items to show (only for skeleton variant) */
  count?: number;
  
  /** Loading message (optional, for global/screen variants) */
  message?: string;
  
  /** Additional CSS classes */
  className?: string;
}

/**
 * Loader component for loading states
 * 
 * @example
 * // Global full-screen loader
 * <Loader variant="global" message="Loading your workspace..." />
 * 
 * @example
 * // Screen-level loader
 * <Loader variant="screen" />
 * 
 * @example
 * // Inline component loader
 * <Button disabled><Loader variant="component" /> Saving...</Button>
 * 
 * @example
 * // Skeleton loader for lists
 * <Loader variant="skeleton" count={3} />
 */
export const Loader = ({
  variant = 'component',
  count = 3,
  message,
  className = '',
  ...rest
}: LoaderProps) => {
  if (variant === 'skeleton') {
    return (
      <div className={`${styles.skeletonContainer} ${className}`} {...rest}>
        {Array.from({ length: count }).map((_, index) => (
          <div key={index} className={styles.skeletonItem}>
            <div className={styles.skeletonLine} style={{ width: '80%' }} />
            <div className={styles.skeletonLine} style={{ width: '60%' }} />
            <div className={styles.skeletonLine} style={{ width: '40%' }} />
          </div>
        ))}
      </div>
    );
  }
  
  const containerClasses = [
    styles.loaderContainer,
    styles[`${variant}Container`],
    className,
  ].filter(Boolean).join(' ');
  
  const spinnerClasses = [
    styles.spinner,
    styles[variant],
  ].filter(Boolean).join(' ');
  
  return (
    <div className={containerClasses} {...rest}>
      <div className={styles.loaderContent}>
        <div className={spinnerClasses} />
        {message && <p className={styles.message}>{message}</p>}
      </div>
    </div>
  );
};

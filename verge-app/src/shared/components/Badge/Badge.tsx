/**
 * Badge Component
 * 
 * Color-coded labels for priorities, statuses, and categories.
 * Semantic colors using CSS variables for theme support.
 * 
 * Features:
 * - Priority variants (low, medium, high)
 * - Status variants (todo, in-progress, done, postponed)
 * - Size options (small, medium)
 * - Custom variant support
 */

import type { ReactNode, HTMLAttributes } from 'react';
import styles from './Badge.module.css';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  /** Badge variant (determines color) */
  variant?: 
    | 'priority-low' 
    | 'priority-medium' 
    | 'priority-high'
    | 'status-todo'
    | 'status-in-progress'
    | 'status-done'
    | 'status-postponed'
    | 'default'
    | 'info'
    | 'success'
    | 'warning'
    | 'error';
  
  /** Badge size */
  size?: 'sm' | 'md';
  
  /** Badge content (usually text) */
  children: ReactNode;
  
  /** Additional CSS classes */
  className?: string;
}

/**
 * Badge component for labels and tags
 * 
 * @example
 * // Priority badge
 * <Badge variant="priority-high">High Priority</Badge>
 * 
 * @example
 * // Status badge
 * <Badge variant="status-done">Completed</Badge>
 * 
 * @example
 * // Small custom badge
 * <Badge variant="info" size="sm">New</Badge>
 */
export const Badge = ({
  variant = 'default',
  size = 'md',
  children,
  className = '',
  ...rest
}: BadgeProps) => {
  const classes = [
    styles.badge,
    styles[variant],
    styles[size],
    className,
  ].filter(Boolean).join(' ');
  
  return (
    <span className={classes} {...rest}>
      {children}
    </span>
  );
};

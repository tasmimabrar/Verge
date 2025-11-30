/**
 * EmptyState Component
 * 
 * Displays when there's no content to show.
 * Provides context and optional actions to guide users.
 * 
 * Features:
 * - Custom icon support (react-icons)
 * - Title and message
 * - Optional action button
 * - Centered, accessible layout
 */

import type { ReactNode, HTMLAttributes } from 'react';
import styles from './EmptyState.module.css';

export interface EmptyStateProps extends HTMLAttributes<HTMLDivElement> {
  /** Icon to display (ReactNode, typically from react-icons) */
  icon?: ReactNode;
  
  /** Main heading */
  title: string;
  
  /** Descriptive message */
  message: string;
  
  /** Optional action button/component */
  action?: ReactNode;
  
  /** Additional CSS classes */
  className?: string;
}

/**
 * EmptyState component for zero-data scenarios
 * 
 * @example
 * // Basic empty state
 * <EmptyState
 *   icon={<FiInbox size={48} />}
 *   title="No tasks yet"
 *   message="Create your first task to get started"
 * />
 * 
 * @example
 * // Empty state with action
 * <EmptyState
 *   icon={<FiFolder size={48} />}
 *   title="No projects found"
 *   message="Start organizing your work by creating a project"
 *   action={<Button onClick={onCreate}>Create Project</Button>}
 * />
 */
export const EmptyState = ({
  icon,
  title,
  message,
  action,
  className = '',
  ...rest
}: EmptyStateProps) => {
  return (
    <div className={`${styles.emptyState} ${className}`} {...rest}>
      {icon && <div className={styles.icon}>{icon}</div>}
      <h3 className={styles.title}>{title}</h3>
      <p className={styles.message}>{message}</p>
      {action && <div className={styles.action}>{action}</div>}
    </div>
  );
};

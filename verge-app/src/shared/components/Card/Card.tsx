/**
 * Card Component
 * 
 * A versatile container component with multiple visual variants.
 * Used throughout the app for content grouping and visual hierarchy.
 * 
 * Features:
 * - Multiple variants (default, elevated, outline)
 * - Hover animation on interactive cards
 * - Configurable padding
 * - Full CSS variable support for theming
 */

import type { ReactNode, HTMLAttributes } from 'react';
import styles from './Card.module.css';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  /** Visual style variant */
  variant?: 'default' | 'elevated' | 'outline';
  
  /** Internal padding size */
  padding?: 'none' | 'small' | 'medium' | 'large';
  
  /** Card content */
  children: ReactNode;
  
  /** Additional CSS classes */
  className?: string;
  
  /** Click handler (makes card interactive with hover effects) */
  onClick?: () => void;
}

/**
 * Card component for content containers
 * 
 * @example
 * // Basic card
 * <Card>
 *   <h3>Title</h3>
 *   <p>Content</p>
 * </Card>
 * 
 * @example
 * // Interactive elevated card
 * <Card variant="elevated" onClick={() => navigate('/detail')}>
 *   Click me!
 * </Card>
 * 
 * @example
 * // Outline card with custom padding
 * <Card variant="outline" padding="large">
 *   Lots of space!
 * </Card>
 */
export const Card = ({
  variant = 'default',
  padding = 'medium',
  children,
  className = '',
  onClick,
  ...rest
}: CardProps) => {
  const classes = [
    styles.card,
    styles[variant],
    styles[`padding-${padding}`],
    onClick && styles.interactive,
    className,
  ].filter(Boolean).join(' ');
  
  return (
    <div 
      className={classes} 
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      } : undefined}
      {...rest}
    >
      {children}
    </div>
  );
};

import type { FC, ReactNode } from 'react';
import { Card } from '@/shared/components';
import styles from './StatCard.module.css';

export interface StatCardProps {
  /** Label for the stat (e.g., "Today", "In Progress") */
  label: string;
  /** Numeric value to display */
  value: number;
  /** Icon element from react-icons */
  icon: ReactNode;
  /** Optional variant for color theming */
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'error';
  /** Optional click handler */
  onClick?: () => void;
}

/**
 * StatCard Component
 * 
 * Displays a single statistic with an icon, value, and label.
 * Used in the dashboard to show key metrics (tasks due today, completed, etc.).
 * 
 * @example
 * ```tsx
 * <StatCard
 *   label="Today"
 *   value={5}
 *   icon={<FiCalendar />}
 *   variant="primary"
 * />
 * ```
 */
export const StatCard: FC<StatCardProps> = ({
  label,
  value,
  icon,
  variant = 'default',
  onClick,
}) => {
  return (
    <Card
      variant="elevated"
      padding="medium"
      onClick={onClick}
      className={styles.statCard}
    >
      <div className={styles.content}>
        <div className={`${styles.iconWrapper} ${styles[variant]}`}>
          {icon}
        </div>
        <div className={styles.stats}>
          <p className={styles.value}>{value}</p>
          <p className={styles.label}>{label}</p>
        </div>
      </div>
    </Card>
  );
};

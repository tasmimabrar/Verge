import type { FC } from 'react';
import { FiCalendar, FiCheckSquare, FiCheckCircle, FiAlertCircle } from 'react-icons/fi';
import { EmptyState } from '@/shared/components';
import { useAuth } from '@/shared/hooks/useAuth';
import { useDashboardStats } from '@/shared/hooks/useDashboard';
import { StatCard } from '../components/StatCard';
import styles from './StatsWidget.module.css';

export interface StatsWidgetProps {
  config?: Record<string, unknown>;
}

/**
 * StatsWidget - 4 stat cards (Today, In Progress, Completed, Overdue)
 */
export const StatsWidget: FC<StatsWidgetProps> = () => {
  const { user } = useAuth();
  const { data: stats, isLoading, error } = useDashboardStats(user?.uid || '');

  if (isLoading) {
    return (
      <div className={styles.statsGrid}>
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className={styles.skeletonCard}>
            <div className={styles.skeletonIcon} />
            <div className={styles.skeletonContent}>
              <div className={styles.skeletonValue} />
              <div className={styles.skeletonLabel} />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <EmptyState
        title="Failed to load stats"
        message="We couldn't fetch your dashboard statistics."
        icon={<FiAlertCircle />}
      />
    );
  }

  if (!stats) {
    return null;
  }

  return (
    <div className={styles.statsGrid}>
      <StatCard
        label="Today"
        value={stats.dueToday}
        icon={<FiCalendar />}
        variant="primary"
      />
      <StatCard
        label="In Progress"
        value={stats.inProgress}
        icon={<FiCheckSquare />}
        variant="warning"
      />
      <StatCard
        label="Completed"
        value={stats.completedThisWeek}
        icon={<FiCheckCircle />}
        variant="success"
      />
      <StatCard
        label="Overdue"
        value={stats.overdue}
        icon={<FiAlertCircle />}
        variant="error"
      />
    </div>
  );
};

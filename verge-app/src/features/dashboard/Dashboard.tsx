import type { FC } from 'react';
import { FiCalendar, FiCheckSquare, FiCheckCircle, FiAlertCircle } from 'react-icons/fi';
import { AppLayout, EmptyState } from '@/shared/components';
import { useAuth } from '@/shared/hooks/useAuth';
import { useDashboardStats } from '@/shared/hooks/useDashboard';
import { StatCard } from './components/StatCard';
import { TodaysPriorities } from './components/TodaysPriorities';
import { UpcomingDeadlines } from './components/UpcomingDeadlines';
import { OverdueTasks } from './components/OverdueTasks';
import styles from './Dashboard.module.css';

export const Dashboard: FC = () => {
  const { user } = useAuth();
  const { data: stats, isLoading, error } = useDashboardStats(user?.uid || '');
  
  // Show loading if user is not loaded yet
  if (!user) {
    return (
      <AppLayout>
        <div className={styles.container}>
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
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className={styles.container}>
        {/* Dashboard Header */}
        <div className={styles.dashboardHeader}>
          <div className={styles.headerLeft}>
            <h1 className={styles.title}>Dashboard</h1>
            <p className={styles.subtitle}>
              Welcome back{user?.displayName ? `, ${user.displayName}` : ''}! Here's your overview.
            </p>
          </div>
        </div>

        {/* Stats Grid - 4 cards side-by-side */}
        {isLoading ? (
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
        ) : error ? (
          <EmptyState
            title="Failed to load stats"
            message="We couldn't fetch your dashboard statistics. Please try again."
            icon={<FiAlertCircle />}
          />
        ) : stats ? (
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
        ) : null}

        {/* Main Content - 3 Column Task Widgets */}
        <div className={styles.mainContent}>
          <TodaysPriorities />
          <UpcomingDeadlines />
          <OverdueTasks />
        </div>
      </div>
    </AppLayout>
  );
};

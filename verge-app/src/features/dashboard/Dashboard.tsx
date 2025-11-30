import type { FC } from 'react';
import { FiCalendar, FiCheckSquare, FiCheckCircle, FiAlertCircle } from 'react-icons/fi';
import { AppLayout, Loader, EmptyState } from '@/shared/components';
import { useAuth } from '@/shared/hooks/useAuth';
import { useDashboardStats } from '@/shared/hooks/useDashboard';
import { StatCard } from './components/StatCard';
import { TodaysPriorities } from './components/TodaysPriorities';
import { UpcomingDeadlines } from './components/UpcomingDeadlines';
import { QuickActions } from './components/QuickActions';
import styles from './Dashboard.module.css';

export const Dashboard: FC = () => {
  const { user } = useAuth();
  const { data: stats, isLoading, error } = useDashboardStats(user?.uid || '');

  return (
    <AppLayout>
      <div className={styles.container}>
        {/* Dashboard Header */}
        <div className={styles.dashboardHeader}>
          <div>
            <h1 className={styles.title}>Dashboard</h1>
            <p className={styles.subtitle}>
              Welcome back{user?.displayName ? `, ${user.displayName}` : ''}! Here's your overview.
            </p>
          </div>
        </div>

        {/* Stats Grid */}
        {isLoading ? (
          <div className={styles.statsGrid}>
            <Loader variant="skeleton" count={4} />
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

        {/* Main Content Area - Task Widgets + Quick Actions */}
        <div className={styles.mainContent}>
          {/* Task Widgets */}
          <div className={styles.widgetsGrid}>
            <TodaysPriorities />
            <UpcomingDeadlines />
          </div>

          {/* Quick Actions Sidebar */}
          <aside className={styles.sidebar}>
            <QuickActions />
          </aside>
        </div>
      </div>
    </AppLayout>
  );
};

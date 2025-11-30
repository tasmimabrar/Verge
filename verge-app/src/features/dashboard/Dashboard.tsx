import type { FC } from 'react';
import { AppLayout } from '@/shared/components';
import styles from './Dashboard.module.css';

export const Dashboard: FC = () => {
  return (
    <AppLayout>
      <div className={styles.container}>
        {/* Dashboard Header */}
        <div className={styles.dashboardHeader}>
          <div>
            <h1 className={styles.title}>Dashboard</h1>
            <p className={styles.subtitle}>Welcome back! Here's your overview.</p>
          </div>
        </div>

        {/* Stats Grid - Placeholder for now */}
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <h3 className={styles.statLabel}>Total Tasks</h3>
            <p className={styles.statValue}>0</p>
          </div>
          <div className={styles.statCard}>
            <h3 className={styles.statLabel}>In Progress</h3>
            <p className={styles.statValue}>0</p>
          </div>
          <div className={styles.statCard}>
            <h3 className={styles.statLabel}>Completed</h3>
            <p className={styles.statValue}>0</p>
          </div>
          <div className={styles.statCard}>
            <h3 className={styles.statLabel}>Due Today</h3>
            <p className={styles.statValue}>0</p>
          </div>
        </div>

        {/* Main Content Area - Placeholder */}
        <div className={styles.contentArea}>
          <div className={styles.placeholderCard}>
            <h2 className={styles.placeholderTitle}>Your workspace is ready</h2>
            <p className={styles.placeholderText}>
              Start adding tasks and projects to see them here.
            </p>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

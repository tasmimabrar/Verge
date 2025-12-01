import type { FC } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiAlertCircle, FiArrowRight } from 'react-icons/fi';
import { Card, EmptyState, Loader, TaskCard } from '@/shared/components';
import { useAuth } from '@/shared/hooks/useAuth';
import { useOverdueTasks } from '@/shared/hooks/useTasks';
import styles from './OverdueTasks.module.css';

export const OverdueTasks: FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: tasks, isLoading, error } = useOverdueTasks(user?.uid || '');

  const handleViewAll = () => {
    navigate('/tasks?status=overdue');
  };

  return (
    <Card padding="medium">
      <div className={styles.container}>
        {/* Header */}
        <div className={styles.header}>
          <h2 className={styles.title}>Overdue Tasks</h2>
          {tasks && tasks.length > 0 && (
            <button className={styles.viewAllButton} onClick={handleViewAll}>
              View All
              <FiArrowRight />
            </button>
          )}
        </div>

        {/* Content */}
        <div className={styles.content}>
          {isLoading ? (
            <Loader variant="component" />
          ) : error ? (
            <EmptyState
              title="Failed to load"
              message="Could not fetch overdue tasks"
              icon={<FiAlertCircle />}
            />
          ) : tasks && tasks.length > 0 ? (
            <div className={styles.taskList}>
              {tasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  variant="preview"
                  onClick={() => navigate(`/tasks/${task.id}`)}
                />
              ))}
            </div>
          ) : (
            <EmptyState
              title="No overdue tasks"
              message="Great! You're all caught up."
              icon={<FiAlertCircle />}
            />
          )}
        </div>
      </div>
    </Card>
  );
};

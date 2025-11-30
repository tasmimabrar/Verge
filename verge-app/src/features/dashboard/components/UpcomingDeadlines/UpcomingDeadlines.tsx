import type { FC } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiArrowRight, FiCalendar } from 'react-icons/fi';
import { format, isToday, isTomorrow, isThisWeek } from 'date-fns';
import { Card, Loader, EmptyState, TaskCard } from '@/shared/components';
import { useAuth } from '@/shared/hooks/useAuth';
import { useUpcomingTasks } from '@/shared/hooks/useTasks';
import styles from './UpcomingDeadlines.module.css';

/**
 * UpcomingDeadlines Component
 * 
 * Dashboard widget showing tasks due in the next 7 days.
 * Groups tasks by date with relative labels (Tomorrow, Monday, etc.).
 * 
 * Features:
 * - React Query hook for data fetching
 * - Date grouping with date-fns
 * - TaskCard preview variant
 * - Max 7 tasks displayed
 * - "View All" link to calendar/tasks page
 */
export const UpcomingDeadlines: FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: tasks, isLoading, error } = useUpcomingTasks(user?.uid || '', 7);

  /**
   * Format date label for grouping
   * Returns: "Tomorrow", "Monday", "Tuesday", or formatted date
   */
  const getDateLabel = (date: Date): string => {
    if (isToday(date)) return 'Today';
    if (isTomorrow(date)) return 'Tomorrow';
    if (isThisWeek(date, { weekStartsOn: 0 })) return format(date, 'EEEE'); // "Monday", "Tuesday", etc.
    return format(date, 'MMM dd'); // "Nov 30"
  };

  // Get first 7 tasks total
  const limitedTasks = tasks?.slice(0, 7);

  const handleTaskClick = (taskId: string) => {
    navigate(`/tasks/${taskId}`);
  };

  const handleViewAll = () => {
    navigate('/tasks');
  };

  return (
    <Card variant="elevated" padding="large" className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <h2 className={styles.title}>Upcoming Deadlines</h2>
        <button
          type="button"
          className={styles.viewAllButton}
          onClick={handleViewAll}
        >
          View All <FiArrowRight />
        </button>
      </div>

      {/* Content */}
      <div className={styles.content}>
        {isLoading ? (
          <Loader variant="skeleton" count={3} />
        ) : error ? (
          <EmptyState
            title="Failed to load tasks"
            message="We couldn't fetch your upcoming tasks. Please try again."
            icon={<FiCalendar />}
          />
        ) : !limitedTasks || limitedTasks.length === 0 ? (
          <EmptyState
            title="All caught up!"
            message="No upcoming deadlines in the next week."
            icon={<FiCalendar />}
          />
        ) : (
          <div className={styles.taskList}>
            {limitedTasks.map((task) => {
              const dateLabel = getDateLabel(task.dueDate.toDate());
              
              return (
                <div key={task.id} className={styles.taskGroup}>
                  <div className={styles.dateLabel}>{dateLabel}</div>
                  <TaskCard
                    task={task}
                    variant="preview"
                    onClick={() => handleTaskClick(task.id)}
                  />
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Card>
  );
};

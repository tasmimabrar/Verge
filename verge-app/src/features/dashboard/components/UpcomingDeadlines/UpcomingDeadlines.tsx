import type { FC } from 'react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Timestamp } from 'firebase/firestore';
import { FiArrowRight, FiCalendar } from 'react-icons/fi';
import { format, isToday, isTomorrow, isThisWeek } from 'date-fns';
import type { Task } from '@/shared/types';
import { toDate } from '@/shared/utils/dateHelpers';
import { Card, Loader, EmptyState, TaskCard } from '@/shared/components';
import { useAuth } from '@/shared/hooks/useAuth';
import { useUpcomingTasks, useUpdateTask } from '@/shared/hooks/useTasks';
import { useProjects } from '@/shared/hooks/useProjects';
import { useInfiniteScroll } from '@/shared/hooks/useInfiniteScroll';
import type { TaskStatus } from '@/shared/components/TaskStatusDropdown';
import type { TaskPriority } from '@/shared/components/PriorityDropdown';
import styles from './UpcomingDeadlines.module.css';

/**
 * UpcomingDeadlines Component
 * 
 * Dashboard widget showing all upcoming tasks with infinite scroll.
 * Groups tasks by date with relative labels (Tomorrow, Monday, etc.).
 * 
 * Features:
 * - React Query hook for data fetching
 * - Date grouping with date-fns
 * - TaskCard preview variant
 * - Infinite scroll (loads 10 at a time)
 * - "View All" link to tasks page
 */
export const UpcomingDeadlines: FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [displayCount, setDisplayCount] = useState(10); // Start with 10 tasks
  
  // Fetch ALL upcoming tasks (no day limit)
  const { data: tasks, isLoading, error } = useUpcomingTasks(user?.uid || '', 365); // Next year
  const { data: projects } = useProjects(user?.uid || '');
  const updateTask = useUpdateTask();
  
  /**
   * Get project name by ID
   */
  const getProjectName = (projectId: string): string | undefined => {
    return projects?.find(p => p.id === projectId)?.name;
  };

  const handleStatusChange = async (taskId: string, newStatus: TaskStatus) => {
    try {
      await updateTask.mutateAsync({
        id: taskId,
        status: newStatus,
        userId: user!.uid,
      });
      toast.success(`Task status changed to ${newStatus.replace('_', ' ')}`);
    } catch (err) {
      console.error('Failed to update status:', err);
      toast.error('Failed to update task status');
    }
  };

  const handlePriorityChange = async (taskId: string, newPriority: TaskPriority) => {
    try {
      await updateTask.mutateAsync({
        id: taskId,
        priority: newPriority,
        userId: user!.uid,
      });
      toast.success(`Task priority changed to ${newPriority}`);
    } catch (err) {
      console.error('Failed to update priority:', err);
      toast.error('Failed to update task priority');
    }
  };

  const handleDueDateChange = async (taskId: string, newDueDate: Date) => {
    try {
      await updateTask.mutateAsync({
        id: taskId,
        dueDate: Timestamp.fromDate(newDueDate),
        userId: user!.uid,
      });
      toast.success('Due date updated!');
    } catch (err) {
      console.error('Failed to update due date:', err);
      toast.error('Failed to update due date');
    }
  };

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

  // Get limited tasks for display (pagination)
  const limitedTasks = tasks?.slice(0, displayCount);
  const hasMore = tasks ? tasks.length > displayCount : false;

  // Infinite scroll hook
  const { containerRef } = useInfiniteScroll({
    onLoadMore: () => setDisplayCount(prev => prev + 10),
    threshold: 100,
    hasMore,
    isLoading: false,
  });

  /**
   * Group tasks by date
   * Returns a Map of date labels to arrays of tasks
   */
  const groupTasksByDate = (): Map<string, Task[]> => {
    const grouped = new Map<string, Task[]>();
    
    if (!limitedTasks) return grouped;
    
    limitedTasks.forEach((task) => {
      // Handle both Timestamp and Date objects using helper
      const taskDate = toDate(task.dueDate);
      const dateLabel = getDateLabel(taskDate);
      const existing = grouped.get(dateLabel) || [];
      grouped.set(dateLabel, [...existing, task]);
    });
    
    return grouped;
  };

  const groupedTasks = groupTasksByDate();

  const handleTaskClick = (taskId: string) => {
    navigate(`/tasks/${taskId}`);
  };

  const handleViewAll = () => {
    navigate('/tasks?filter=week');
  };

  return (
    <Card variant="elevated" padding="medium" className={styles.container}>
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
      <div ref={containerRef} className={styles.content}>
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
            message="No upcoming deadlines."
            icon={<FiCalendar />}
          />
        ) : (
          <>
            <div className={styles.taskList}>
              {Array.from(groupedTasks.entries()).map(([dateLabel, tasksForDate]) => (
                <div key={dateLabel} className={styles.taskGroup}>
                  <div className={styles.dateLabel}>{dateLabel}</div>
                  <div className={styles.taskGroupList}>
                    {tasksForDate.map((task) => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        variant="preview"
                        projectName={getProjectName(task.projectId)}
                        onClick={() => handleTaskClick(task.id)}
                        onStatusChange={handleStatusChange}
                        onPriorityChange={handlePriorityChange}
                        onDueDateChange={handleDueDateChange}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
            {/* Load More Indicator */}
            {hasMore && (
              <div className={styles.loadMoreIndicator}>
                <span className={styles.loadMoreText}>
                  Scroll down to load more ({tasks!.length - displayCount} remaining)
                </span>
              </div>
            )}
          </>
        )}
      </div>
    </Card>
  );
};

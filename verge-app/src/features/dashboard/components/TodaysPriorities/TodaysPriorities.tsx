import type { FC } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Timestamp } from 'firebase/firestore';
import { FiArrowRight, FiCheckCircle } from 'react-icons/fi';
import { Card, Loader, EmptyState, TaskCard } from '@/shared/components';
import { useAuth } from '@/shared/hooks/useAuth';
import { useTodayTasks, useUpdateTask } from '@/shared/hooks/useTasks';
import { useProjects } from '@/shared/hooks/useProjects';
import type { TaskStatus } from '@/shared/components/TaskStatusDropdown';
import type { TaskPriority } from '@/shared/components/PriorityDropdown';
import styles from './TodaysPriorities.module.css';

/**
 * TodaysPriorities Component
 * 
 * Dashboard widget showing tasks due today.
 * Displays max 5 tasks sorted by priority (high → low).
 * 
 * Features:
 * - React Query hook for data fetching
 * - TaskCard preview variant for compact display
 * - Loading and empty states
 * - Click to navigate to task detail
 * - "View All" link to full tasks page
 */
export const TodaysPriorities: FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: tasks, isLoading, error } = useTodayTasks(user?.uid || '');
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

  // Sort by priority (high → medium → low)
  const sortedTasks = tasks
    ?.sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    })
    .slice(0, 5); // Max 5 tasks

  const handleTaskClick = (taskId: string) => {
    navigate(`/tasks/${taskId}`);
  };

  const handleViewAll = () => {
    navigate('/tasks');
  };

  return (
    <Card variant="elevated" padding="medium" className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <h2 className={styles.title}>Today's Priorities</h2>
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
            message="We couldn't fetch your tasks. Please try again."
            icon={<FiCheckCircle />}
          />
        ) : !sortedTasks || sortedTasks.length === 0 ? (
          <EmptyState
            title="No tasks due today"
            message="You're all caught up! Enjoy your day."
            icon={<FiCheckCircle />}
          />
        ) : (
          <div className={styles.taskList}>
            {sortedTasks.map((task) => (
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
        )}
      </div>
    </Card>
  );
};

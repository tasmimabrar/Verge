import type { FC } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Timestamp } from 'firebase/firestore';
import { FiAlertCircle, FiArrowRight } from 'react-icons/fi';
import { Card, EmptyState, Loader, TaskCard } from '@/shared/components';
import { useAuth } from '@/shared/hooks/useAuth';
import { useOverdueTasks, useUpdateTask } from '@/shared/hooks/useTasks';
import type { TaskStatus } from '@/shared/components/TaskStatusDropdown';
import type { TaskPriority } from '@/shared/components/PriorityDropdown';
import styles from './OverdueTasks.module.css';

export const OverdueTasks: FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: tasks, isLoading, error } = useOverdueTasks(user?.uid || '');
  const updateTask = useUpdateTask();

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
                  onStatusChange={handleStatusChange}
                  onPriorityChange={handlePriorityChange}
                  onDueDateChange={handleDueDateChange}
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

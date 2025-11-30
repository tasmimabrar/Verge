/**
 * TaskCard Component
 * 
 * Reusable card component for displaying tasks in different contexts.
 * Supports two variants for different use cases.
 * 
 * Features:
 * - Preview variant: Compact for dashboard/lists
 * - Full variant: Detailed for task pages
 * - Priority badges, due date formatting
 * - Click navigation support
 */

import { format, isToday, isTomorrow, isPast } from 'date-fns';
import { FiCalendar, FiFolder, FiCheckSquare } from 'react-icons/fi';
import { Card, Badge } from '@/shared/components';
import type { Task } from '@/shared/types';
import styles from './TaskCard.module.css';

export interface TaskCardProps {
  /** Task data to display */
  task: Task;
  
  /** Display variant */
  variant?: 'preview' | 'full';
  
  /** Click handler (typically for navigation) */
  onClick?: (task: Task) => void;
  
  /** Additional CSS classes */
  className?: string;
}

/**
 * Format due date with relative labels (Today, Tomorrow, or date)
 */
const formatDueDate = (dueDate: Date): { text: string; isOverdue: boolean; isToday: boolean } => {
  const isOverdue = isPast(dueDate) && !isToday(dueDate);
  const isTodayDate = isToday(dueDate);
  
  let text: string;
  if (isTodayDate) {
    text = 'Today';
  } else if (isTomorrow(dueDate)) {
    text = 'Tomorrow';
  } else {
    text = format(dueDate, 'MMM dd, yyyy');
  }
  
  return { text, isOverdue, isToday: isTodayDate };
};

/**
 * Get priority badge variant from task priority
 */
const getPriorityVariant = (priority: string): 'priority-low' | 'priority-medium' | 'priority-high' => {
  if (priority === 'high') return 'priority-high';
  if (priority === 'medium') return 'priority-medium';
  return 'priority-low';
};

/**
 * Get status badge variant from task status
 */
const getStatusVariant = (status: string): 'status-todo' | 'status-in-progress' | 'status-done' | 'status-postponed' => {
  if (status === 'in_progress') return 'status-in-progress';
  if (status === 'done') return 'status-done';
  if (status === 'postponed') return 'status-postponed';
  return 'status-todo';
};

/**
 * TaskCard component for displaying tasks
 * 
 * @example
 * // Preview variant (dashboard)
 * <TaskCard 
 *   task={task} 
 *   variant="preview"
 *   onClick={(task) => navigate(`/tasks/${task.id}`)}
 * />
 * 
 * @example
 * // Full variant (task list page)
 * <TaskCard task={task} variant="full" />
 */
export const TaskCard = ({
  task,
  variant = 'preview',
  onClick,
  className = '',
}: TaskCardProps) => {
  const dueDate = task.dueDate.toDate();
  const { text: dueDateText, isOverdue, isToday: isDueToday } = formatDueDate(dueDate);
  
  const handleClick = () => {
    if (onClick) {
      onClick(task);
    }
  };
  
  if (variant === 'preview') {
    return (
      <Card
        variant="default"
        padding="medium"
        onClick={onClick ? handleClick : undefined}
        className={`${styles.taskCard} ${styles.preview} ${className}`}
      >
        <div className={styles.previewContent}>
          <div className={styles.header}>
            <h4 className={styles.title}>{task.title}</h4>
            <Badge variant={getPriorityVariant(task.priority)} size="sm">
              {task.priority}
            </Badge>
          </div>
          
          <div className={styles.metadata}>
            <span className={`${styles.dueDate} ${isOverdue ? styles.overdue : ''} ${isDueToday ? styles.today : ''}`}>
              <FiCalendar size={14} />
              {dueDateText}
            </span>
            
            {task.subtasks && task.subtasks.length > 0 && (
              <span className={styles.subtaskCount}>
                <FiCheckSquare size={14} />
                {task.subtasks.filter(st => st.completed).length}/{task.subtasks.length}
              </span>
            )}
          </div>
        </div>
      </Card>
    );
  }
  
  // Full variant
  return (
    <Card
      variant="default"
      padding="large"
      onClick={onClick ? handleClick : undefined}
      className={`${styles.taskCard} ${styles.full} ${className}`}
    >
      <div className={styles.fullContent}>
        <div className={styles.header}>
          <div className={styles.titleRow}>
            <h3 className={styles.title}>{task.title}</h3>
            <div className={styles.badges}>
              <Badge variant={getPriorityVariant(task.priority)} size="md">
                {task.priority}
              </Badge>
              <Badge variant={getStatusVariant(task.status)} size="md">
                {task.status.replace('_', ' ')}
              </Badge>
            </div>
          </div>
        </div>
        
        {task.notes && (
          <p className={styles.notes}>{task.notes}</p>
        )}
        
        <div className={styles.details}>
          <div className={styles.detailItem}>
            <FiCalendar size={16} />
            <span className={`${isOverdue ? styles.overdue : ''} ${isDueToday ? styles.today : ''}`}>
              Due: {dueDateText}
            </span>
          </div>
          
          {task.projectId && (
            <div className={styles.detailItem}>
              <FiFolder size={16} />
              <span>Project</span>
            </div>
          )}
          
          {task.estimatedEffort && (
            <div className={styles.detailItem}>
              <span>{task.estimatedEffort} min</span>
            </div>
          )}
        </div>
        
        {task.subtasks && task.subtasks.length > 0 && (
          <div className={styles.subtasks}>
            <h5 className={styles.subtasksTitle}>
              Subtasks ({task.subtasks.filter(st => st.completed).length}/{task.subtasks.length})
            </h5>
            <ul className={styles.subtasksList}>
              {task.subtasks.map((subtask) => (
                <li key={subtask.id} className={styles.subtaskItem}>
                  <input
                    type="checkbox"
                    checked={subtask.completed}
                    readOnly
                    className={styles.checkbox}
                  />
                  <span className={subtask.completed ? styles.completed : ''}>
                    {subtask.title}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
        
        {task.tags && task.tags.length > 0 && (
          <div className={styles.tags}>
            {task.tags.map((tag, index) => (
              <Badge key={index} variant="default" size="sm">
                {tag}
              </Badge>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
};

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
 * - Inline date editing with date picker
 */

import { useState } from 'react';
import { format, isToday, isTomorrow, isPast } from 'date-fns';
import { FiCalendar, FiFolder, FiCheckSquare } from 'react-icons/fi';
import { toDate } from '@/shared/utils/dateHelpers';
import { Card, Badge, TaskStatusDropdown, PriorityDropdown } from '@/shared/components';
import type { Task } from '@/shared/types';
import type { TaskStatus } from '@/shared/components/TaskStatusDropdown';
import type { TaskPriority } from '@/shared/components/PriorityDropdown';
import styles from './TaskCard.module.css';

export interface TaskCardProps {
  /** Task data to display */
  task: Task;
  
  /** Display variant */
  variant?: 'preview' | 'full';
  
  /** Project name (optional - for displaying project association) */
  projectName?: string;
  
  /** Click handler (typically for navigation) */
  onClick?: (task: Task) => void;
  
  /** Status change handler (optional - enables status dropdown) */
  onStatusChange?: (taskId: string, newStatus: TaskStatus) => void;
  
  /** Priority change handler (optional - enables priority dropdown) */
  onPriorityChange?: (taskId: string, newPriority: TaskPriority) => void;
  
  /** Due date change handler (optional - enables date picker) */
  onDueDateChange?: (taskId: string, newDueDate: Date) => void;
  
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
  projectName,
  onClick,
  onStatusChange,
  onPriorityChange,
  onDueDateChange,
  className = '',
}: TaskCardProps) => {
  const [editingDate, setEditingDate] = useState(false);
  
  // Handle both Timestamp and Date objects using helper
  const dueDate = toDate(task.dueDate);
  const { text: dueDateText, isOverdue, isToday: isDueToday } = formatDueDate(dueDate);
  
  const handleClick = () => {
    if (onClick) {
      onClick(task);
    }
  };

  const handleStatusChange = (newStatus: TaskStatus) => {
    if (onStatusChange) {
      // Prevent click propagation when changing status
      onStatusChange(task.id, newStatus);
    }
  };

  const handlePriorityChange = (newPriority: TaskPriority) => {
    if (onPriorityChange) {
      // Prevent click propagation when changing priority
      onPriorityChange(task.id, newPriority);
    }
  };
  
  const handleDueDateClick = (e: React.MouseEvent) => {
    if (onDueDateChange) {
      e.stopPropagation();
      setEditingDate(true);
    }
  };
  
  const handleDueDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (onDueDateChange && e.target.value) {
      const [year, month, day] = e.target.value.split('-').map(Number);
      // Create date at noon local time to avoid timezone issues
      const newDate = new Date(year, month - 1, day, 12, 0, 0);
      onDueDateChange(task.id, newDate);
      setEditingDate(false);
    }
  };
  
  const handleDueDateBlur = () => {
    setEditingDate(false);
  };
  
  if (variant === 'preview') {
    return (
      <Card
        variant="default"
        padding="small"
        onClick={onClick ? handleClick : undefined}
        className={`${styles.taskCard} ${styles.preview} ${className}`}
      >
        <div className={styles.previewContent}>
          <div className={styles.header}>
            <div className={styles.titleRow}>
              {onStatusChange && (
                <TaskStatusDropdown
                  currentStatus={task.status}
                  onStatusChange={handleStatusChange}
                  size="small"
                />
              )}
              <h4 className={styles.title}>{task.title}</h4>
            </div>
            {onPriorityChange ? (
              <PriorityDropdown
                currentPriority={task.priority as TaskPriority}
                onPriorityChange={handlePriorityChange}
                size="small"
              />
            ) : (
              <Badge variant={getPriorityVariant(task.priority)} size="sm">
                {task.priority}
              </Badge>
            )}
          </div>
          
          <div className={styles.metadata}>
            {editingDate && onDueDateChange ? (
              <input
                type="date"
                className={styles.dateInput}
                defaultValue={format(dueDate, 'yyyy-MM-dd')}
                onChange={handleDueDateChange}
                onBlur={handleDueDateBlur}
                onClick={(e) => e.stopPropagation()}
                autoFocus
              />
            ) : (
              <span 
                className={`${styles.dueDate} ${isOverdue ? styles.overdue : ''} ${isDueToday ? styles.today : ''} ${onDueDateChange ? styles.editable : ''}`}
                onClick={handleDueDateClick}
              >
                <FiCalendar size={12} />
                {dueDateText}
              </span>
            )}
            
            {task.subtasks && task.subtasks.length > 0 && (
              <span className={styles.subtaskCount}>
                <FiCheckSquare size={12} />
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
            {onStatusChange && (
              <TaskStatusDropdown
                currentStatus={task.status}
                onStatusChange={handleStatusChange}
                size="medium"
              />
            )}
            <h3 className={styles.title}>{task.title}</h3>
            <div className={styles.badges}>
              {onPriorityChange ? (
                <PriorityDropdown
                  currentPriority={task.priority as TaskPriority}
                  onPriorityChange={handlePriorityChange}
                  size="medium"
                />
              ) : (
                <Badge variant={getPriorityVariant(task.priority)} size="md">
                  {task.priority}
                </Badge>
              )}
            </div>
          </div>
        </div>
        
        <p className={task.notes ? styles.description : styles.noDescription}>
          {task.notes 
            ? (task.notes.length > 30 ? `${task.notes.substring(0, 30)}...` : task.notes)
            : 'No Description'
          }
        </p>
        
        <div className={styles.details}>
          <div className={styles.detailItem}>
            <FiCalendar size={16} />
            {editingDate && onDueDateChange ? (
              <input
                type="date"
                className={styles.dateInput}
                defaultValue={format(dueDate, 'yyyy-MM-dd')}
                onChange={handleDueDateChange}
                onBlur={handleDueDateBlur}
                onClick={(e) => e.stopPropagation()}
                autoFocus
              />
            ) : (
              <span 
                className={`${isOverdue ? styles.overdue : ''} ${isDueToday ? styles.today : ''} ${onDueDateChange ? styles.editable : ''}`}
                onClick={handleDueDateClick}
              >
                Due: {dueDateText}
              </span>
            )}
          </div>
          
          {task.projectId && projectName && (
            <div className={styles.detailItem}>
              <FiFolder size={16} />
              <span>{projectName}</span>
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
        
        {task.tags && task.tags.length > 0 ? (
          <div className={styles.tags}>
            {task.tags.map((tag, index) => (
              <Badge key={index} variant="default" size="sm">
                {tag}
              </Badge>
            ))}
          </div>
        ) : (
          <div className={styles.noTags}>No Tags</div>
        )}
      </div>
    </Card>
  );
};

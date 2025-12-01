import type { FC } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { TaskCard } from '@/shared/components';
import type { Task, TaskStatus } from '@/shared/types';
import { useNavigate } from 'react-router-dom';
import styles from './SortableTaskCard.module.css';

export interface SortableTaskCardProps {
  task: Task;
  onStatusChange: (taskId: string, newStatus: TaskStatus) => void;
}

/**
 * SortableTaskCard Component
 * 
 * Wrapper around TaskCard that makes it draggable/sortable.
 * Used within Kanban columns.
 */
export const SortableTaskCard: FC<SortableTaskCardProps> = ({ task, onStatusChange }) => {
  const navigate = useNavigate();
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    cursor: isDragging ? 'grabbing' : 'grab',
  };

  const handleClick = () => {
    navigate(`/tasks/${task.id}`);
  };

  const handleStatusChange = (taskId: string, newStatus: TaskStatus) => {
    onStatusChange(taskId, newStatus);
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={styles.sortableCard}
      {...attributes}
      {...listeners}
    >
      <TaskCard
        task={task}
        variant="preview"
        onClick={handleClick}
        onStatusChange={handleStatusChange}
      />
    </div>
  );
};

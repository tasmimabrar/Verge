import type { FC } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { SortableTaskCard } from '../SortableTaskCard/SortableTaskCard';
import type { Task, TaskStatus } from '@/shared/types';
import { EmptyState } from '@/shared/components';
import { FiInbox } from 'react-icons/fi';
import styles from './KanbanColumn.module.css';

export interface KanbanColumnProps {
  id: TaskStatus;
  title: string;
  tasks: Task[];
  onStatusChange: (taskId: string, newStatus: TaskStatus) => void;
}

/**
 * KanbanColumn Component
 * 
 * Droppable column for Kanban board.
 * Contains sortable task cards.
 */
export const KanbanColumn: FC<KanbanColumnProps> = ({ id, title, tasks, onStatusChange }) => {
  const { setNodeRef, isOver } = useDroppable({ id });

  const taskIds = tasks.map(t => t.id);

  return (
    <div
      ref={setNodeRef}
      className={`${styles.column} ${isOver ? styles.over : ''}`}
    >
      {/* Column Header */}
      <div className={styles.header}>
        <h2 className={styles.title}>{title}</h2>
        <span className={styles.count}>{tasks.length}</span>
      </div>

      {/* Task List */}
      <div className={styles.taskList}>
        {tasks.length === 0 ? (
          <div className={styles.emptyState}>
            <EmptyState
              title="No tasks"
              message={`No ${title.toLowerCase()} tasks`}
              icon={<FiInbox />}
            />
          </div>
        ) : (
          <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
            {tasks.map(task => (
              <SortableTaskCard
                key={task.id}
                task={task}
                onStatusChange={onStatusChange}
              />
            ))}
          </SortableContext>
        )}
      </div>
    </div>
  );
};

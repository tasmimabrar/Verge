import type { FC, FormEvent } from 'react';
import { useState } from 'react';
import { FiPlus, FiTrash2, FiCheckCircle, FiCircle } from 'react-icons/fi';
import type { Subtask } from '@/shared/types';
import styles from './SubtaskList.module.css';

export interface SubtaskListProps {
  subtasks: Subtask[];
  onToggle: (subtaskId: string) => void;
  onAdd: (title: string) => void;
  onDelete: (subtaskId: string) => void;
  disabled?: boolean;
}

/**
 * SubtaskList Component
 * 
 * Displays and manages subtasks for a task.
 * Features:
 * - Checkbox toggle for completion
 * - Progress bar visualization
 * - Inline add new subtask
 * - Delete subtask
 * - Smooth animations
 */
export const SubtaskList: FC<SubtaskListProps> = ({
  subtasks = [],
  onToggle,
  onAdd,
  onDelete,
  disabled = false,
}) => {
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');

  const completedCount = subtasks.filter(st => st.completed).length;
  const totalCount = subtasks.length;
  const completionPercentage = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  const handleAddSubtask = (e: FormEvent) => {
    e.preventDefault();
    
    if (!newSubtaskTitle.trim()) return;

    onAdd(newSubtaskTitle.trim());
    setNewSubtaskTitle('');
  };

  return (
    <div className={styles.subtaskList}>
      {/* Header with progress */}
      <div className={styles.header}>
        <h3 className={styles.title}>
          Subtasks {totalCount > 0 && `(${completedCount}/${totalCount})`}
        </h3>
        {totalCount > 0 && (
          <div className={styles.progressContainer}>
            <div className={styles.progressBar}>
              <div 
                className={styles.progressFill}
                style={{ width: `${completionPercentage}%` }}
              />
            </div>
            <span className={styles.progressText}>
              {Math.round(completionPercentage)}%
            </span>
          </div>
        )}
      </div>

      {/* Subtask List */}
      {subtasks.length > 0 && (
        <ul className={styles.list}>
          {subtasks.map((subtask) => (
            <li 
              key={subtask.id} 
              className={`${styles.subtaskItem} ${subtask.completed ? styles.completed : ''}`}
            >
              <button
                type="button"
                className={styles.checkbox}
                onClick={() => onToggle(subtask.id)}
                disabled={disabled}
                aria-label={subtask.completed ? 'Mark as incomplete' : 'Mark as complete'}
              >
                {subtask.completed ? (
                  <FiCheckCircle className={styles.checkIcon} />
                ) : (
                  <FiCircle className={styles.uncheckIcon} />
                )}
              </button>
              
              <span className={styles.subtaskTitle}>
                {subtask.title}
              </span>

              <button
                type="button"
                className={styles.deleteButton}
                onClick={() => onDelete(subtask.id)}
                disabled={disabled}
                aria-label="Delete subtask"
              >
                <FiTrash2 />
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* Add New Subtask */}
      <form onSubmit={handleAddSubtask} className={styles.addForm}>
        <div className={styles.inputWrapper}>
          <FiPlus className={styles.plusIcon} />
          <input
            type="text"
            className={styles.input}
            placeholder="Add a subtask..."
            value={newSubtaskTitle}
            onChange={(e) => setNewSubtaskTitle(e.target.value)}
            disabled={disabled}
          />
        </div>
        {newSubtaskTitle.trim() && (
          <button
            type="submit"
            className={styles.addButton}
            disabled={disabled}
          >
            Add
          </button>
        )}
      </form>

      {/* Empty State */}
      {subtasks.length === 0 && (
        <p className={styles.emptyState}>
          No subtasks yet. Break this task down into smaller steps!
        </p>
      )}
    </div>
  );
};

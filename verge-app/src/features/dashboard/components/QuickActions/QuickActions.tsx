import type { FC } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiPlus, FiFolder, FiList, FiCalendar } from 'react-icons/fi';
import styles from './QuickActions.module.css';

export interface QuickActionsProps {
  /** Callback when an action is clicked */
  onActionClick?: () => void;
}

/**
 * QuickActions Component
 * 
 * Dropdown menu with action buttons for common tasks.
 * Provides quick access to key app features.
 */
export const QuickActions: FC<QuickActionsProps> = ({ onActionClick }) => {
  const navigate = useNavigate();

  const handleAction = (path: string) => {
    navigate(path);
    onActionClick?.();
  };

  const actions = [
    {
      id: 'add-task',
      label: 'Add Task',
      icon: <FiPlus />,
      onClick: () => handleAction('/tasks/new'),
      variant: 'primary' as const,
    },
    {
      id: 'create-project',
      label: 'Create Project',
      icon: <FiFolder />,
      onClick: () => handleAction('/projects/new'),
      variant: 'secondary' as const,
    },
    {
      id: 'view-tasks',
      label: 'View All Tasks',
      icon: <FiList />,
      onClick: () => handleAction('/tasks'),
      variant: 'secondary' as const,
    },
    {
      id: 'open-calendar',
      label: 'Open Calendar',
      icon: <FiCalendar />,
      onClick: () => handleAction('/calendar'),
      variant: 'secondary' as const,
    },
  ];

  return (
    <div className={styles.container}>
      <div className={styles.actionsGrid}>
        {actions.map((action) => (
          <button
            key={action.id}
            type="button"
            className={`${styles.actionButton} ${styles[action.variant]}`}
            onClick={action.onClick}
          >
            <div className={styles.iconWrapper}>{action.icon}</div>
            <span className={styles.label}>{action.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

import type { FC } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiPlus, FiFolder, FiList, FiCalendar } from 'react-icons/fi';
import { Card } from '@/shared/components';
import styles from './QuickActions.module.css';

/**
 * QuickActions Component
 * 
 * Dashboard widget with prominent action buttons for common tasks.
 * Provides quick access to key app features.
 * 
 * Actions:
 * - Add Task → /tasks/new (future: modal)
 * - Create Project → /projects/new (future: modal)
 * - View All Tasks → /tasks
 * - Open Calendar → /calendar
 */
export const QuickActions: FC = () => {
  const navigate = useNavigate();

  const actions = [
    {
      id: 'add-task',
      label: 'Add Task',
      icon: <FiPlus />,
      onClick: () => navigate('/tasks/new'),
      variant: 'primary' as const,
    },
    {
      id: 'create-project',
      label: 'Create Project',
      icon: <FiFolder />,
      onClick: () => navigate('/projects/new'),
      variant: 'secondary' as const,
    },
    {
      id: 'view-tasks',
      label: 'View All Tasks',
      icon: <FiList />,
      onClick: () => navigate('/tasks'),
      variant: 'secondary' as const,
    },
    {
      id: 'open-calendar',
      label: 'Open Calendar',
      icon: <FiCalendar />,
      onClick: () => navigate('/calendar'),
      variant: 'secondary' as const,
    },
  ];

  return (
    <Card variant="elevated" padding="large" className={styles.container}>
      <h2 className={styles.title}>Quick Actions</h2>
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
    </Card>
  );
};

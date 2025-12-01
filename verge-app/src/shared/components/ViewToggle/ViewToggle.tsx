/**
 * ViewToggle Component
 * 
 * Global view mode toggle for switching between List, Calendar, and Kanban views.
 * Highlights active view and provides smooth navigation between visualization modes.
 */

import { useNavigate, useLocation } from 'react-router-dom';
import { FiList, FiCalendar, FiColumns } from 'react-icons/fi';
import styles from './ViewToggle.module.css';

export interface ViewToggleProps {
  /** Additional CSS classes */
  className?: string;
}

type ViewMode = 'list' | 'calendar' | 'kanban';

interface ViewOption {
  id: ViewMode;
  label: string;
  icon: typeof FiList;
  path: string;
  tooltip: string;
}

const viewOptions: ViewOption[] = [
  {
    id: 'list',
    label: 'List',
    icon: FiList,
    path: '/tasks',
    tooltip: 'List view - See all tasks in a detailed list',
  },
  {
    id: 'calendar',
    label: 'Calendar',
    icon: FiCalendar,
    path: '/calendar',
    tooltip: 'Calendar view - Visualize tasks by due date',
  },
  {
    id: 'kanban',
    label: 'Kanban',
    icon: FiColumns,
    path: '/kanban',
    tooltip: 'Kanban view - Organize tasks by status',
  },
];

/**
 * Get current active view from pathname
 */
const getActiveView = (pathname: string): ViewMode => {
  if (pathname.startsWith('/calendar')) return 'calendar';
  if (pathname.startsWith('/kanban')) return 'kanban';
  if (pathname.startsWith('/tasks')) return 'list';
  return 'list'; // Default
};

/**
 * ViewToggle component for switching between view modes
 * 
 * @example
 * <ViewToggle />
 */
export const ViewToggle = ({ className = '' }: ViewToggleProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const activeView = getActiveView(location.pathname);

  const handleViewChange = (view: ViewOption) => {
    // Save to localStorage for persistence
    localStorage.setItem('verge_last_view', view.id);
    
    // Navigate to new view
    navigate(view.path);
  };

  return (
    <div className={`${styles.viewToggle} ${className}`} role="tablist" aria-label="View mode">
      {viewOptions.map((view) => {
        const Icon = view.icon;
        const isActive = activeView === view.id;
        
        return (
          <button
            key={view.id}
            className={`${styles.viewButton} ${isActive ? styles.active : ''}`}
            onClick={() => handleViewChange(view)}
            title={view.tooltip}
            role="tab"
            aria-selected={isActive}
            aria-label={view.label}
          >
            <Icon className={styles.icon} />
            <span className={styles.label}>{view.label}</span>
          </button>
        );
      })}
    </div>
  );
};

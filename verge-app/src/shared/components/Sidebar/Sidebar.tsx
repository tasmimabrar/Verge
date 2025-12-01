import { useState, useEffect } from 'react';
import type { FC } from 'react';
import { NavLink, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { 
  FiGrid, 
  FiFolder, 
  FiPieChart,
  FiCheckSquare,
  FiClock,
  FiCalendar,
  FiAlertCircle,
  FiAlertTriangle,
  FiChevronDown,
  FiChevronRight,
  FiPlus,
  FiCircle,
  FiCheckCircle,
  FiPauseCircle
} from 'react-icons/fi';
import { useAuth } from '@/shared/hooks/useAuth';
import { useProjects } from '@/shared/hooks/useProjects';
import { useTasks, useTodayTasks, useOverdueTasks } from '@/shared/hooks/useTasks';
import { Badge } from '@/shared/components/Badge';
import styles from './Sidebar.module.css';
import vergeLogoImg from '@/assets/verge_logo.png';
import { isAfter } from 'date-fns';
import { toDate } from '@/shared/utils/dateHelpers';

interface NavItem {
  to: string;
  icon: typeof FiGrid;
  label: string;
}

const mainNavItems: NavItem[] = [
  { to: '/dashboard', icon: FiGrid, label: 'Dashboard' },
  { to: '/analytics', icon: FiPieChart, label: 'Analytics' },
];

export const Sidebar: FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const userId = user?.uid || '';
  
  // Fetch projects and tasks
  const { data: allProjects = [] } = useProjects(userId);
  const { data: allTasks = [] } = useTasks(userId);
  const { data: todayTasks = [] } = useTodayTasks(userId);
  const { data: overdueTasks = [] } = useOverdueTasks(userId);
  
  // State for expanded projects (load from localStorage on mount)
  const [expandedProjects, setExpandedProjects] = useState<string[]>(() => {
    const saved = localStorage.getItem('verge_sidebar_expanded');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return [];
      }
    }
    return [];
  });
  
  // State for collapsed sections (load from localStorage on mount)
  const [collapsedSections, setCollapsedSections] = useState<string[]>(() => {
    const saved = localStorage.getItem('verge_sidebar_collapsed_sections');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return [];
      }
    }
    return [];
  });
  
  // Helper function to check if a quick filter is active
  const isQuickFilterActive = (filterValue: string | null): boolean => {
    if (location.pathname !== '/tasks') return false;
    const currentFilter = searchParams.get('filter');
    
    // Check if we're on /tasks with no filter (My Tasks)
    if (filterValue === null) {
      return currentFilter === null;
    }
    
    // Check if the specific filter matches
    return currentFilter === filterValue;
  };
  
  // Helper function to get status icon for task
  const getTaskStatusIcon = (status: string) => {
    switch (status) {
      case 'done':
        return FiCheckCircle;
      case 'in_progress':
        return FiClock;
      case 'postponed':
        return FiPauseCircle;
      case 'todo':
      default:
        return FiCircle;
    }
  };
  
  // Helper function to get priority dot class
  const getPriorityDotClass = (priority: string): string => {
    switch (priority) {
      case 'high':
        return styles.priorityHigh;
      case 'medium':
        return styles.priorityMedium;
      case 'low':
        return styles.priorityLow;
      default:
        return '';
    }
  };
  
  // Save expanded state to localStorage
  useEffect(() => {
    localStorage.setItem('verge_sidebar_expanded', JSON.stringify(expandedProjects));
  }, [expandedProjects]);
  
  // Save collapsed sections to localStorage
  useEffect(() => {
    localStorage.setItem('verge_sidebar_collapsed_sections', JSON.stringify(collapsedSections));
  }, [collapsedSections]);
  
  // Toggle project expansion
  const toggleProject = (projectId: string) => {
    setExpandedProjects(prev => 
      prev.includes(projectId) 
        ? prev.filter(id => id !== projectId)
        : [...prev, projectId]
    );
  };
  
  // Toggle section collapse
  const toggleSection = (sectionName: string) => {
    setCollapsedSections(prev =>
      prev.includes(sectionName)
        ? prev.filter(name => name !== sectionName)
        : [...prev, sectionName]
    );
  };
  
  // Check if section is collapsed
  const isSectionCollapsed = (sectionName: string): boolean => {
    return collapsedSections.includes(sectionName);
  };
  
  // Calculate counts for quick filters
  const thisWeekTasks = allTasks.filter(task => {
    if (!task.dueDate) return false;
    const dueDate = toDate(task.dueDate);
    const weekFromNow = new Date();
    weekFromNow.setDate(weekFromNow.getDate() + 7);
    return isAfter(weekFromNow, dueDate);
  });
  
  const highPriorityTasks = allTasks.filter(task => task.priority === 'high');
  
  // Get top 5 projects sorted by last updated
  const recentProjects = [...allProjects]
    .sort((a, b) => {
      const aDate = toDate(a.updatedAt || a.createdAt);
      const bDate = toDate(b.updatedAt || b.createdAt);
      return bDate.getTime() - aDate.getTime();
    })
    .slice(0, 5);

  return (
    <aside className={styles.sidebar}>
      {/* Logo */}
      <div className={styles.logoSection}>
        <img src={vergeLogoImg} alt="Verge" className={styles.logo} />
      </div>

      {/* Navigation */}
      <nav className={styles.nav}>
        {/* Main navigation */}
        {mainNavItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => 
              `${styles.navItem} ${isActive ? styles.active : ''}`
            }
          >
            <item.icon className={styles.navIcon} />
            <span className={styles.navLabel}>{item.label}</span>
          </NavLink>
        ))}
        
        {/* Quick Access Section */}
        <div className={styles.section}>
          <button 
            className={styles.sectionHeader}
            onClick={() => toggleSection('quick-access')}
            aria-expanded={!isSectionCollapsed('quick-access')}
          >
            {isSectionCollapsed('quick-access') ? (
              <FiChevronRight className={styles.sectionChevron} />
            ) : (
              <FiChevronDown className={styles.sectionChevron} />
            )}
            <span>Quick Access</span>
          </button>
          
          {!isSectionCollapsed('quick-access') && (
            <>
              <NavLink
                to="/tasks"
                className={`${styles.navItem} ${styles.quickFilter} ${
                  isQuickFilterActive(null) ? styles.active : ''
                }`}
              >
                <FiCheckSquare className={styles.navIcon} />
                <span className={styles.navLabel}>My Tasks</span>
                {allTasks.length > 0 && (
                  <Badge variant="default" size="sm">{allTasks.length}</Badge>
                )}
              </NavLink>
              
              <NavLink
                to="/tasks?filter=today"
                className={`${styles.navItem} ${styles.quickFilter} ${
                  isQuickFilterActive('today') ? styles.active : ''
                }`}
              >
                <FiClock className={styles.navIcon} />
                <span className={styles.navLabel}>Today</span>
                {todayTasks.length > 0 && (
                  <Badge variant="info" size="sm">{todayTasks.length}</Badge>
                )}
              </NavLink>
              
              <NavLink
                to="/tasks?filter=week"
                className={`${styles.navItem} ${styles.quickFilter} ${
                  isQuickFilterActive('week') ? styles.active : ''
                }`}
              >
                <FiCalendar className={styles.navIcon} />
                <span className={styles.navLabel}>This Week</span>
                {thisWeekTasks.length > 0 && (
                  <Badge variant="default" size="sm">{thisWeekTasks.length}</Badge>
                )}
              </NavLink>
              
              <NavLink
                to="/tasks?filter=high"
                className={`${styles.navItem} ${styles.quickFilter} ${
                  isQuickFilterActive('high') ? styles.active : ''
                }`}
              >
                <FiAlertCircle className={styles.navIcon} />
                <span className={styles.navLabel}>High Priority</span>
                {highPriorityTasks.length > 0 && (
                  <Badge variant="error" size="sm">{highPriorityTasks.length}</Badge>
                )}
              </NavLink>
              
              {overdueTasks.length > 0 && (
                <NavLink
                  to="/tasks?filter=overdue"
                  className={`${styles.navItem} ${styles.quickFilter} ${styles.overdue} ${
                    isQuickFilterActive('overdue') ? styles.active : ''
                  }`}
                >
                  <FiAlertTriangle className={styles.navIcon} />
                  <span className={styles.navLabel}>Overdue</span>
                  <Badge variant="error" size="sm">{overdueTasks.length}</Badge>
                </NavLink>
              )}
            </>
          )}
        </div>
        
        {/* Projects Section */}
        <div className={styles.section}>
          <button
            className={styles.sectionHeader}
            onClick={() => toggleSection('projects')}
            aria-expanded={!isSectionCollapsed('projects')}
          >
            {isSectionCollapsed('projects') ? (
              <FiChevronRight className={styles.sectionChevron} />
            ) : (
              <FiChevronDown className={styles.sectionChevron} />
            )}
            <FiFolder className={styles.sectionIcon} />
            <span>Projects</span>
          </button>
          
          {!isSectionCollapsed('projects') && (
            <>
              {recentProjects.map(project => {
                const isExpanded = expandedProjects.includes(project.id);
                const projectTasks = allTasks.filter(task => task.projectId === project.id);
                const tasksToShow = projectTasks.slice(0, 5);
                
                return (
                  <div key={project.id} className={styles.projectItem}>
                    <button
                      className={styles.projectHeader}
                      onClick={() => toggleProject(project.id)}
                      aria-expanded={isExpanded}
                    >
                      {isExpanded ? (
                        <FiChevronDown className={styles.chevron} />
                      ) : (
                        <FiChevronRight className={styles.chevron} />
                      )}
                      <FiFolder className={styles.projectIcon} />
                      <span className={styles.projectName}>{project.name}</span>
                      {projectTasks.length > 0 && (
                        <Badge variant="default" size="sm">{projectTasks.length}</Badge>
                      )}
                      <button
                        className={styles.addTaskBtn}
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/projects/${project.id}?action=add-task`);
                        }}
                        title="Add task"
                      >
                        <FiPlus />
                      </button>
                    </button>
                    
                    {isExpanded && tasksToShow.length > 0 && (
                      <div className={styles.taskList}>
                        {tasksToShow.map(task => {
                          const StatusIcon = getTaskStatusIcon(task.status);
                          
                          return (
                            <NavLink
                              key={task.id}
                              to={`/tasks/${task.id}`}
                              className={styles.taskItem}
                            >
                              <StatusIcon 
                                className={`${styles.taskIcon} ${
                                  task.status === 'done' ? styles.taskDone : ''
                                } ${
                                  task.status === 'in_progress' ? styles.taskInProgress : ''
                                } ${
                                  task.status === 'postponed' ? styles.taskPostponed : ''
                                }`} 
                              />
                              <span className={styles.taskTitle}>{task.title}</span>
                              {task.priority && (
                                <span className={`${styles.taskPriorityDot} ${getPriorityDotClass(task.priority)}`} />
                              )}
                            </NavLink>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
              
              {recentProjects.length === 0 && (
                <div className={styles.emptyState}>
                  <span>No projects yet</span>
                </div>
              )}
              
              <NavLink
                to="/projects"
                className={styles.seeAllLink}
              >
                View all projects →
              </NavLink>
            </>
          )}
        </div>
      </nav>

      {/* Footer section for future use (version, help, etc.) */}
      <div className={styles.footer}>
        <div className={styles.version}>Vercel Build</div>
      </div>
    </aside>
  );
};

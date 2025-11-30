import type { FC, ChangeEvent } from 'react';
import { useState, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { FiPlus, FiSearch, FiFilter, FiList } from 'react-icons/fi';
import { Button, Card, Loader, EmptyState, TaskCard, AppLayout } from '@/shared/components';
import { useAuth } from '@/shared/hooks/useAuth';
import { useTasks } from '@/shared/hooks/useTasks';
import { useProjects } from '@/shared/hooks/useProjects';
import { toDate } from '@/shared/utils/dateHelpers';
import type { TaskStatus, TaskPriority } from '@/shared/types';
import styles from './TasksList.module.css';

/**
 * TasksList Component
 * 
 * Full-featured tasks list page with filtering, sorting, and search.
 * Uses URL query params for shareable filtered views.
 * 
 * Features:
 * - Filter by status, priority, project
 * - Sort by due date, priority, name, created date
 * - Search by title/notes
 * - Create new task button
 * - Loading and empty states
 */
export const TasksList: FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Get filter/sort values from URL query params  
  const statusFilter = (searchParams.get('status') || 'all') as TaskStatus | 'all';
  const priorityFilter = (searchParams.get('priority') || 'all') as TaskPriority | 'all';
  const projectFilter = searchParams.get('project') || 'all';
  const sortBy = searchParams.get('sort') || 'dueDate';
  const sortOrder = searchParams.get('order') || 'asc';
  
  // Local search state (not in URL to avoid too many updates)
  const [searchQuery, setSearchQuery] = useState('');
  
  // Fetch data
  const { data: allTasks, isLoading: tasksLoading } = useTasks(user?.uid || '');
  const { data: projects, isLoading: projectsLoading } = useProjects(user?.uid || '');
  
  const isLoading = tasksLoading || projectsLoading;
  
  /**
   * Update URL query param for filters/sorting
   */
  const updateFilter = (key: string, value: string) => {
    const newParams = new URLSearchParams(searchParams);
    if (value === 'all') {
      newParams.delete(key);
    } else {
      newParams.set(key, value);
    }
    setSearchParams(newParams);
  };
  
  /**
   * Filter and sort tasks based on current filters
   */
  const filteredAndSortedTasks = useMemo(() => {
    if (!allTasks) return [];
    
    let filtered = [...allTasks];
    
    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(task => task.status === statusFilter);
    }
    
    // Filter by priority
    if (priorityFilter !== 'all') {
      filtered = filtered.filter(task => task.priority === priorityFilter);
    }
    
    // Filter by project
    if (projectFilter !== 'all') {
      filtered = filtered.filter(task => task.projectId === projectFilter);
    }
    
    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(task => 
        task.title.toLowerCase().includes(query) ||
        (task.notes && task.notes.toLowerCase().includes(query))
      );
    }
    
    // Sort tasks
    filtered.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'dueDate':
          comparison = toDate(a.dueDate).getTime() - toDate(b.dueDate).getTime();
          break;
        case 'priority': {
          const priorityOrder = { high: 0, medium: 1, low: 2 };
          comparison = priorityOrder[a.priority] - priorityOrder[b.priority];
          break;
        }
        case 'name':
          comparison = a.title.localeCompare(b.title);
          break;
        case 'created':
          comparison = toDate(a.createdAt).getTime() - toDate(b.createdAt).getTime();
          break;
        default:
          break;
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });
    
    return filtered;
  }, [allTasks, statusFilter, priorityFilter, projectFilter, searchQuery, sortBy, sortOrder]);
  
  const handleTaskClick = (taskId: string) => {
    navigate(`/tasks/${taskId}`);
  };
  
  const handleCreateTask = () => {
    navigate('/tasks/new');
  };
  
  const handleSearchChange = (e: ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };
  
  /**
   * Get project name by ID
   */
  const getProjectName = (projectId: string): string | undefined => {
    return projects?.find(p => p.id === projectId)?.name;
  };
  
  return (
    <AppLayout>
      <div className={styles.container}>
        {/* Page Header */}
        <div className={styles.header}>
        <div className={styles.headerLeft}>
          <FiList className={styles.headerIcon} />
          <div>
            <h1 className={styles.title}>All Tasks</h1>
            <p className={styles.subtitle}>
              {filteredAndSortedTasks.length} {filteredAndSortedTasks.length === 1 ? 'task' : 'tasks'}
            </p>
          </div>
        </div>
        <Button
          variant="primary"
          onClick={handleCreateTask}
        >
          <FiPlus /> Create Task
        </Button>
      </div>
      
      {/* Filters and Search Bar */}
      <Card variant="outline" padding="medium" className={styles.filtersCard}>
        <div className={styles.filters}>
          {/* Search Bar */}
          <div className={styles.searchBar}>
            <FiSearch className={styles.searchIcon} />
            <input
              type="text"
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={handleSearchChange}
              className={styles.searchInput}
            />
          </div>
          
          {/* Status Filter */}
          <div className={styles.filterGroup}>
            <label htmlFor="status-filter" className={styles.filterLabel}>
              <FiFilter />
              Status
            </label>
            <select
              id="status-filter"
              value={statusFilter}
              onChange={(e) => updateFilter('status', e.target.value)}
              className={styles.filterSelect}
            >
              <option value="all">All</option>
              <option value="todo">To Do</option>
              <option value="in_progress">In Progress</option>
              <option value="done">Done</option>
              <option value="postponed">Postponed</option>
            </select>
          </div>
          
          {/* Priority Filter */}
          <div className={styles.filterGroup}>
            <label htmlFor="priority-filter" className={styles.filterLabel}>
              Priority
            </label>
            <select
              id="priority-filter"
              value={priorityFilter}
              onChange={(e) => updateFilter('priority', e.target.value)}
              className={styles.filterSelect}
            >
              <option value="all">All</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
          
          {/* Project Filter */}
          <div className={styles.filterGroup}>
            <label htmlFor="project-filter" className={styles.filterLabel}>
              Project
            </label>
            <select
              id="project-filter"
              value={projectFilter}
              onChange={(e) => updateFilter('project', e.target.value)}
              className={styles.filterSelect}
              disabled={!projects || projects.length === 0}
            >
              <option value="all">All Projects</option>
              {projects?.map(project => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </div>
          
          {/* Sort By */}
          <div className={styles.filterGroup}>
            <label htmlFor="sort-filter" className={styles.filterLabel}>
              Sort By
            </label>
            <select
              id="sort-filter"
              value={sortBy}
              onChange={(e) => updateFilter('sort', e.target.value)}
              className={styles.filterSelect}
            >
              <option value="dueDate">Due Date</option>
              <option value="priority">Priority</option>
              <option value="name">Name</option>
              <option value="created">Created Date</option>
            </select>
          </div>
          
          {/* Sort Order */}
          <div className={styles.filterGroup}>
            <label htmlFor="order-filter" className={styles.filterLabel}>
              Order
            </label>
            <select
              id="order-filter"
              value={sortOrder}
              onChange={(e) => updateFilter('order', e.target.value)}
              className={styles.filterSelect}
            >
              <option value="asc">Ascending</option>
              <option value="desc">Descending</option>
            </select>
          </div>
        </div>
      </Card>
      
      {/* Tasks List */}
      <div className={styles.content}>
        {isLoading ? (
          <Loader variant="skeleton" count={5} />
        ) : filteredAndSortedTasks.length === 0 ? (
          <EmptyState
            title={searchQuery || statusFilter !== 'all' || priorityFilter !== 'all' || projectFilter !== 'all' 
              ? "No tasks match your filters" 
              : "No tasks yet"
            }
            message={searchQuery || statusFilter !== 'all' || priorityFilter !== 'all' || projectFilter !== 'all'
              ? "Try adjusting your filters or search query."
              : "Create your first task to get started!"
            }
            icon={<FiList />}
            action={
              <Button variant="primary" onClick={handleCreateTask}>
                <FiPlus /> Create Task
              </Button>
            }
          />
        ) : (
          <div className={styles.tasksList}>
            {filteredAndSortedTasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                variant="full"
                projectName={getProjectName(task.projectId)}
                onClick={() => handleTaskClick(task.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
    </AppLayout>
  );
};

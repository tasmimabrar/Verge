import type { FC, ChangeEvent } from 'react';
import { useState, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { FiPlus, FiSearch, FiFilter, FiFolder } from 'react-icons/fi';
import { Button, Card, Loader, EmptyState, ProjectCard, AppLayout } from '@/shared/components';
import { useAuth } from '@/shared/hooks/useAuth';
import { useProjects } from '@/shared/hooks/useProjects';
import { useTasks } from '@/shared/hooks/useTasks';
import { toDate } from '@/shared/utils/dateHelpers';
import type { ProjectStatus } from '@/shared/types';
import styles from './ProjectsList.module.css';

/**
 * ProjectsList Component
 * 
 * Full-featured projects list page with filtering, sorting, and search.
 * Uses URL query params for shareable filtered views.
 * 
 * Features:
 * - Filter by status
 * - Sort by due date, name, created date
 * - Search by name/description
 * - Create new project button
 * - Loading and empty states
 */
export const ProjectsList: FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Get filter/sort values from URL query params
  const statusFilter = (searchParams.get('status') || 'all') as ProjectStatus | 'all';
  const sortBy = searchParams.get('sort') || 'dueDate';
  const sortOrder = searchParams.get('order') || 'asc';
  
  // Local search state
  const [searchQuery, setSearchQuery] = useState('');
  
  // Fetch data
  const { data: allProjects, isLoading } = useProjects(user?.uid || '');
  const { data: allTasks, isLoading: tasksLoading } = useTasks(user?.uid || '');
  
  /**
   * Calculate task stats for a project
   */
  const getProjectTaskStats = (projectId: string) => {
    if (!allTasks) return undefined;
    
    const projectTasks = allTasks.filter(task => task.projectId === projectId);
    const completed = projectTasks.filter(task => task.status === 'done').length;
    
    return {
      total: projectTasks.length,
      completed,
    };
  };
  
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
   * Filter and sort projects based on current filters
   */
  const filteredAndSortedProjects = useMemo(() => {
    if (!allProjects) return [];
    
    let filtered = [...allProjects];
    
    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(project => project.status === statusFilter);
    }
    
    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(project => 
        project.name.toLowerCase().includes(query) ||
        (project.description && project.description.toLowerCase().includes(query))
      );
    }
    
    // Sort projects
    filtered.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'dueDate':
          comparison = toDate(a.dueDate).getTime() - toDate(b.dueDate).getTime();
          break;
        case 'name':
          comparison = a.name.localeCompare(b.name);
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
  }, [allProjects, statusFilter, searchQuery, sortBy, sortOrder]);
  
  const handleProjectClick = (projectId: string) => {
    navigate(`/projects/${projectId}`);
  };
  
  const handleCreateProject = () => {
    navigate('/projects/new');
  };
  
  const handleSearchChange = (e: ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };
  
  return (
    <AppLayout>
      <div className={styles.container}>
        {/* Page Header */}
        <div className={styles.header}>
        <div className={styles.headerLeft}>
          <FiFolder className={styles.headerIcon} />
          <div>
            <h1 className={styles.title}>All Projects</h1>
            <p className={styles.subtitle}>
              {filteredAndSortedProjects.length} {filteredAndSortedProjects.length === 1 ? 'project' : 'projects'}
            </p>
          </div>
        </div>
        <Button
          variant="primary"
          onClick={handleCreateProject}
        >
          <FiPlus /> Create Project
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
              placeholder="Search projects..."
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
              <option value="active">Active</option>
              <option value="on_hold">On Hold</option>
              <option value="completed">Completed</option>
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
      
      {/* Projects List */}
      <div className={styles.content}>
        {isLoading || tasksLoading ? (
          <Loader variant="skeleton" count={4} />
        ) : filteredAndSortedProjects.length === 0 ? (
          <EmptyState
            title={searchQuery || statusFilter !== 'all'
              ? "No projects match your filters"
              : "No projects yet"
            }
            message={searchQuery || statusFilter !== 'all'
              ? "Try adjusting your filters or search query."
              : "Create your first project to get started!"
            }
            icon={<FiFolder />}
            action={
              <Button variant="primary" onClick={handleCreateProject}>
                <FiPlus /> Create Project
              </Button>
            }
          />
        ) : (
          <div className={styles.projectsList}>
            {filteredAndSortedProjects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                variant="full"
                taskStats={getProjectTaskStats(project.id)}
                onClick={() => handleProjectClick(project.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
    </AppLayout>
  );
};

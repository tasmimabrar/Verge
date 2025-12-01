import type { FC } from 'react';
import { useState, useMemo, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FiSearch, 
  FiX, 
  FiFolder, 
  FiCheckSquare,
  FiCircle,
  FiCheckCircle,
  FiClock,
  FiPauseCircle,
  FiAlertCircle
} from 'react-icons/fi';
import { useAuth } from '@/shared/hooks';
import { useTasks, useProjects } from '@/shared/hooks';
import { Badge } from '@/shared/components/Badge';
import { format } from 'date-fns';
import styles from './SearchModal.module.css';
import type { Task, Project } from '@/shared/types';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type SearchResult = {
  type: 'task' | 'project';
  item: Task | Project;
  score: number;
};

export const SearchModal: FC<SearchModalProps> = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();
  const userId = user?.uid || '';

  // Get cached data from React Query (no additional Firebase calls)
  const { data: tasks = [] } = useTasks(userId);
  const { data: projects = [] } = useProjects(userId);

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Search logic - uses regex for flexible matching
  const results = useMemo(() => {
    if (!query.trim()) return [];

    const searchTerm = query.toLowerCase().trim();
    const results: SearchResult[] = [];

    // Create regex pattern for flexible matching (allows partial matches)
    let regexPattern: RegExp;
    try {
      // Escape special regex characters and create pattern
      const escapedQuery = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      regexPattern = new RegExp(escapedQuery, 'i');
    } catch {
      return results;
    }

    // Search tasks
    tasks.forEach(task => {
      let score = 0;
      const titleMatch = task.title.toLowerCase().includes(searchTerm);
      const notesMatch = task.notes?.toLowerCase().includes(searchTerm);
      const statusMatch = task.status.toLowerCase().includes(searchTerm);
      const priorityMatch = task.priority.toLowerCase().includes(searchTerm);
      const regexMatch = regexPattern.test(task.title) || (task.notes && regexPattern.test(task.notes));

      if (titleMatch) score += 10; // Highest priority
      if (notesMatch) score += 5;
      if (statusMatch) score += 7;
      if (priorityMatch) score += 7;
      if (regexMatch) score += 3;

      // Also match common aliases
      if (
        (searchTerm === 'urgent' && task.priority === 'high') ||
        (searchTerm === 'important' && task.priority === 'high') ||
        (searchTerm === 'done' && task.status === 'done') ||
        (searchTerm === 'completed' && task.status === 'done') ||
        (searchTerm === 'active' && task.status === 'in_progress') ||
        (searchTerm === 'working' && task.status === 'in_progress') ||
        (searchTerm === 'pending' && task.status === 'todo') ||
        (searchTerm === 'delayed' && task.status === 'postponed')
      ) {
        score += 8;
      }

      if (score > 0) {
        results.push({ type: 'task', item: task, score });
      }
    });

    // Search projects
    projects.forEach(project => {
      let score = 0;
      const nameMatch = project.name.toLowerCase().includes(searchTerm);
      const descMatch = project.description?.toLowerCase().includes(searchTerm);
      const regexMatch = regexPattern.test(project.name) || (project.description && regexPattern.test(project.description));

      if (nameMatch) score += 10;
      if (descMatch) score += 5;
      if (regexMatch) score += 3;

      if (score > 0) {
        results.push({ type: 'project', item: project, score });
      }
    });

    // Sort by score (highest first) and limit to 15 results
    return results.sort((a, b) => b.score - a.score).slice(0, 15);
  }, [query, tasks, projects]);

  // Categorize results
  const categorizedResults = useMemo(() => {
    const taskResults = results.filter(r => r.type === 'task');
    const projectResults = results.filter(r => r.type === 'project');

    return { tasks: taskResults, projects: projectResults };
  }, [results]);

  const handleResultClick = (result: SearchResult) => {
    if (result.type === 'task') {
      navigate(`/tasks/${result.item.id}`);
    } else {
      navigate(`/projects/${result.item.id}`);
    }
    onClose();
    setQuery('');
  };

  const handleClose = () => {
    onClose();
    setQuery('');
  };

  const getTaskStatusIcon = (status: Task['status']) => {
    switch (status) {
      case 'done':
        return <FiCheckCircle className={styles.statusIconDone} />;
      case 'in_progress':
        return <FiClock className={styles.statusIconInProgress} />;
      case 'postponed':
        return <FiPauseCircle className={styles.statusIconPostponed} />;
      default:
        return <FiCircle className={styles.statusIconTodo} />;
    }
  };

  const getPriorityColor = (priority: Task['priority']) => {
    switch (priority) {
      case 'high':
        return 'var(--color-error)';
      case 'medium':
        return '#ea580c';
      case 'low':
        return 'var(--color-success)';
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div className={styles.backdrop} onClick={handleClose} />

      {/* Modal */}
      <div className={styles.modal}>
        {/* Search Input */}
        <div className={styles.searchHeader}>
          <FiSearch className={styles.searchIcon} />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search tasks, projects by title, status, priority..."
            className={styles.searchInput}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                handleClose();
              } else if (e.key === 'Enter' && results.length > 0) {
                handleResultClick(results[0]);
              }
            }}
          />
          <button className={styles.closeButton} onClick={handleClose}>
            <FiX />
          </button>
        </div>

        {/* Results */}
        <div className={styles.results}>
          {!query.trim() ? (
            <div className={styles.emptyState}>
              <FiSearch className={styles.emptyIcon} />
              <p className={styles.emptyText}>Start typing to search...</p>
              <p className={styles.emptyHint}>
                Try: task title, "high priority", "done", "in progress", project name
              </p>
            </div>
          ) : results.length === 0 ? (
            <div className={styles.emptyState}>
              <FiAlertCircle className={styles.emptyIcon} />
              <p className={styles.emptyText}>No results found</p>
              <p className={styles.emptyHint}>
                Try different keywords or check spelling
              </p>
            </div>
          ) : (
            <>
              {/* Tasks Section */}
              {categorizedResults.tasks.length > 0 && (
                <div className={styles.section}>
                  <div className={styles.sectionHeader}>
                    <FiCheckSquare />
                    <h3>Tasks ({categorizedResults.tasks.length})</h3>
                  </div>
                  <div className={styles.resultsList}>
                    {categorizedResults.tasks.map((result) => {
                      const task = result.item as Task;
                      return (
                        <button
                          key={task.id}
                          className={styles.resultItem}
                          onClick={() => handleResultClick(result)}
                        >
                          <div className={styles.resultIcon}>
                            {getTaskStatusIcon(task.status)}
                          </div>
                          <div className={styles.resultContent}>
                            <div className={styles.resultTitle}>
                              <span>{task.title}</span>
                              <div 
                                className={styles.priorityDot}
                                style={{ backgroundColor: getPriorityColor(task.priority) }}
                              />
                            </div>
                            <div className={styles.resultMeta}>
                              <Badge variant={task.status === 'done' ? 'success' : task.status === 'in_progress' ? 'warning' : 'default'}>
                                {task.status.replace('_', ' ')}
                              </Badge>
                              <Badge variant={task.priority === 'high' ? 'error' : task.priority === 'medium' ? 'warning' : 'success'}>
                                {task.priority} priority
                              </Badge>
                              {task.dueDate && (
                                <span className={styles.dueDate}>
                                  Due: {format(task.dueDate.toDate(), 'MMM dd, yyyy')}
                                </span>
                              )}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Projects Section */}
              {categorizedResults.projects.length > 0 && (
                <div className={styles.section}>
                  <div className={styles.sectionHeader}>
                    <FiFolder />
                    <h3>Projects ({categorizedResults.projects.length})</h3>
                  </div>
                  <div className={styles.resultsList}>
                    {categorizedResults.projects.map((result) => {
                      const project = result.item as Project;
                      const projectTasks = tasks.filter(t => t.projectId === project.id);
                      const completedTasks = projectTasks.filter(t => t.status === 'done').length;
                      
                      return (
                        <button
                          key={project.id}
                          className={styles.resultItem}
                          onClick={() => handleResultClick(result)}
                        >
                          <div className={styles.resultIcon}>
                            <FiFolder className={styles.projectIcon} />
                          </div>
                          <div className={styles.resultContent}>
                            <div className={styles.resultTitle}>
                              <span>{project.name}</span>
                            </div>
                            <div className={styles.resultMeta}>
                              <span className={styles.projectMeta}>
                                {completedTasks}/{projectTasks.length} tasks completed
                              </span>
                              {project.dueDate && (
                                <span className={styles.dueDate}>
                                  Due: {format(project.dueDate.toDate(), 'MMM dd, yyyy')}
                                </span>
                              )}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer hint */}
        {query.trim() && results.length > 0 && (
          <div className={styles.footer}>
            <span className={styles.footerHint}>
              <kbd>↵</kbd> to open • <kbd>Esc</kbd> to close
            </span>
          </div>
        )}
      </div>
    </>
  );
};

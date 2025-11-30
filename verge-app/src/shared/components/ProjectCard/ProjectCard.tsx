/**
 * ProjectCard Component
 * 
 * Reusable card component for displaying projects in different contexts.
 * Supports two variants for different use cases.
 * 
 * Features:
 * - Preview variant: Compact for dashboard
 * - Full variant: Detailed for project pages
 * - Progress tracking, status badges
 * - Click navigation support
 */

import { format, isPast, isToday } from 'date-fns';
import { FiCalendar, FiCheckCircle, FiClock } from 'react-icons/fi';
import { toDate } from '@/shared/utils/dateHelpers';
import { Card, Badge } from '@/shared/components';
import type { Project } from '@/shared/types';
import styles from './ProjectCard.module.css';

export interface ProjectCardProps {
  /** Project data to display */
  project: Project;
  
  /** Display variant */
  variant?: 'preview' | 'full';
  
  /** Task completion info (optional - for progress calculation) */
  taskStats?: {
    total: number;
    completed: number;
  };
  
  /** Click handler (typically for navigation) */
  onClick?: (project: Project) => void;
  
  /** Additional CSS classes */
  className?: string;
}

/**
 * Get status badge variant from project status
 */
const getStatusVariant = (status: string): 'success' | 'info' | 'default' => {
  if (status === 'completed') return 'success';
  if (status === 'active') return 'info';
  return 'default';
};

/**
 * Calculate progress percentage
 */
const calculateProgress = (completed: number, total: number): number => {
  if (total === 0) return 0;
  return Math.round((completed / total) * 100);
};

/**
 * ProjectCard component for displaying projects
 * 
 * @example
 * // Preview variant (dashboard)
 * <ProjectCard 
 *   project={project} 
 *   variant="preview"
 *   taskStats={{ total: 10, completed: 7 }}
 *   onClick={(project) => navigate(`/projects/${project.id}`)}
 * />
 * 
 * @example
 * // Full variant (project list page)
 * <ProjectCard 
 *   project={project} 
 *   variant="full"
 *   taskStats={{ total: 10, completed: 7 }}
 * />
 */
export const ProjectCard = ({
  project,
  variant = 'preview',
  taskStats,
  onClick,
  className = '',
}: ProjectCardProps) => {
  // Handle both Timestamp and Date objects using helper
  const dueDate = toDate(project.dueDate);
  const isOverdue = isPast(dueDate) && !isToday(dueDate) && project.status !== 'completed';
  const progress = taskStats ? calculateProgress(taskStats.completed, taskStats.total) : 0;
  
  const handleClick = () => {
    if (onClick) {
      onClick(project);
    }
  };
  
  if (variant === 'preview') {
    return (
      <Card
        variant="default"
        padding="medium"
        onClick={onClick ? handleClick : undefined}
        className={`${styles.projectCard} ${styles.preview} ${className}`}
      >
        <div className={styles.previewContent}>
          <div className={styles.header}>
            <h4 className={styles.title}>{project.name}</h4>
            <Badge variant={getStatusVariant(project.status)} size="sm">
              {project.status}
            </Badge>
          </div>
          
          {taskStats && (
            <div className={styles.progressSection}>
              <div className={styles.progressBar}>
                <div 
                  className={`${styles.progressFill} ${progress === 100 ? styles.complete : ''} ${isOverdue ? styles.overdue : ''}`}
                  style={{ width: `${progress}%` }}
                />
              </div>
              <span className={styles.progressText}>
                {taskStats.completed}/{taskStats.total} tasks
              </span>
            </div>
          )}
          
          <div className={styles.metadata}>
            <span className={`${styles.dueDate} ${isOverdue ? styles.overdue : ''}`}>
              <FiCalendar size={14} />
              {format(dueDate, 'MMM dd, yyyy')}
            </span>
          </div>
        </div>
      </Card>
    );
  }
  
  // Full variant
  return (
    <Card
      variant="default"
      padding="large"
      onClick={onClick ? handleClick : undefined}
      className={`${styles.projectCard} ${styles.full} ${className}`}
    >
      <div className={styles.fullContent}>
        <div className={styles.header}>
          <div className={styles.titleRow}>
            <h3 className={styles.title}>{project.name}</h3>
            <Badge variant={getStatusVariant(project.status)} size="md">
              {project.status}
            </Badge>
          </div>
          {project.description && (
            <p className={styles.description}>{project.description}</p>
          )}
        </div>
        
        {taskStats && (
          <div className={styles.statsSection}>
            <div className={styles.statItem}>
              <FiCheckCircle size={20} />
              <div className={styles.statContent}>
                <span className={styles.statValue}>{taskStats.completed}</span>
                <span className={styles.statLabel}>Completed</span>
              </div>
            </div>
            
            <div className={styles.statItem}>
              <FiClock size={20} />
              <div className={styles.statContent}>
                <span className={styles.statValue}>{taskStats.total - taskStats.completed}</span>
                <span className={styles.statLabel}>Remaining</span>
              </div>
            </div>
            
            <div className={styles.statItem}>
              <div className={styles.statContent}>
                <span className={styles.statValue}>{progress}%</span>
                <span className={styles.statLabel}>Progress</span>
              </div>
            </div>
          </div>
        )}
        
        {taskStats && (
          <div className={styles.progressSection}>
            <div className={styles.progressBar}>
              <div 
                className={`${styles.progressFill} ${progress === 100 ? styles.complete : ''} ${isOverdue ? styles.overdue : ''}`}
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}
        
        <div className={styles.details}>
          <div className={styles.detailItem}>
            <FiCalendar size={16} />
            <span className={isOverdue ? styles.overdue : ''}>
              Due: {format(dueDate, 'MMM dd, yyyy')}
            </span>
          </div>
          
          {project.color && (
            <div className={styles.detailItem}>
              <div 
                className={styles.colorIndicator}
                style={{ backgroundColor: project.color }}
              />
              <span>Custom Color</span>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};

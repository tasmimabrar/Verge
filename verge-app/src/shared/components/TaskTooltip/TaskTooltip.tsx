/**
 * TaskTooltip Component
 * 
 * Shows a preview of task details when hovering over calendar task dots.
 * Uses portal rendering to avoid z-index conflicts.
 * 
 * Usage:
 * <TaskTooltip task={task} anchorRect={dotElement.getBoundingClientRect()} />
 */

import type { ReactNode } from 'react';
import { useMemo } from 'react';
import { createPortal } from 'react-dom';
import type { Task } from '@/shared/types';
import styles from './TaskTooltip.module.css';

export interface TaskTooltipProps {
  /** Task to display */
  task: Task;
  
  /** Anchor element bounds for positioning */
  anchorRect: DOMRect | null;
  
  /** Additional content to display */
  children?: ReactNode;
  
  /** Show tooltip */
  show: boolean;
  
  /** Optional project name */
  projectName?: string;
}

export const TaskTooltip = ({ task, anchorRect, show, projectName, children }: TaskTooltipProps) => {
  // Calculate position based on anchor rect
  const position = useMemo(() => {
    if (!anchorRect) return { top: 0, left: 0 };

    const padding = 8;
    const tooltipWidth = 280; // Approximate width
    const tooltipHeight = 150; // Approximate height

    // Calculate position (prefer right, fall back to left if overflow)
    let left = anchorRect.right + padding;
    let top = anchorRect.top + (anchorRect.height / 2) - (tooltipHeight / 2);

    // Check right overflow
    if (left + tooltipWidth > window.innerWidth - padding) {
      // Position on left instead
      left = anchorRect.left - tooltipWidth - padding;
    }

    // Check left overflow (if both sides overflow, prefer right)
    if (left < padding) {
      left = anchorRect.right + padding;
    }

    // Check top/bottom overflow
    if (top < padding) {
      top = padding;
    } else if (top + tooltipHeight > window.innerHeight - padding) {
      top = window.innerHeight - tooltipHeight - padding;
    }

    return { top, left };
  }, [anchorRect]);

  if (!show || !anchorRect) return null;

  return createPortal(
    <div
      className={styles.tooltip}
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
      }}
    >
      <div className={styles.header}>
        <span className={`${styles.priority} ${styles[task.priority]}`}>
          {task.priority}
        </span>
        <span className={`${styles.status} ${styles[task.status.replace('_', '')]}`}>
          {task.status.replace('_', ' ')}
        </span>
      </div>
      
      <h4 className={styles.title}>{task.title}</h4>
      
      {task.notes && (
        <p className={styles.notes}>{task.notes}</p>
      )}
      
      {projectName && (
        <div className={styles.project}>
          <span className={styles.projectLabel}>Project:</span>
          <span className={styles.projectName}>{projectName}</span>
        </div>
      )}
      
      {children}
    </div>,
    document.body
  );
};

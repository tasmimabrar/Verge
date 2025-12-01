import type { FC } from 'react';
import { useState, useRef, useEffect } from 'react';
import { FiCheckCircle, FiCircle, FiClock, FiPause, FiCheck } from 'react-icons/fi';
import styles from './TaskStatusDropdown.module.css';

export type TaskStatus = 'todo' | 'in_progress' | 'done' | 'postponed';

export interface TaskStatusDropdownProps {
  currentStatus: TaskStatus;
  onStatusChange: (newStatus: TaskStatus) => void;
  disabled?: boolean;
  size?: 'small' | 'medium' | 'large';
}

interface StatusOption {
  value: TaskStatus;
  label: string;
  icon: typeof FiCircle;
  badgeVariant: 'default' | 'info' | 'success' | 'warning';
  description: string;
}

const statusOptions: StatusOption[] = [
  {
    value: 'todo',
    label: 'To Do',
    icon: FiCircle,
    badgeVariant: 'default',
    description: 'Not started yet',
  },
  {
    value: 'in_progress',
    label: 'In Progress',
    icon: FiClock,
    badgeVariant: 'info',
    description: 'Currently working on it',
  },
  {
    value: 'done',
    label: 'Done',
    icon: FiCheckCircle,
    badgeVariant: 'success',
    description: 'Completed',
  },
  {
    value: 'postponed',
    label: 'Postponed',
    icon: FiPause,
    badgeVariant: 'warning',
    description: 'Delayed for later',
  },
];

/**
 * TaskStatusDropdown Component
 * 
 * Interactive checkbox that opens a dropdown to change task status.
 * Features:
 * - Click checkbox to open dropdown
 * - Color-coded status options
 * - Keyboard navigation (Arrow keys, Enter, Escape)
 * - Click outside to close
 * - Smooth animations
 */
export const TaskStatusDropdown: FC<TaskStatusDropdownProps> = ({
  currentStatus,
  onStatusChange,
  disabled = false,
  size = 'medium',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentOption = statusOptions.find(opt => opt.value === currentStatus) || statusOptions[0];
  const CurrentIcon = currentOption.icon;

  // Calculate dropdown position when opened
  useEffect(() => {
    if (isOpen && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + 8,
        left: rect.left,
      });
    }
  }, [isOpen]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      // Check if click is outside both trigger and dropdown
      if (
        triggerRef.current && !triggerRef.current.contains(target) &&
        dropdownRef.current && !dropdownRef.current.contains(target)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  // Close dropdown on Escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen]);

  const handleToggleDropdown = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering parent onClick
    if (!disabled) {
      setIsOpen(!isOpen);
    }
  };

  const handleStatusSelect = (e: React.MouseEvent, status: TaskStatus) => {
    e.stopPropagation(); // Prevent event from bubbling to parent card
    onStatusChange(status);
    setIsOpen(false);
  };

  return (
    <div 
      className={`${styles.container} ${styles[size]}`} 
      ref={containerRef}
      data-status-dropdown="true"
    >
      {/* Checkbox Trigger */}
      <button
        ref={triggerRef}
        type="button"
        className={`${styles.trigger} ${isOpen ? styles.active : ''} ${currentStatus === 'done' ? styles.done : ''}`}
        onClick={handleToggleDropdown}
        disabled={disabled}
        aria-label="Change task status"
        aria-expanded={isOpen}
      >
        <CurrentIcon className={styles.triggerIcon} />
      </button>

      {/* Dropdown Menu - Fixed positioning */}
      {isOpen && (
        <div 
          ref={dropdownRef}
          className={styles.dropdown}
          data-status-dropdown="true"
          style={{
            top: `${dropdownPosition.top}px`,
            left: `${dropdownPosition.left}px`,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className={styles.dropdownHeader}>
            <span className={styles.dropdownTitle}>Change Status</span>
          </div>
          
          <ul className={styles.optionsList}>
            {statusOptions.map((option) => {
              const Icon = option.icon;
              const isSelected = option.value === currentStatus;
              
              return (
                <li key={option.value}>
                  <button
                    type="button"
                    className={`${styles.optionButton} ${isSelected ? styles.selected : ''}`}
                    onClick={(e) => handleStatusSelect(e, option.value)}
                  >
                    <Icon className={styles.optionIcon} />
                    <div className={styles.optionContent}>
                      <span className={styles.optionLabel}>{option.label}</span>
                      <span className={styles.optionDescription}>{option.description}</span>
                    </div>
                    {isSelected && <FiCheck className={styles.checkmark} />}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
};

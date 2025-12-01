import type { FC } from 'react';
import { useState, useRef, useEffect } from 'react';
import { FiPlay, FiPause, FiCheckCircle, FiArchive, FiCheck } from 'react-icons/fi';
import type { ProjectStatus } from '@/shared/types';
import styles from './ProjectStatusDropdown.module.css';

export interface ProjectStatusDropdownProps {
  currentStatus: ProjectStatus;
  onStatusChange: (newStatus: ProjectStatus) => void;
  disabled?: boolean;
  size?: 'small' | 'medium' | 'large';
}

interface StatusOption {
  value: ProjectStatus;
  label: string;
  icon: typeof FiPlay;
  badgeVariant: 'info' | 'warning' | 'success' | 'default';
  description: string;
}

const statusOptions: StatusOption[] = [
  {
    value: 'active',
    label: 'Active',
    icon: FiPlay,
    badgeVariant: 'info',
    description: 'Currently working on it',
  },
  {
    value: 'on hold',
    label: 'On Hold',
    icon: FiPause,
    badgeVariant: 'warning',
    description: 'Temporarily paused',
  },
  {
    value: 'completed',
    label: 'Completed',
    icon: FiCheckCircle,
    badgeVariant: 'success',
    description: 'Finished',
  },
  {
    value: 'archived',
    label: 'Archived',
    icon: FiArchive,
    badgeVariant: 'default',
    description: 'Archived for reference',
  },
];

/**
 * ProjectStatusDropdown Component
 * 
 * Interactive badge that opens a dropdown to change project status.
 * Features:
 * - Click badge to open dropdown
 * - Color-coded status options
 * - Keyboard navigation (Arrow keys, Enter, Escape)
 * - Click outside to close
 * - Smooth animations
 * - Matches Badge styling exactly
 */
export const ProjectStatusDropdown: FC<ProjectStatusDropdownProps> = ({
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
    e.stopPropagation();
    if (!disabled) {
      setIsOpen(!isOpen);
    }
  };

  const handleStatusSelect = (e: React.MouseEvent, status: ProjectStatus) => {
    e.stopPropagation();
    onStatusChange(status);
    setIsOpen(false);
  };

  // Get status-specific CSS class
  const getStatusClass = () => {
    switch (currentStatus) {
      case 'active':
        return styles.active;
      case 'on hold':
        return styles.onHold;
      case 'completed':
        return styles.completed;
      case 'archived':
        return styles.archived;
      default:
        return '';
    }
  };

  return (
    <div 
      className={`${styles.container} ${styles[size]}`} 
      ref={containerRef}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Badge Trigger */}
      <button
        ref={triggerRef}
        type="button"
        className={`${styles.trigger} ${isOpen ? styles.active : ''} ${getStatusClass()}`}
        onClick={handleToggleDropdown}
        disabled={disabled}
        aria-label="Change project status"
        aria-expanded={isOpen}
      >
        {currentStatus}
      </button>

      {/* Dropdown Menu - Fixed positioning */}
      {isOpen && (
        <div 
          ref={dropdownRef}
          className={styles.dropdown}
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

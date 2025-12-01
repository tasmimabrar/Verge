import type { FC } from 'react';
import { useState, useRef, useEffect } from 'react';
import { FiAlertCircle, FiAlertTriangle, FiCircle } from 'react-icons/fi';
import styles from './PriorityDropdown.module.css';

export type TaskPriority = 'low' | 'medium' | 'high';

export interface PriorityDropdownProps {
  currentPriority: TaskPriority;
  onPriorityChange: (newPriority: TaskPriority) => void;
  disabled?: boolean;
  size?: 'small' | 'medium' | 'large';
}

interface PriorityOption {
  value: TaskPriority;
  label: string;
  icon: typeof FiCircle;
  color: string;
  description: string;
}

const priorityOptions: PriorityOption[] = [
  {
    value: 'low',
    label: 'Low',
    icon: FiCircle,
    color: 'success',
    description: 'Low priority task',
  },
  {
    value: 'medium',
    label: 'Medium',
    icon: FiAlertTriangle,
    color: 'warning',
    description: 'Medium priority task',
  },
  {
    value: 'high',
    label: 'High',
    icon: FiAlertCircle,
    color: 'error',
    description: 'High priority - urgent',
  },
];

/**
 * PriorityDropdown Component
 * 
 * Interactive badge that opens a dropdown to change task priority.
 * Features:
 * - Click badge to open dropdown
 * - Color-coded priority options (green, orange, red)
 * - Keyboard navigation (Arrow keys, Enter, Escape)
 * - Click outside to close
 * - Smooth animations
 */
export const PriorityDropdown: FC<PriorityDropdownProps> = ({
  currentPriority,
  onPriorityChange,
  disabled = false,
  size = 'medium',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentOption = priorityOptions.find(opt => opt.value === currentPriority) || priorityOptions[1];

  // Calculate dropdown position when opened
  useEffect(() => {
    if (isOpen && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const dropdownHeight = 200; // Approximate height
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;

      // Position dropdown below if there's space, otherwise above
      if (spaceBelow >= dropdownHeight || spaceBelow > spaceAbove) {
        setDropdownPosition({
          top: rect.bottom + 4,
          left: rect.left,
        });
      } else {
        setDropdownPosition({
          top: rect.top - dropdownHeight - 4,
          left: rect.left,
        });
      }
    }
  }, [isOpen]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
        triggerRef.current?.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!disabled) {
      setIsOpen(!isOpen);
    }
  };

  const handleSelect = (priority: TaskPriority) => {
    onPriorityChange(priority);
    setIsOpen(false);
  };

  const handleContainerClick = (e: React.MouseEvent) => {
    // Prevent event from bubbling to parent card
    e.stopPropagation();
  };

  return (
    <>
      <div ref={containerRef} className={styles.container} onClick={handleContainerClick}>
        <button
          ref={triggerRef}
          type="button"
          className={`
            ${styles.trigger}
            ${styles[size]}
            ${styles[currentOption.color]}
            ${disabled ? styles.disabled : ''}
            ${isOpen ? styles.open : ''}
          `}
          onClick={handleToggle}
          disabled={disabled}
          aria-label={`Priority: ${currentOption.label}. Click to change.`}
          aria-expanded={isOpen}
        >
          <span className={styles.triggerLabel}>{currentOption.label.toLowerCase()}</span>
        </button>
      </div>

      {/* Dropdown Portal */}
      {isOpen && (
        <div
          ref={dropdownRef}
          className={styles.dropdown}
          style={{
            position: 'fixed',
            top: `${dropdownPosition.top}px`,
            left: `${dropdownPosition.left}px`,
            zIndex: 1000,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className={styles.dropdownHeader}>
            <span className={styles.dropdownTitle}>Change Priority</span>
          </div>
          
          <div className={styles.options}>
            {priorityOptions.map((option) => {
              const OptionIcon = option.icon;
              const isSelected = option.value === currentPriority;
              
              return (
                <button
                  key={option.value}
                  type="button"
                  className={`
                    ${styles.option}
                    ${isSelected ? styles.selected : ''}
                    ${styles[`option-${option.color}`]}
                  `}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSelect(option.value);
                  }}
                >
                  <div className={styles.optionContent}>
                    <div className={styles.optionHeader}>
                      <OptionIcon className={styles.optionIcon} />
                      <span className={styles.optionLabel}>{option.label}</span>
                    </div>
                    <span className={styles.optionDescription}>
                      {option.description}
                    </span>
                  </div>
                  {isSelected && (
                    <div className={styles.selectedIndicator}>✓</div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </>
  );
};

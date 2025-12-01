import type { FC, ReactNode } from 'react';
import { useEffect, useRef } from 'react';
import styles from './Dropdown.module.css';

export interface DropdownProps {
  /** Whether the dropdown is open */
  isOpen: boolean;
  /** Callback when dropdown should close */
  onClose: () => void;
  /** Dropdown content */
  children: ReactNode;
  /** Alignment relative to trigger */
  align?: 'left' | 'right';
}

/**
 * Dropdown Component
 * 
 * Positioned dropdown menu that appears below a trigger element.
 * Handles click outside and escape key to close.
 */
export const Dropdown: FC<DropdownProps> = ({
  isOpen,
  onClose,
  children,
  align = 'right',
}) => {
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Handle click outside and escape key
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      ref={dropdownRef}
      className={`${styles.dropdown} ${styles[align]}`}
    >
      {children}
    </div>
  );
};

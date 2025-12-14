import type { SavedView } from '@/shared/types';
import { IoChevronDown } from 'react-icons/io5';
import { useState, useRef, useEffect } from 'react';
import styles from './ViewSelector.module.css';

export interface ViewSelectorProps {
  savedViews: SavedView[];
  currentViewId?: string;
  onSelectView: (viewId: string) => void;
  className?: string;
}

export const ViewSelector = ({
  savedViews,
  currentViewId,
  onSelectView,
  className,
}: ViewSelectorProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentView = savedViews.find((v) => v.id === currentViewId);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleSelect = (viewId: string) => {
    onSelectView(viewId);
    setIsOpen(false);
  };

  if (savedViews.length === 0) {
    return null;
  }

  return (
    <div className={`${styles.container} ${className || ''}`} ref={dropdownRef}>
      <button
        type="button"
        className={styles.trigger}
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        <span className={styles.label}>
          {currentView ? currentView.name : 'All Items'}
        </span>
        <IoChevronDown className={`${styles.icon} ${isOpen ? styles.iconOpen : ''}`} />
      </button>

      {isOpen && (
        <div className={styles.dropdown} role="listbox">
          <button
            type="button"
            className={`${styles.option} ${!currentViewId ? styles.active : ''}`}
            onClick={() => handleSelect('')}
            role="option"
            aria-selected={!currentViewId}
          >
            All Items
          </button>

          {savedViews.map((view) => (
            <button
              key={view.id}
              type="button"
              className={`${styles.option} ${currentViewId === view.id ? styles.active : ''}`}
              onClick={() => handleSelect(view.id)}
              role="option"
              aria-selected={currentViewId === view.id}
            >
              {view.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

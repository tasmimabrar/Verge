import type { SavedView, ViewType } from '@/shared/types';
import { useForm } from 'react-hook-form';
import { Modal, Button } from '@/shared/components';
import styles from './SaveViewModal.module.css';

export interface SaveViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (viewName: string) => void;
  currentFilters: SavedView['filters'];
  currentSortBy: string;
  currentSortOrder: 'asc' | 'desc';
  viewType: ViewType;
  isLoading?: boolean;
}

interface FormData {
  viewName: string;
}

export const SaveViewModal = ({
  isOpen,
  onClose,
  onSave,
  currentFilters,
  currentSortBy,
  currentSortOrder,
  viewType,
  isLoading = false,
}: SaveViewModalProps) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<FormData>();

  const onSubmit = (data: FormData) => {
    onSave(data.viewName);
    reset();
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  // Format filter summary for display
  const getFilterSummary = () => {
    const parts: string[] = [];

    if (currentFilters.status) {
      parts.push(`Status: ${currentFilters.status}`);
    }
    if (currentFilters.priority) {
      parts.push(`Priority: ${currentFilters.priority}`);
    }
    if (currentFilters.projectId) {
      parts.push('Filtered by project');
    }
    if (currentFilters.dateRange) {
      parts.push(`Date: ${currentFilters.dateRange}`);
    }

    if (parts.length === 0) {
      return 'No filters applied';
    }

    return parts.join(' • ');
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Save Current View">
      <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
        <div className={styles.content}>
          <div className={styles.field}>
            <label htmlFor="viewName" className={styles.label}>
              View Name
            </label>
            <input
              id="viewName"
              type="text"
              className={styles.input}
              placeholder="e.g., High Priority Tasks"
              {...register('viewName', {
                required: 'View name is required',
                minLength: {
                  value: 3,
                  message: 'View name must be at least 3 characters',
                },
                maxLength: {
                  value: 50,
                  message: 'View name must be less than 50 characters',
                },
              })}
            />
            {errors.viewName && (
              <span className={styles.error}>{errors.viewName.message}</span>
            )}
          </div>

          <div className={styles.summary}>
            <h4 className={styles.summaryTitle}>Current View Settings</h4>
            <div className={styles.summaryItem}>
              <span className={styles.summaryLabel}>Type:</span>
              <span className={styles.summaryValue}>{viewType}</span>
            </div>
            <div className={styles.summaryItem}>
              <span className={styles.summaryLabel}>Filters:</span>
              <span className={styles.summaryValue}>{getFilterSummary()}</span>
            </div>
            <div className={styles.summaryItem}>
              <span className={styles.summaryLabel}>Sort:</span>
              <span className={styles.summaryValue}>
                {currentSortBy} ({currentSortOrder})
              </span>
            </div>
          </div>
        </div>

        <div className={styles.actions}>
          <Button type="button" variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" loading={isLoading}>
            Save View
          </Button>
        </div>
      </form>
    </Modal>
  );
};

import type { FC } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { Timestamp } from 'firebase/firestore';
import { FiX, FiSave } from 'react-icons/fi';
import { toast } from 'sonner';
import { AppLayout, Card, Button } from '@/shared/components';
import { useAuth } from '@/shared/hooks/useAuth';
import { useCreateProject } from '@/shared/hooks/useProjects';
import { dateStringToLocalDate } from '@/shared/utils/dateHelpers';
import { ProjectStatus } from '@/shared/types';
import styles from './NewProject.module.css';

interface ProjectFormData {
  name: string;
  description: string;
  dueDate: string; // ISO date string from input
  status: 'active' | 'on_hold' | 'completed' | 'archived';
}

/**
 * NewProject Component
 * 
 * Form for creating a new project.
 * Uses React Hook Form for validation and state management.
 * 
 * Features:
 * - Required fields: name, dueDate
 * - Optional: description, status (default: active)
 * - Client-side validation
 * - Toast notifications on success/error
 * - Navigate to projects list after creation
 */
export const NewProject: FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const createProject = useCreateProject();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ProjectFormData>({
    defaultValues: {
      status: 'active',
      description: '',
    },
  });

  const onSubmit: SubmitHandler<ProjectFormData> = async (data) => {
    if (!user) {
      toast.error('You must be logged in to create a project');
      return;
    }

    try {
      await createProject.mutateAsync({
        userId: user.uid,
        name: data.name,
        description: data.description?.trim() || undefined, // Only include if not empty
        dueDate: Timestamp.fromDate(dateStringToLocalDate(data.dueDate)),
        status: data.status as ProjectStatus,
      });

      toast.success('Project created successfully!');
      navigate('/projects');
    } catch (error) {
      console.error('Failed to create project:', error);
      toast.error('Failed to create project. Please try again.');
    }
  };

  const handleCancel = () => {
    navigate(-1); // Go back
  };

  return (
    <AppLayout>
      <div className={styles.container}>
        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>Create New Project</h1>
            <p className={styles.subtitle}>Organize your tasks into projects</p>
          </div>
        </div>

        <Card variant="elevated" padding="large">
          <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
            {/* Name */}
            <div className={styles.formGroup}>
              <label htmlFor="name" className={styles.label}>
                Project Name <span className={styles.required}>*</span>
              </label>
              <input
                id="name"
                type="text"
                className={styles.input}
                placeholder="e.g., Website Redesign, Q4 Marketing"
                autoFocus
                {...register('name', {
                  required: 'Project name is required',
                  minLength: { value: 3, message: 'Name must be at least 3 characters' },
                })}
              />
              {errors.name && (
                <span className={styles.error}>{errors.name.message}</span>
              )}
            </div>

            {/* Due Date & Status (side by side) */}
            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label htmlFor="dueDate" className={styles.label}>
                  Due Date <span className={styles.required}>*</span>
                </label>
                <input
                  id="dueDate"
                  type="date"
                  className={styles.input}
                  {...register('dueDate', { required: 'Due date is required' })}
                />
                {errors.dueDate && (
                  <span className={styles.error}>{errors.dueDate.message}</span>
                )}
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="status" className={styles.label}>
                  Status
                </label>
                <select id="status" className={styles.select} {...register('status')}>
                  <option value="active">Active</option>
                  <option value="on_hold">On Hold</option>
                  <option value="completed">Completed</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
            </div>

            {/* Description */}
            <div className={styles.formGroup}>
              <label htmlFor="description" className={styles.label}>
                Description
              </label>
              <textarea
                id="description"
                className={styles.textarea}
                placeholder="What is this project about?"
                rows={5}
                {...register('description')}
              />
            </div>

            {/* Actions */}
            <div className={styles.actions}>
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
                disabled={isSubmitting}
              >
                <FiX /> Cancel
              </Button>
              <Button type="submit" variant="primary" loading={isSubmitting}>
                <FiSave /> Create Project
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </AppLayout>
  );
};

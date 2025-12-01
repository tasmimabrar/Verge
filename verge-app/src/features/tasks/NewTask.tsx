import type { FC } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { Timestamp } from 'firebase/firestore';
import { FiX, FiSave } from 'react-icons/fi';
import { toast } from 'sonner';
import { AppLayout, Card, Button } from '@/shared/components';
import { useAuth } from '@/shared/hooks/useAuth';
import { useCreateTask } from '@/shared/hooks/useTasks';
import { useProjects } from '@/shared/hooks/useProjects';
import { dateStringToLocalDate } from '@/shared/utils/dateHelpers';
import { TaskStatus } from '@/shared/types';
import styles from './NewTask.module.css';

interface TaskFormData {
  title: string;
  notes: string;
  dueDate: string; // ISO date string from input
  priority: 'low' | 'medium' | 'high';
  projectId: string;
  tags: string; // Comma-separated
}

/**
 * NewTask Component
 * 
 * Form for creating a new task.
 * Uses React Hook Form for validation and state management.
 * 
 * Features:
 * - Required fields: title, dueDate, projectId
 * - Optional: notes, priority, tags
 * - Client-side validation
 * - Toast notifications on success/error
 * - Navigate to task detail after creation
 */
export const NewTask: FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const createTask = useCreateTask();
  const { data: projects, isLoading: projectsLoading } = useProjects(user?.uid || '');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<TaskFormData>({
    defaultValues: {
      priority: 'medium',
      notes: '',
      tags: '',
    },
  });

  const onSubmit: SubmitHandler<TaskFormData> = async (data) => {
    if (!user) {
      toast.error('You must be logged in to create a task');
      return;
    }

    try {
      // Parse tags (comma-separated) - only if tags exist
      const tagArray = data.tags?.trim()
        ? data.tags.split(',').map((tag) => tag.trim()).filter(Boolean)
        : [];

      // Create task with Firestore Timestamp
      const newTask = await createTask.mutateAsync({
        userId: user.uid,
        projectId: data.projectId,
        title: data.title,
        notes: data.notes?.trim() || undefined, // Only include if not empty
        dueDate: Timestamp.fromDate(dateStringToLocalDate(data.dueDate)),
        priority: data.priority,
        status: TaskStatus.TODO,
        tags: tagArray.length > 0 ? tagArray : undefined, // Only include if has tags
        subtasks: [],
      });

      toast.success('Task created successfully!');
      navigate(`/tasks/${newTask.id}`);
    } catch (error) {
      console.error('Failed to create task:', error);
      toast.error('Failed to create task. Please try again.');
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
            <h1 className={styles.title}>Create New Task</h1>
            <p className={styles.subtitle}>Add a task to your workspace</p>
          </div>
        </div>

        <Card variant="elevated" padding="large" className={styles.formCard}>
          <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
            {/* Title */}
            <div className={styles.formGroup}>
              <label htmlFor="title" className={styles.label}>
                Title <span className={styles.required}>*</span>
              </label>
              <input
                id="title"
                type="text"
                className={styles.input}
                placeholder="What needs to be done?"
                autoFocus
                {...register('title', {
                  required: 'Title is required',
                  minLength: { value: 3, message: 'Title must be at least 3 characters' },
                })}
              />
              {errors.title && (
                <span className={styles.error}>{errors.title.message}</span>
              )}
            </div>

            {/* Project */}
            <div className={styles.formGroup}>
              <label htmlFor="projectId" className={styles.label}>
                Project <span className={styles.required}>*</span>
              </label>
              <select
                id="projectId"
                className={styles.select}
                disabled={projectsLoading}
                {...register('projectId', { required: 'Project is required' })}
              >
                <option value="">Select a project...</option>
                {projects?.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
              {errors.projectId && (
                <span className={styles.error}>{errors.projectId.message}</span>
              )}
            </div>

            {/* Due Date & Priority (side by side) */}
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
                <label htmlFor="priority" className={styles.label}>
                  Priority
                </label>
                <select id="priority" className={styles.select} {...register('priority')}>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
            </div>

            {/* Notes */}
            <div className={styles.formGroup}>
              <label htmlFor="notes" className={styles.label}>
                Notes
              </label>
              <textarea
                id="notes"
                className={styles.textarea}
                placeholder="Add any additional details..."
                rows={4}
                {...register('notes')}
              />
            </div>

            {/* Tags */}
            <div className={styles.formGroup}>
              <label htmlFor="tags" className={styles.label}>
                Tags
              </label>
              <input
                id="tags"
                type="text"
                className={styles.input}
                placeholder="work, urgent, review (comma-separated)"
                {...register('tags')}
              />
              <span className={styles.hint}>Separate multiple tags with commas</span>
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
                <FiSave /> Create Task
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </AppLayout>
  );
};

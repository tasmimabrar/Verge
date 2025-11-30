import type { FC } from 'react';
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Timestamp } from 'firebase/firestore';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { FiEdit2, FiTrash2, FiSave, FiX, FiCalendar, FiTag, FiAlertCircle } from 'react-icons/fi';
import { toDate, dateStringToLocalDate } from '@/shared/utils/dateHelpers';
import { AppLayout, Card, Button, Loader, EmptyState, Badge } from '@/shared/components';
import { useAuth } from '@/shared/hooks/useAuth';
import { useTask, useUpdateTask, useDeleteTask } from '@/shared/hooks/useTasks';
import { useProjects } from '@/shared/hooks/useProjects';
import styles from './TaskDetail.module.css';

interface TaskFormData {
  title: string;
  notes: string;
  dueDate: string;
  priority: 'low' | 'medium' | 'high';
  projectId: string;
  tags: string;
  status: 'todo' | 'in_progress' | 'done' | 'postponed';
}

/**
 * TaskDetail Component
 * 
 * Full task detail screen with read/edit modes.
 * Features:
 * - View all task details
 * - Edit mode with form validation
 * - Delete task with confirmation
 * - Navigate back to dashboard/tasks list
 * - Inline task creation context from project
 */
export const TaskDetail: FC = () => {
  const { id: taskId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);

  // Queries
  const { data: task, isLoading, error } = useTask(taskId);
  const { data: projects } = useProjects(user?.uid || '');
  
  // Mutations
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();

  // Form
  const { register, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm<TaskFormData>({
    defaultValues: {
      title: '',
      notes: '',
      dueDate: '',
      priority: 'medium',
      projectId: '',
      tags: '',
      status: 'todo',
    },
  });

  // Update form when task loads - use useEffect to avoid infinite loop
  useEffect(() => {
    if (task) {
      reset({
        title: task.title,
        notes: task.notes || '',
        dueDate: task.dueDate ? format(toDate(task.dueDate), 'yyyy-MM-dd') : '',
        priority: task.priority,
        projectId: task.projectId,
        tags: task.tags?.join(', ') || '',
        status: task.status,
      });
    }
  }, [task, reset]);

  const onSubmit = async (data: TaskFormData) => {
    if (!taskId) return;

    try {
      const tags = data.tags?.trim()
        ? data.tags.split(',').map(tag => tag.trim()).filter(Boolean)
        : [];

      await updateTask.mutateAsync({
        id: taskId,
        title: data.title,
        notes: data.notes?.trim() || undefined, // Only include if not empty
        dueDate: Timestamp.fromDate(dateStringToLocalDate(data.dueDate)),
        priority: data.priority,
        projectId: data.projectId,
        tags: tags.length > 0 ? tags : undefined, // Only include if has tags
        status: data.status,
        userId: user!.uid,
      });

      toast.success('Task updated successfully!');
      setIsEditing(false);
    } catch (err) {
      console.error('Failed to update task:', err);
      toast.error('Failed to update task. Please try again.');
    }
  };

  const handleDelete = async () => {
    if (!taskId) return;
    
    const confirmed = window.confirm('Are you sure you want to delete this task? This action cannot be undone.');
    if (!confirmed) return;

    try {
      await deleteTask.mutateAsync(taskId);
      toast.success('Task deleted successfully!');
      navigate('/tasks');
    } catch (err) {
      console.error('Failed to delete task:', err);
      toast.error('Failed to delete task. Please try again.');
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    reset();
  };

  const getProject = () => {
    return projects?.find(p => p.id === task?.projectId);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'error';
      case 'medium': return 'warning';
      case 'low': return 'success';
      default: return 'default';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'done': return 'success';
      case 'in_progress': return 'info';
      case 'postponed': return 'warning';
      default: return 'default';
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <AppLayout>
        <div className={styles.container}>
          <Loader variant="screen" />
        </div>
      </AppLayout>
    );
  }

  // Error state
  if (error || !task) {
    return (
      <AppLayout>
        <div className={styles.container}>
          <EmptyState
            title="Task not found"
            message="The task you're looking for doesn't exist or you don't have permission to view it."
            icon={<FiAlertCircle />}
          />
          <div className={styles.actions}>
            <Button variant="secondary" onClick={() => navigate('/tasks')}>
              Back to Tasks
            </Button>
          </div>
        </div>
      </AppLayout>
    );
  }

  const project = getProject();

  return (
    <AppLayout>
      <div className={styles.container}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerContent}>
            <h1 className={styles.title}>{isEditing ? 'Edit Task' : task.title}</h1>
            <div className={styles.metadata}>
              {project && (
                <span className={styles.project}>
                  <FiTag /> {project.name}
                </span>
              )}
              <span className={styles.dueDate}>
                <FiCalendar /> Due {format(toDate(task.dueDate), 'MMM dd, yyyy')}
              </span>
              <Badge variant={getPriorityColor(task.priority)}>
                {task.priority}
              </Badge>
              <Badge variant={getStatusColor(task.status)}>
                {task.status.replace('_', ' ')}
              </Badge>
            </div>
          </div>
          
          {!isEditing && (
            <div className={styles.headerActions}>
              <Button
                variant="secondary"
                size="small"
                onClick={() => setIsEditing(true)}
              >
                <FiEdit2 /> Edit
              </Button>
              <Button
                variant="ghost"
                size="small"
                onClick={handleDelete}
              >
                <FiTrash2 /> Delete
              </Button>
            </div>
          )}
        </div>

        {/* Content */}
        <Card variant="elevated" padding="large">
          {isEditing ? (
            // Edit Mode
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
                  {...register('title', {
                    required: 'Title is required',
                    minLength: { value: 3, message: 'Title must be at least 3 characters' },
                  })}
                  autoFocus
                />
                {errors.title && <span className={styles.error}>{errors.title.message}</span>}
              </div>

              {/* Notes */}
              <div className={styles.formGroup}>
                <label htmlFor="notes" className={styles.label}>
                  Notes
                </label>
                <textarea
                  id="notes"
                  className={styles.textarea}
                  rows={6}
                  {...register('notes')}
                  placeholder="Add detailed notes, context, or requirements..."
                />
              </div>

              {/* Due Date & Priority */}
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label htmlFor="dueDate" className={styles.label}>
                    Due Date <span className={styles.required}>*</span>
                  </label>
                  <input
                    id="dueDate"
                    type="date"
                    className={styles.input}
                    {...register('dueDate', {
                      required: 'Due date is required',
                      validate: value => {
                        const selected = new Date(value);
                        const today = new Date();
                        today.setHours(0, 0, 0, 0);
                        return selected >= today || 'Due date cannot be in the past';
                      },
                    })}
                  />
                  {errors.dueDate && <span className={styles.error}>{errors.dueDate.message}</span>}
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="priority" className={styles.label}>
                    Priority <span className={styles.required}>*</span>
                  </label>
                  <select
                    id="priority"
                    className={styles.select}
                    {...register('priority', { required: 'Priority is required' })}
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                  {errors.priority && <span className={styles.error}>{errors.priority.message}</span>}
                </div>
              </div>

              {/* Project & Status */}
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label htmlFor="projectId" className={styles.label}>
                    Project <span className={styles.required}>*</span>
                  </label>
                  <select
                    id="projectId"
                    className={styles.select}
                    {...register('projectId', { required: 'Project is required' })}
                  >
                    <option value="">Select a project</option>
                    {projects?.map(project => (
                      <option key={project.id} value={project.id}>
                        {project.name}
                      </option>
                    ))}
                  </select>
                  {errors.projectId && <span className={styles.error}>{errors.projectId.message}</span>}
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="status" className={styles.label}>
                    Status <span className={styles.required}>*</span>
                  </label>
                  <select
                    id="status"
                    className={styles.select}
                    {...register('status', { required: 'Status is required' })}
                  >
                    <option value="todo">To Do</option>
                    <option value="in_progress">In Progress</option>
                    <option value="done">Done</option>
                    <option value="postponed">Postponed</option>
                  </select>
                  {errors.status && <span className={styles.error}>{errors.status.message}</span>}
                </div>
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
                  {...register('tags')}
                  placeholder="e.g. urgent, backend, bug-fix (comma-separated)"
                />
              </div>

              {/* Actions */}
              <div className={styles.formActions}>
                <Button type="button" variant="secondary" onClick={handleCancel}>
                  <FiX /> Cancel
                </Button>
                <Button type="submit" variant="primary" loading={isSubmitting}>
                  <FiSave /> Save Changes
                </Button>
              </div>
            </form>
          ) : (
            // Read Mode
            <div className={styles.details}>
              {/* Notes */}
              {task.notes && (
                <div className={styles.section}>
                  <h3 className={styles.sectionTitle}>Notes</h3>
                  <p className={styles.notes}>{task.notes}</p>
                </div>
              )}

              {/* Tags */}
              {task.tags && task.tags.length > 0 && (
                <div className={styles.section}>
                  <h3 className={styles.sectionTitle}>Tags</h3>
                  <div className={styles.tags}>
                    {task.tags.map((tag, index) => (
                      <Badge key={index} variant="default">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Timestamps */}
              <div className={styles.section}>
                <h3 className={styles.sectionTitle}>Metadata</h3>
                <div className={styles.timestamps}>
                  <p>
                    <strong>Created:</strong>{' '}
                    {task.createdAt && format(toDate(task.createdAt), 'MMM dd, yyyy h:mm a')}
                  </p>
                  <p>
                    <strong>Last Updated:</strong>{' '}
                    {task.updatedAt && format(toDate(task.updatedAt), 'MMM dd, yyyy h:mm a')}
                  </p>
                </div>
              </div>
            </div>
          )}
        </Card>

        {/* Back Button */}
        <div className={styles.backButton}>
          <Button variant="secondary" onClick={() => navigate(-1)}>
            Back
          </Button>
        </div>
      </div>
    </AppLayout>
  );
};

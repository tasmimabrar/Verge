import type { FC } from 'react';
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Timestamp } from 'firebase/firestore';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { FiEdit2, FiTrash2, FiSave, FiX, FiCalendar, FiPlus, FiAlertCircle } from 'react-icons/fi';
import { toDate, dateStringToLocalDate } from '@/shared/utils/dateHelpers';
import { AppLayout, Card, Button, Loader, EmptyState, Badge, TaskCard } from '@/shared/components';
import { useAuth } from '@/shared/hooks/useAuth';
import { useProject, useUpdateProject, useDeleteProject } from '@/shared/hooks/useProjects';
import { useProjectTasks, useCreateTask, useUpdateTask } from '@/shared/hooks/useTasks';
import type { TaskStatus } from '@/shared/components/TaskStatusDropdown';
import styles from './ProjectDetail.module.css';

interface ProjectFormData {
  name: string;
  description: string;
  dueDate: string;
  status: 'active' | 'on_hold' | 'completed' | 'archived';
}

interface QuickTaskFormData {
  title: string;
  dueDate: string;
  priority: 'low' | 'medium' | 'high';
}

/**
 * ProjectDetail Component
 * 
 * Full project detail screen with read/edit modes + inline task creation.
 * Features:
 * - View project details and associated tasks
 * - Edit mode with form validation
 * - Delete project with confirmation
 * - Inline task creation (title, dueDate, priority)
 * - Click tasks to navigate to detail
 */
export const ProjectDetail: FC = () => {
  const { id: projectId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [showQuickAdd, setShowQuickAdd] = useState(false);

  // Queries
  const { data: project, isLoading, error } = useProject(projectId);
  const { data: tasks, isLoading: tasksLoading } = useProjectTasks(projectId);
  
  // Mutations
  const updateProject = useUpdateProject();
  const deleteProject = useDeleteProject();
  const createTask = useCreateTask();
  const updateTask = useUpdateTask();

  const handleStatusChange = async (taskId: string, newStatus: TaskStatus) => {
    try {
      await updateTask.mutateAsync({
        id: taskId,
        status: newStatus,
        userId: user!.uid,
      });
      toast.success(`Task status changed to ${newStatus.replace('_', ' ')}`);
    } catch (err) {
      console.error('Failed to update status:', err);
      toast.error('Failed to update task status');
    }
  };

  // Project Form
  const { register: registerProject, handleSubmit: handleProjectSubmit, formState: { errors: projectErrors, isSubmitting: projectSubmitting }, reset: resetProject } = useForm<ProjectFormData>({
    defaultValues: {
      name: '',
      description: '',
      dueDate: '',
      status: 'active',
    },
  });

  // Quick Task Form
  const { register: registerTask, handleSubmit: handleTaskSubmit, formState: { errors: taskErrors, isSubmitting: taskSubmitting }, reset: resetTask } = useForm<QuickTaskFormData>({
    defaultValues: {
      priority: 'medium',
      dueDate: format(new Date(), 'yyyy-MM-dd'),
    },
  });

  // Update project form when project loads - use useEffect to avoid infinite loop
  useEffect(() => {
    if (project) {
      resetProject({
        name: project.name,
        description: project.description || '',
        dueDate: project.dueDate ? format(toDate(project.dueDate), 'yyyy-MM-dd') : '',
        status: project.status,
      });
    }
  }, [project, resetProject]);

  const onProjectSubmit = async (data: ProjectFormData) => {
    if (!projectId) return;

    try {
      await updateProject.mutateAsync({
        id: projectId,
        name: data.name,
        description: data.description?.trim() || '', // Send empty string to clear field
        dueDate: Timestamp.fromDate(dateStringToLocalDate(data.dueDate)),
        status: data.status,
        userId: user!.uid,
      });

      toast.success('Project updated successfully!');
      setIsEditing(false);
    } catch (err) {
      console.error('Failed to update project:', err);
      toast.error('Failed to update project. Please try again.');
    }
  };

  const onTaskSubmit = async (data: QuickTaskFormData) => {
    if (!projectId || !user) return;

    try {
      await createTask.mutateAsync({
        title: data.title,
        projectId: projectId,
        userId: user.uid,
        dueDate: Timestamp.fromDate(dateStringToLocalDate(data.dueDate)),
        priority: data.priority,
        status: 'todo',
      });

      toast.success('Task added!');
      resetTask({
        title: '',
        priority: 'medium',
        dueDate: format(new Date(), 'yyyy-MM-dd'),
      });
      
      // Keep form open for adding more tasks
      // Auto-focus on title input for next task
      document.getElementById('quick-task-title')?.focus();
    } catch (err) {
      console.error('Failed to create task:', err);
      toast.error('Failed to add task. Please try again.');
    }
  };

  const handleDelete = async () => {
    if (!projectId) return;
    
    const confirmed = window.confirm(
      'Are you sure you want to delete this project? This will NOT delete associated tasks. Tasks will remain but lose their project association.'
    );
    if (!confirmed) return;

    try {
      await deleteProject.mutateAsync(projectId);
      toast.success('Project deleted successfully!');
      navigate('/projects');
    } catch (err) {
      console.error('Failed to delete project:', err);
      toast.error('Failed to delete project. Please try again.');
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    resetProject();
  };

  const handleTaskClick = (taskId: string) => {
    navigate(`/tasks/${taskId}`);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'success';
      case 'active': return 'info';
      case 'on_hold': return 'warning';
      case 'archived': return 'default';
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
  if (error || !project) {
    return (
      <AppLayout>
        <div className={styles.container}>
          <EmptyState
            title="Project not found"
            message="The project you're looking for doesn't exist or you don't have permission to view it."
            icon={<FiAlertCircle />}
          />
          <div className={styles.actions}>
            <Button variant="secondary" onClick={() => navigate('/projects')}>
              Back to Projects
            </Button>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className={styles.container}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerContent}>
            <h1 className={styles.title}>{isEditing ? 'Edit Project' : project.name}</h1>
            <div className={styles.metadata}>
              <span className={styles.dueDate}>
                <FiCalendar /> Due {format(toDate(project.dueDate), 'MMM dd, yyyy')}
              </span>
              <Badge variant={getStatusColor(project.status)}>
                {project.status.replace('_', ' ')}
              </Badge>
              <span className={styles.taskCount}>
                {tasks?.length || 0} {tasks?.length === 1 ? 'task' : 'tasks'}
              </span>
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

        {/* Project Details */}
        <Card variant="elevated" padding="large" className={styles.detailsCard}>
          {isEditing ? (
            // Edit Mode
            <form onSubmit={handleProjectSubmit(onProjectSubmit)} className={styles.form}>
              {/* Name */}
              <div className={styles.formGroup}>
                <label htmlFor="name" className={styles.label}>
                  Project Name <span className={styles.required}>*</span>
                </label>
                <input
                  id="name"
                  type="text"
                  className={styles.input}
                  {...registerProject('name', {
                    required: 'Project name is required',
                    minLength: { value: 3, message: 'Name must be at least 3 characters' },
                  })}
                  autoFocus
                />
                {projectErrors.name && <span className={styles.error}>{projectErrors.name.message}</span>}
              </div>

              {/* Description */}
              <div className={styles.formGroup}>
                <label htmlFor="description" className={styles.label}>
                  Description
                </label>
                <textarea
                  id="description"
                  className={styles.textarea}
                  rows={4}
                  {...registerProject('description')}
                  placeholder="Add project goals, scope, or important notes..."
                />
              </div>

              {/* Due Date & Status */}
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label htmlFor="dueDate" className={styles.label}>
                    Due Date <span className={styles.required}>*</span>
                  </label>
                  <input
                    id="dueDate"
                    type="date"
                    className={styles.input}
                    {...registerProject('dueDate', {
                      required: 'Due date is required',
                      validate: value => {
                        const selected = new Date(value);
                        const today = new Date();
                        today.setHours(0, 0, 0, 0);
                        return selected >= today || 'Due date cannot be in the past';
                      },
                    })}
                  />
                  {projectErrors.dueDate && <span className={styles.error}>{projectErrors.dueDate.message}</span>}
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="status" className={styles.label}>
                    Status <span className={styles.required}>*</span>
                  </label>
                  <select
                    id="status"
                    className={styles.select}
                    {...registerProject('status', { required: 'Status is required' })}
                  >
                    <option value="active">Active</option>
                    <option value="on_hold">On Hold</option>
                    <option value="completed">Completed</option>
                    <option value="archived">Archived</option>
                  </select>
                  {projectErrors.status && <span className={styles.error}>{projectErrors.status.message}</span>}
                </div>
              </div>

              {/* Actions */}
              <div className={styles.formActions}>
                <Button type="button" variant="secondary" onClick={handleCancel}>
                  <FiX /> Cancel
                </Button>
                <Button type="submit" variant="primary" loading={projectSubmitting}>
                  <FiSave /> Save Changes
                </Button>
              </div>
            </form>
          ) : (
            // Read Mode
            <div className={styles.details}>
              {project.description && (
                <div className={styles.section}>
                  <h3 className={styles.sectionTitle}>Description</h3>
                  <p className={styles.description}>{project.description}</p>
                </div>
              )}

              <div className={styles.section}>
                <h3 className={styles.sectionTitle}>Metadata</h3>
                <div className={styles.timestamps}>
                  <p>
                    <strong>Created:</strong>{' '}
                    {project.createdAt && format(toDate(project.createdAt), 'MMM dd, yyyy h:mm a')}
                  </p>
                  <p>
                    <strong>Last Updated:</strong>{' '}
                    {project.updatedAt && format(toDate(project.updatedAt), 'MMM dd, yyyy h:mm a')}
                  </p>
                </div>
              </div>
            </div>
          )}
        </Card>

        {/* Tasks Section */}
        <div className={styles.tasksSection}>
          <div className={styles.tasksSectionHeader}>
            <h2 className={styles.sectionTitle}>Tasks</h2>
            <Button
              variant="primary"
              size="small"
              onClick={() => setShowQuickAdd(!showQuickAdd)}
            >
              <FiPlus /> Add Task
            </Button>
          </div>

          {/* Quick Add Task Form */}
          {showQuickAdd && (
            <Card variant="outline" padding="medium" className={styles.quickAddCard}>
              <form onSubmit={handleTaskSubmit(onTaskSubmit)} className={styles.quickAddForm}>
                <div className={styles.quickAddFields}>
                  <div className={styles.formGroup}>
                    <input
                      id="quick-task-title"
                      type="text"
                      className={styles.input}
                      placeholder="Task title..."
                      {...registerTask('title', {
                        required: 'Title is required',
                        minLength: { value: 3, message: 'Title must be at least 3 characters' },
                      })}
                      autoFocus
                    />
                    {taskErrors.title && <span className={styles.error}>{taskErrors.title.message}</span>}
                  </div>

                  <div className={styles.formGroup}>
                    <input
                      id="quick-task-due-date"
                      type="date"
                      className={styles.input}
                      {...registerTask('dueDate', { required: 'Due date is required' })}
                    />
                    {taskErrors.dueDate && <span className={styles.error}>{taskErrors.dueDate.message}</span>}
                  </div>

                  <div className={styles.formGroup}>
                    <select
                      id="quick-task-priority"
                      className={styles.select}
                      {...registerTask('priority')}
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>

                  <Button type="submit" variant="primary" loading={taskSubmitting}>
                    Add
                  </Button>
                </div>
              </form>
            </Card>
          )}

          {/* Tasks List */}
          {tasksLoading ? (
            <Loader variant="skeleton" count={3} />
          ) : !tasks || tasks.length === 0 ? (
            <EmptyState
              title="No tasks yet"
              message="Add your first task to get started on this project."
              icon={<FiPlus />}
            />
          ) : (
            <div className={styles.tasksList}>
              {tasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  variant="preview"
                  onClick={() => handleTaskClick(task.id)}
                  onStatusChange={handleStatusChange}
                />
              ))}
            </div>
          )}
        </div>

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

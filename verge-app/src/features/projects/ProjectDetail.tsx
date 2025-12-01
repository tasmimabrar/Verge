import type { FC } from 'react';
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Timestamp } from 'firebase/firestore';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { FiTrash2, FiCalendar, FiPlus, FiAlertCircle } from 'react-icons/fi';
import { toDate, dateStringToLocalDate } from '@/shared/utils/dateHelpers';
import { AppLayout, Card, Button, Loader, EmptyState, TaskCard, ProjectStatusDropdown } from '@/shared/components';
import { useAuth } from '@/shared/hooks/useAuth';
import { useProject, useUpdateProject, useDeleteProject } from '@/shared/hooks/useProjects';
import { useProjectTasks, useCreateTask, useUpdateTask } from '@/shared/hooks/useTasks';
import type { TaskStatus } from '@/shared/components/TaskStatusDropdown';
import type { TaskPriority } from '@/shared/components/PriorityDropdown';
import type { ProjectStatus, Project } from '@/shared/types';
import styles from './ProjectDetail.module.css';

interface QuickTaskFormData {
  title: string;
  dueDate: string;
  priority: 'low' | 'medium' | 'high';
}

/**
 * ProjectDetail Component
 * 
 * Project detail screen with inline editing and associated tasks.
 * Features:
 * - Inline editing for project name, description, and due date (click to edit)
 * - Auto-save on blur (click outside to save)
 * - Delete project with confirmation
 * - Inline task creation (title, dueDate, priority)
 * - Click tasks to navigate to detail
 */
export const ProjectDetail: FC = () => {
  const { id: projectId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // Inline editing state
  const [editingName, setEditingName] = useState(false);
  const [nameValue, setNameValue] = useState('');
  const [editingDescription, setEditingDescription] = useState(false);
  const [descriptionValue, setDescriptionValue] = useState('');
  const [editingDueDate, setEditingDueDate] = useState(false);
  const [dueDateValue, setDueDateValue] = useState('');
  
  // Track unsaved changes
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
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

  const handlePriorityChange = async (taskId: string, newPriority: TaskPriority) => {
    try {
      await updateTask.mutateAsync({
        id: taskId,
        priority: newPriority,
        userId: user!.uid,
      });
      toast.success(`Task priority changed to ${newPriority}`);
    } catch (err) {
      console.error('Failed to update priority:', err);
      toast.error('Failed to update task priority');
    }
  };

  const handleProjectStatusChange = async (newStatus: ProjectStatus) => {
    if (!projectId) return;

    try {
      await updateProject.mutateAsync({
        id: projectId,
        status: newStatus,
        userId: user!.uid,
      });
      toast.success(`Project status changed to ${newStatus}`);
    } catch (err) {
      console.error('Failed to update project status:', err);
      toast.error('Failed to update project status');
    }
  };

  // Initialize inline editing values when project loads - only reset on navigation (project ID change)
  // Removed !editingField conditions to allow local changes to persist in UI
  useEffect(() => {
    if (project) {
      setNameValue(project.name);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project?.id]);

  useEffect(() => {
    if (project) {
      setDescriptionValue(project.description || '');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project?.id]);

  useEffect(() => {
    if (project) {
      setDueDateValue(project.dueDate ? format(toDate(project.dueDate), 'yyyy-MM-dd') : '');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project?.id]);

  // Detect changes and mark as unsaved
  useEffect(() => {
    if (!project) return;
    
    const hasChanges = 
      nameValue !== project.name ||
      descriptionValue !== (project.description || '') ||
      dueDateValue !== (project.dueDate ? format(toDate(project.dueDate), 'yyyy-MM-dd') : '');
    
    setHasUnsavedChanges(hasChanges);
  }, [project, nameValue, descriptionValue, dueDateValue]);

  // Unified save handler - batches all changes into ONE Firebase write
  const handleSaveAllChanges = async () => {
    if (!project || !projectId || !hasUnsavedChanges) return;

    setIsSaving(true);

    try {
      // Build update object with only changed fields
      const updates: Partial<Project> & { id: string; userId: string } = {
        id: projectId,
        userId: user!.uid,
      };

      // Name validation and update
      if (nameValue !== project.name) {
        if (!nameValue.trim() || nameValue.trim().length < 3) {
          toast.error('Project name must be at least 3 characters');
          setNameValue(project.name);
          setIsSaving(false);
          return;
        }
        updates.name = nameValue.trim();
      }

      // Description update
      if (descriptionValue !== (project.description || '')) {
        updates.description = descriptionValue.trim();
      }

      // Due date validation and update
      if (dueDateValue !== (project.dueDate ? format(toDate(project.dueDate), 'yyyy-MM-dd') : '')) {
        if (!dueDateValue) {
          toast.error('Due date is required');
          setDueDateValue(project.dueDate ? format(toDate(project.dueDate), 'yyyy-MM-dd') : '');
          setIsSaving(false);
          return;
        }

        const selectedDate = new Date(dueDateValue);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        if (selectedDate < today) {
          toast.error('Due date cannot be in the past');
          setDueDateValue(project.dueDate ? format(toDate(project.dueDate), 'yyyy-MM-dd') : '');
          setIsSaving(false);
          return;
        }

        updates.dueDate = Timestamp.fromDate(dateStringToLocalDate(dueDateValue));
      }

      // Only save if there are actual changes
      if (Object.keys(updates).length > 2) { // More than just id and userId
        await updateProject.mutateAsync(updates);
        toast.success('Changes saved successfully!');
        setHasUnsavedChanges(false);
        
        // Close all editing modes
        setEditingName(false);
        setEditingDescription(false);
        setEditingDueDate(false);
      }
    } catch (err) {
      console.error('Failed to save changes:', err);
      toast.error('Failed to save changes. Please try again.');
      
      // Revert all values on error
      if (project) {
        setNameValue(project.name);
        setDescriptionValue(project.description || '');
        setDueDateValue(project.dueDate ? format(toDate(project.dueDate), 'yyyy-MM-dd') : '');
      }
    } finally {
      setIsSaving(false);
    }
  };

  // Discard changes and revert to original values
  const handleDiscardChanges = () => {
    if (!project) return;
    
    setNameValue(project.name);
    setDescriptionValue(project.description || '');
    setDueDateValue(project.dueDate ? format(toDate(project.dueDate), 'yyyy-MM-dd') : '');
    
    setEditingName(false);
    setEditingDescription(false);
    setEditingDueDate(false);
    
    setHasUnsavedChanges(false);
    toast.info('Changes discarded');
  };

  // Field blur handler (now just closes editing mode, no saving)
  const handleFieldBlur = (fieldName: string) => {
    switch (fieldName) {
      case 'name':
        setEditingName(false);
        break;
      case 'description':
        setEditingDescription(false);
        break;
      case 'dueDate':
        setEditingDueDate(false);
        break;
    }
  };

  // Quick Task Form
  const { register: registerTask, handleSubmit: handleTaskSubmit, formState: { errors: taskErrors, isSubmitting: taskSubmitting }, reset: resetTask } = useForm<QuickTaskFormData>({
    defaultValues: {
      priority: 'medium',
      dueDate: format(new Date(), 'yyyy-MM-dd'),
    },
  });

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

  const handleTaskClick = (taskId: string) => {
    navigate(`/tasks/${taskId}`);
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
            {editingName ? (
              <input
                className={`${styles.title} ${styles.titleInput}`}
                value={nameValue}
                onChange={(e) => setNameValue(e.target.value)}
                onBlur={() => handleFieldBlur('name')}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleFieldBlur('name');
                  }
                  if (e.key === 'Escape') {
                    setNameValue(project.name);
                    setEditingName(false);
                    setHasUnsavedChanges(false);
                  }
                }}
                autoFocus
              />
            ) : (
              <h1
                className={`${styles.title} ${styles.editable}`}
                onClick={() => setEditingName(true)}
              >
                {nameValue}
              </h1>
            )}
            <div className={styles.metadata}>
              {editingDueDate ? (
                <input
                  type="date"
                  className={styles.dateInput}
                  value={dueDateValue}
                  onChange={(e) => setDueDateValue(e.target.value)}
                  onBlur={() => handleFieldBlur('dueDate')}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleFieldBlur('dueDate');
                    }
                    if (e.key === 'Escape') {
                      setDueDateValue(project.dueDate ? format(toDate(project.dueDate), 'yyyy-MM-dd') : '');
                      setEditingDueDate(false);
                      setHasUnsavedChanges(false);
                    }
                  }}
                  autoFocus
                />
              ) : (
                <span className={`${styles.dueDate} ${styles.editable}`} onClick={() => setEditingDueDate(true)}>
                  <FiCalendar /> Due {dueDateValue ? format(new Date(dueDateValue), 'MMM dd, yyyy') : 'No date'}
                </span>
              )}
              <ProjectStatusDropdown
                currentStatus={project.status}
                onStatusChange={handleProjectStatusChange}
                size="medium"
              />
              <span className={styles.taskCount}>
                {tasks?.length || 0} {tasks?.length === 1 ? 'task' : 'tasks'}
              </span>
            </div>
          </div>
          
          <div className={styles.headerActions}>
            <Button
              variant="ghost"
              size="small"
              onClick={handleDelete}
            >
              <FiTrash2 /> Delete
            </Button>
          </div>
        </div>

        {/* Project Details */}
        <Card variant="elevated" padding="large" className={styles.detailsCard}>
          <div className={styles.details}>
            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>Description</h3>
              {editingDescription ? (
                <textarea
                  className={styles.descriptionInput}
                  value={descriptionValue}
                  onChange={(e) => setDescriptionValue(e.target.value)}
                  onBlur={() => handleFieldBlur('description')}
                  onKeyDown={(e) => {
                    if (e.key === 'Escape') {
                      setDescriptionValue(project.description || '');
                      setEditingDescription(false);
                      setHasUnsavedChanges(false);
                    }
                  }}
                  autoFocus
                  placeholder="Add project goals, scope, or important notes..."
                  rows={4}
                />
              ) : (
                <p
                  className={`${styles.description} ${descriptionValue ? styles.editable : styles.descriptionPlaceholder}`}
                  onClick={() => setEditingDescription(true)}
                >
                  {descriptionValue || 'Click to add description...'}
                </p>
              )}
            </div>

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
        </Card>

        {/* Floating Save Changes Button */}
        {hasUnsavedChanges && (
          <div className={styles.saveChangesBar}>
            <div className={styles.saveChangesContent}>
              <span className={styles.unsavedIndicator}>
                You have unsaved changes
              </span>
              <div className={styles.saveActions}>
                <Button
                  variant="ghost"
                  size="small"
                  onClick={handleDiscardChanges}
                  disabled={isSaving}
                >
                  Discard
                </Button>
                <Button
                  variant="primary"
                  size="small"
                  onClick={handleSaveAllChanges}
                  loading={isSaving}
                >
                  Save Changes
                </Button>
              </div>
            </div>
          </div>
        )}

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
                  onPriorityChange={handlePriorityChange}
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

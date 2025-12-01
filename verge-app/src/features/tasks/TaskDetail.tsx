import type { FC } from 'react';
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Timestamp } from 'firebase/firestore';
import { format, subDays, subWeeks, subMonths } from 'date-fns';
import { toast } from 'sonner';
import { FiEdit2, FiTrash2, FiSave, FiX, FiCalendar, FiTag, FiAlertCircle, FiStar } from 'react-icons/fi';
import { toDate, dateStringToLocalDate } from '@/shared/utils/dateHelpers';
import { AppLayout, Card, Button, Loader, EmptyState, Badge, SubtaskList, TaskStatusDropdown, PriorityDropdown } from '@/shared/components';
import { AIAssistPanel } from './components/AIAssistPanel';
import { useAuth } from '@/shared/hooks/useAuth';
import { useTask, useUpdateTask, useDeleteTask } from '@/shared/hooks/useTasks';
import { useProjects } from '@/shared/hooks/useProjects';
import { getUserSettings } from '@/lib/firebase/firestore';
import type { Subtask, UserSettings, TaskReminder } from '@/shared/types';
import type { TaskStatus } from '@/shared/components/TaskStatusDropdown';
import type { TaskPriority } from '@/shared/components/PriorityDropdown';
import styles from './TaskDetail.module.css';

interface TaskFormData {
  title: string;
  notes: string;
  dueDate: string;
  priority: 'low' | 'medium' | 'high';
  projectId: string;
  tags: string;
  status: 'todo' | 'in_progress' | 'done' | 'postponed';
  reminderEnabled: boolean;
  reminderAmount: number;
  reminderUnit: 'day' | 'week' | 'month';
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
  const [userSettings, setUserSettings] = useState<UserSettings | null>(null);
  const [isAIAssistOpen, setIsAIAssistOpen] = useState(false);
  const [showReminderFields, setShowReminderFields] = useState(false);

  // Queries
  const { data: task, isLoading, error } = useTask(taskId);
  const { data: projects } = useProjects(user?.uid || '');
  
  // Mutations
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();

  // Load user settings for advanced status feature
  useEffect(() => {
    const loadSettings = async () => {
      if (!user) return;
      try {
        const settings = await getUserSettings(user.uid);
        setUserSettings(settings);
      } catch (err) {
        console.error('Failed to load user settings:', err);
      }
    };
    loadSettings();
  }, [user]);

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
      reminderEnabled: false,
      reminderAmount: 1,
      reminderUnit: 'day',
    },
  });

  // Update form when task loads - use useEffect to avoid infinite loop
  useEffect(() => {
    if (task) {
      const hasReminder = task.reminder?.enabled || false;
      
      reset({
        title: task.title,
        notes: task.notes || '',
        dueDate: task.dueDate ? format(toDate(task.dueDate), 'yyyy-MM-dd') : '',
        priority: task.priority,
        projectId: task.projectId,
        tags: task.tags?.join(', ') || '',
        status: task.status,
        reminderEnabled: hasReminder,
        reminderAmount: task.reminder?.amount || 1,
        reminderUnit: task.reminder?.unit || 'day',
      });
    }
  }, [task, reset]);

  const onSubmit = async (data: TaskFormData) => {
    if (!taskId) return;

    try {
      const tags = data.tags?.trim()
        ? data.tags.split(',').map(tag => tag.trim()).filter(Boolean)
        : [];

      // Calculate reminder date if enabled
      let reminder: TaskReminder | undefined;
      if (data.reminderEnabled && data.reminderAmount > 0) {
        const dueDate = dateStringToLocalDate(data.dueDate);
        let reminderDate: Date;
        
        switch (data.reminderUnit) {
          case 'day':
            reminderDate = subDays(dueDate, data.reminderAmount);
            break;
          case 'week':
            reminderDate = subWeeks(dueDate, data.reminderAmount);
            break;
          case 'month':
            reminderDate = subMonths(dueDate, data.reminderAmount);
            break;
        }
        
        reminder = {
          enabled: true,
          amount: data.reminderAmount,
          unit: data.reminderUnit,
          reminderDate: Timestamp.fromDate(reminderDate),
        };
      }

      await updateTask.mutateAsync({
        id: taskId,
        title: data.title,
        notes: data.notes?.trim() || '', // Send empty string to clear field
        dueDate: Timestamp.fromDate(dateStringToLocalDate(data.dueDate)),
        priority: data.priority,
        projectId: data.projectId,
        tags: tags.length > 0 ? tags : [], // Send empty array to clear tags
        status: data.status,
        userId: user!.uid,
        ...(reminder && { reminder }), // Only include reminder if it exists
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

  // Subtask handlers
  const handleToggleSubtask = async (subtaskId: string) => {
    if (!task || !taskId) return;

    const updatedSubtasks = task.subtasks?.map(st =>
      st.id === subtaskId ? { ...st, completed: !st.completed } : st
    ) || [];

    // Advanced Status Logic: Auto-update task status based on subtask completion
    let newStatus: TaskStatus | undefined;
    const advancedStatusEnabled = userSettings?.advancedStatus !== false; // Default to true
    
    if (advancedStatusEnabled && updatedSubtasks.length > 0) {
      const completedCount = updatedSubtasks.filter(st => st.completed).length;
      const totalCount = updatedSubtasks.length;
      
      if (completedCount === totalCount) {
        // All subtasks complete → Done
        newStatus = 'done';
      } else if (completedCount > 0) {
        // Some subtasks complete → In Progress
        newStatus = 'in_progress';
      } else {
        // No subtasks complete
        // ONLY revert to "To Do" if task is currently "Done"
        // If task is "In Progress", keep it there (user might have unchecked a subtask)
        if (task.status === 'done') {
          newStatus = 'todo';
        }
        // If status is already 'in_progress' or 'todo', don't change it
      }
    }

    try {
      const updateData: {
        id: string;
        subtasks: Subtask[];
        userId: string;
        status?: TaskStatus;
      } = {
        id: taskId,
        subtasks: updatedSubtasks,
        userId: user!.uid,
      };
      
      // Include status update if Advanced Status changed it
      if (newStatus && newStatus !== task.status) {
        updateData.status = newStatus;
      }
      
      await updateTask.mutateAsync(updateData);
      
      // Show appropriate toast message
      if (newStatus && newStatus !== task.status) {
        toast.success(`Subtask updated! Task status changed to ${newStatus.replace('_', ' ')}`);
      }
    } catch (err) {
      console.error('Failed to toggle subtask:', err);
      toast.error('Failed to update subtask');
    }
  };

  const handleAddSubtask = async (title: string) => {
    if (!task || !taskId) return;

    const newSubtask: Subtask = {
      id: `subtask_${Date.now()}`,
      title,
      completed: false,
      order: task.subtasks?.length || 0,
    };

    const updatedSubtasks = [...(task.subtasks || []), newSubtask];

    // Advanced Status Logic: Check if status should change when adding first subtask
    let newStatus: TaskStatus | undefined;
    const advancedStatusEnabled = userSettings?.advancedStatus !== false; // Default to true
    
    if (advancedStatusEnabled && updatedSubtasks.length > 0) {
      const completedCount = updatedSubtasks.filter(st => st.completed).length;
      const totalCount = updatedSubtasks.length;
      
      // When adding the first subtask to a task with no subtasks
      if (task.subtasks?.length === 0 && task.status === 'todo') {
        // New subtask is incomplete, so if task was "To Do", keep it there
        // (no change needed)
      } else if (completedCount === 0 && totalCount > 0) {
        // All subtasks incomplete
        // ONLY revert to "To Do" if task is currently "Done"
        // If task is "In Progress", keep it there
        if (task.status === 'done') {
          newStatus = 'todo';
        }
      } else if (completedCount > 0 && completedCount < totalCount) {
        // Some subtasks complete → In Progress
        newStatus = 'in_progress';
      } else if (completedCount === totalCount) {
        // All subtasks complete → Done
        newStatus = 'done';
      }
    }

    try {
      const updateData: {
        id: string;
        subtasks: Subtask[];
        userId: string;
        status?: TaskStatus;
      } = {
        id: taskId,
        subtasks: updatedSubtasks,
        userId: user!.uid,
      };
      
      // Include status update if Advanced Status changed it
      if (newStatus && newStatus !== task.status) {
        updateData.status = newStatus;
      }
      
      await updateTask.mutateAsync(updateData);
      
      // Show appropriate toast message
      if (newStatus && newStatus !== task.status) {
        toast.success(`Subtask added! Task status changed to ${newStatus.replace('_', ' ')}`);
      } else {
        toast.success('Subtask added!');
      }
    } catch (err) {
      console.error('Failed to add subtask:', err);
      toast.error('Failed to add subtask');
    }
  };

  const handleDeleteSubtask = async (subtaskId: string) => {
    if (!task || !taskId) return;

    const updatedSubtasks = task.subtasks?.filter(st => st.id !== subtaskId) || [];

    // Advanced Status Logic: Update status when deleting subtasks
    let newStatus: TaskStatus | undefined;
    const advancedStatusEnabled = userSettings?.advancedStatus !== false; // Default to true
    
    if (advancedStatusEnabled) {
      if (updatedSubtasks.length === 0) {
        // No subtasks left - status doesn't auto-change
        // (user can manually set it)
      } else {
        const completedCount = updatedSubtasks.filter(st => st.completed).length;
        const totalCount = updatedSubtasks.length;
        
        if (completedCount === totalCount) {
          // All remaining subtasks complete → Done
          newStatus = 'done';
        } else if (completedCount > 0) {
          // Some subtasks complete → In Progress
          newStatus = 'in_progress';
        } else {
          // No subtasks complete
          // ONLY revert to "To Do" if task is currently "Done"
          // If task is "In Progress", keep it there
          if (task.status === 'done') {
            newStatus = 'todo';
          }
        }
      }
    }

    try {
      const updateData: {
        id: string;
        subtasks: Subtask[];
        userId: string;
        status?: TaskStatus;
      } = {
        id: taskId,
        subtasks: updatedSubtasks, // Always send array (empty or not)
        userId: user!.uid,
      };
      
      // Include status update if Advanced Status changed it
      if (newStatus && newStatus !== task.status) {
        updateData.status = newStatus;
      }
      
      await updateTask.mutateAsync(updateData);
      
      // Show appropriate toast message
      if (newStatus && newStatus !== task.status) {
        toast.success(`Subtask deleted! Task status changed to ${newStatus.replace('_', ' ')}`);
      } else {
        toast.success('Subtask deleted');
      }
    } catch (err) {
      console.error('Failed to delete subtask:', err);
      toast.error('Failed to delete subtask');
    }
  };

  const handleStatusChange = async (newStatus: TaskStatus) => {
    if (!task || !taskId) return;

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

  const handlePriorityChange = async (newPriority: TaskPriority) => {
    if (!task || !taskId) return;

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

  // AI Assist handler - accepts suggested subtasks
  const handleAcceptAISuggestions = async (subtaskTitles: string[]) => {
    if (!task || !taskId) return;

    // Create new subtasks from AI suggestions
    const newSubtasks: Subtask[] = subtaskTitles.map((title, index) => ({
      id: `subtask_${Date.now()}_${index}`,
      title,
      completed: false,
      order: (task.subtasks?.length || 0) + index,
    }));

    const updatedSubtasks = [...(task.subtasks || []), ...newSubtasks];

    try {
      await updateTask.mutateAsync({
        id: taskId,
        subtasks: updatedSubtasks,
        userId: user!.uid,
      });
      
      toast.success(`Added ${newSubtasks.length} subtask${newSubtasks.length > 1 ? 's' : ''} from AI suggestions!`);
    } catch (err) {
      console.error('Failed to add AI subtasks:', err);
      toast.error('Failed to add subtasks');
      throw err; // Re-throw so AI panel knows it failed
    }
  };

  const getProject = () => {
    return projects?.find(p => p.id === task?.projectId);
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
            <div className={styles.titleRow}>
              <TaskStatusDropdown
                currentStatus={task.status}
                onStatusChange={handleStatusChange}
                disabled={updateTask.isPending}
                size="large"
              />
              <h1 className={styles.title}>{isEditing ? 'Edit Task' : task.title}</h1>
            </div>
            <div className={styles.metadata}>
              {project && (
                <span className={styles.project}>
                  <FiTag /> {project.name}
                </span>
              )}
              <span className={styles.dueDate}>
                <FiCalendar /> Due {format(toDate(task.dueDate), 'MMM dd, yyyy')}
              </span>
              <PriorityDropdown
                currentPriority={task.priority}
                onPriorityChange={handlePriorityChange}
                size="medium"
              />
            </div>
          </div>
          
          {!isEditing && (
            <div className={styles.headerActions}>
              {/* AI Assist Button - only show if AI enabled in settings */}
              {userSettings?.aiEnabled !== false && (
                <Button
                  variant="primary"
                  size="small"
                  onClick={() => setIsAIAssistOpen(true)}
                >
                  <FiStar /> AI Assist
                </Button>
              )}
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

              {/* Reminder */}
              <div className={styles.formGroup}>
                <div className={styles.checkboxWrapper}>
                  <input
                    id="reminderEnabled"
                    type="checkbox"
                    className={styles.checkbox}
                    {...register('reminderEnabled')}
                    onChange={(e) => setShowReminderFields(e.target.checked)}
                  />
                  <label htmlFor="reminderEnabled" className={styles.checkboxLabel}>
                    Set a reminder for this task
                  </label>
                </div>
                
                {showReminderFields && (
                  <div className={styles.reminderFields}>
                    <span className={styles.reminderLabel}>Remind me</span>
                    <input
                      id="reminderAmount"
                      type="number"
                      min="1"
                      max="365"
                      className={styles.reminderInput}
                      {...register('reminderAmount', {
                        valueAsNumber: true,
                        min: { value: 1, message: 'Must be at least 1' },
                      })}
                    />
                    <select
                      id="reminderUnit"
                      className={styles.reminderSelect}
                      {...register('reminderUnit')}
                    >
                      <option value="day">day(s)</option>
                      <option value="week">week(s)</option>
                      <option value="month">month(s)</option>
                    </select>
                    <span className={styles.reminderLabel}>before due date</span>
                  </div>
                )}
                {errors.reminderAmount && showReminderFields && (
                  <span className={styles.error}>{errors.reminderAmount.message}</span>
                )}
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

              {/* Subtasks */}
              <div className={styles.section}>
                <SubtaskList
                  subtasks={task.subtasks || []}
                  onToggle={handleToggleSubtask}
                  onAdd={handleAddSubtask}
                  onDelete={handleDeleteSubtask}
                  disabled={updateTask.isPending}
                />
              </div>

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

      {/* AI Assist Panel */}
      <AIAssistPanel
        isOpen={isAIAssistOpen}
        onClose={() => setIsAIAssistOpen(false)}
        task={task}
        onAcceptSuggestions={handleAcceptAISuggestions}
      />
    </AppLayout>
  );
};

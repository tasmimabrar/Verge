import type { FC } from 'react';
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Timestamp } from 'firebase/firestore';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { FiTrash2, FiCalendar, FiTag, FiAlertCircle, FiStar } from 'react-icons/fi';
import { toDate, dateStringToLocalDate } from '@/shared/utils/dateHelpers';
import { AppLayout, Card, Button, Loader, EmptyState, Badge, SubtaskList, TaskStatusDropdown, PriorityDropdown } from '@/shared/components';
import { AIAssistPanel } from './components/AIAssistPanel';
import { useAuth } from '@/shared/hooks/useAuth';
import { useTask, useUpdateTask, useDeleteTask } from '@/shared/hooks/useTasks';
import { useProjects } from '@/shared/hooks/useProjects';
import { getUserSettings } from '@/lib/firebase/firestore';
import type { Subtask, UserSettings, Task } from '@/shared/types';
import type { TaskStatus } from '@/shared/components/TaskStatusDropdown';
import type { TaskPriority } from '@/shared/components/PriorityDropdown';
import styles from './TaskDetail.module.css';

/**
 * TaskDetail Component
 * 
 * Full task detail screen with inline editing.
 * Features:
 * - View all task details
 * - Inline editing for title, notes, due date, project
 * - Delete task with confirmation
 * - AI Assist panel
 * - Subtask management
 */
export const TaskDetail: FC = () => {
  const { id: taskId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [userSettings, setUserSettings] = useState<UserSettings | null>(null);
  const [isAIAssistOpen, setIsAIAssistOpen] = useState(false);
  
  // Inline editing states
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleValue, setTitleValue] = useState('');
  const [editingNotes, setEditingNotes] = useState(false);
  const [notesValue, setNotesValue] = useState('');
  const [editingDueDate, setEditingDueDate] = useState(false);
  const [dueDateValue, setDueDateValue] = useState('');
  const [editingProject, setEditingProject] = useState(false);
  const [projectValue, setProjectValue] = useState('');
  const [editingTags, setEditingTags] = useState(false);
  const [tagsValue, setTagsValue] = useState('');
  
  // Track unsaved changes
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

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

  // Initialize inline edit values when task loads - only reset on navigation (task ID change)
  // Removed !editingField conditions to allow local changes to persist in UI
  // Note: ESLint warnings about dependencies are intentional - we only want to reset on task ID change
  useEffect(() => {
    if (task) {
      setTitleValue(task.title);
    }
  }, [task?.id]); // Only run when task ID changes
  
  useEffect(() => {
    if (task) {
      setNotesValue(task.notes || '');
    }
  }, [task?.id]);
  
  useEffect(() => {
    if (task) {
      setDueDateValue(task.dueDate ? format(toDate(task.dueDate), 'yyyy-MM-dd') : '');
    }
  }, [task?.id]);
  
  useEffect(() => {
    if (task) {
      setProjectValue(task.projectId);
    }
  }, [task?.id]);

  useEffect(() => {
    if (task) {
      setTagsValue(task.tags ? task.tags.join(', ') : '');
    }
  }, [task?.id]);

  // Detect changes and mark as unsaved
  useEffect(() => {
    if (!task) return;
    
    const hasChanges = 
      titleValue !== task.title ||
      notesValue !== (task.notes || '') ||
      dueDateValue !== (task.dueDate ? format(toDate(task.dueDate), 'yyyy-MM-dd') : '') ||
      projectValue !== task.projectId ||
      tagsValue !== (task.tags ? task.tags.join(', ') : '');
    
    setHasUnsavedChanges(hasChanges);
  }, [task, titleValue, notesValue, dueDateValue, projectValue, tagsValue]);

  // Unified save handler - batches all changes into ONE Firebase write
  const handleSaveAllChanges = async () => {
    if (!task || !taskId || !hasUnsavedChanges) return;

    setIsSaving(true);

    try {
      // Build update object with only changed fields
      const updates: Partial<Task> & { id: string; userId: string } = {
        id: taskId,
        userId: user!.uid,
      };

      // Title validation and update
      if (titleValue !== task.title) {
        if (!titleValue.trim()) {
          toast.error('Title cannot be empty');
          setTitleValue(task.title);
          setIsSaving(false);
          return;
        }
        updates.title = titleValue.trim();
      }

      // Notes update
      if (notesValue !== (task.notes || '')) {
        updates.notes = notesValue.trim();
      }

      // Due date validation and update
      if (dueDateValue !== (task.dueDate ? format(toDate(task.dueDate), 'yyyy-MM-dd') : '')) {
        if (!dueDateValue) {
          toast.error('Due date is required');
          setDueDateValue(task.dueDate ? format(toDate(task.dueDate), 'yyyy-MM-dd') : '');
          setIsSaving(false);
          return;
        }
        updates.dueDate = Timestamp.fromDate(dateStringToLocalDate(dueDateValue));
      }

      // Project update
      if (projectValue !== task.projectId) {
        if (!projectValue) {
          toast.error('Project is required');
          setProjectValue(task.projectId);
          setIsSaving(false);
          return;
        }
        updates.projectId = projectValue;
      }

      // Tags update
      const newTags = tagsValue
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0);
      const currentTags = task.tags || [];
      const tagsChanged = JSON.stringify(newTags.sort()) !== JSON.stringify(currentTags.sort());
      
      if (tagsChanged) {
        updates.tags = newTags;
      }

      // Only save if there are actual changes
      if (Object.keys(updates).length > 2) { // More than just id and userId
        await updateTask.mutateAsync(updates);
        toast.success('Changes saved successfully!');
        setHasUnsavedChanges(false);
        
        // Close all editing modes
        setEditingTitle(false);
        setEditingNotes(false);
        setEditingDueDate(false);
        setEditingProject(false);
        setEditingTags(false);
      }
    } catch (err) {
      console.error('Failed to save changes:', err);
      toast.error('Failed to save changes. Please try again.');
      
      // Revert all values on error
      if (task) {
        setTitleValue(task.title);
        setNotesValue(task.notes || '');
        setDueDateValue(task.dueDate ? format(toDate(task.dueDate), 'yyyy-MM-dd') : '');
        setProjectValue(task.projectId);
        setTagsValue(task.tags ? task.tags.join(', ') : '');
      }
    } finally {
      setIsSaving(false);
    }
  };

  // Discard changes and revert to original values
  const handleDiscardChanges = () => {
    if (!task) return;
    
    setTitleValue(task.title);
    setNotesValue(task.notes || '');
    setDueDateValue(task.dueDate ? format(toDate(task.dueDate), 'yyyy-MM-dd') : '');
    setProjectValue(task.projectId);
    setTagsValue(task.tags ? task.tags.join(', ') : '');
    
    setEditingTitle(false);
    setEditingNotes(false);
    setEditingDueDate(false);
    setEditingProject(false);
    setEditingTags(false);
    
    setHasUnsavedChanges(false);
    toast.info('Changes discarded');
  };

  // Inline edit handlers (now just close editing mode, no saving)
  const handleFieldBlur = (fieldName: string) => {
    // Just close the editing mode, don't save
    switch (fieldName) {
      case 'title':
        setEditingTitle(false);
        break;
      case 'notes':
        setEditingNotes(false);
        break;
      case 'dueDate':
        setEditingDueDate(false);
        break;
      case 'project':
        setEditingProject(false);
        break;
      case 'tags':
        setEditingTags(false);
        break;
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

  // Get the currently displayed project (uses local projectValue to show unsaved changes)
  const getDisplayProject = () => {
    return projects?.find(p => p.id === projectValue);
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
              {editingTitle ? (
                <input
                  type="text"
                  className={`${styles.title} ${styles.titleInput}`}
                  value={titleValue}
                  onChange={(e) => setTitleValue(e.target.value)}
                  onBlur={() => handleFieldBlur('title')}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleFieldBlur('title');
                    }
                    if (e.key === 'Escape') {
                      setTitleValue(task.title);
                      setEditingTitle(false);
                      setHasUnsavedChanges(false);
                    }
                  }}
                  autoFocus
                />
              ) : (
                <h1
                  className={`${styles.title} ${styles.editable}`}
                  onClick={() => setEditingTitle(true)}
                  title="Click to edit"
                >
                  {titleValue}
                </h1>
              )}
            </div>
            <div className={styles.metadata}>
              {project && editingProject ? (
                <select
                  className={styles.projectSelect}
                  value={projectValue}
                  onChange={(e) => setProjectValue(e.target.value)}
                  onBlur={() => handleFieldBlur('project')}
                  autoFocus
                >
                  {projects?.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              ) : project ? (
                <span
                  className={`${styles.project} ${styles.editable}`}
                  onClick={() => setEditingProject(true)}
                  title="Click to change project"
                >
                  <FiTag /> {getDisplayProject()?.name || project.name}
                </span>
              ) : null}
              
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
                      setDueDateValue(task.dueDate ? format(toDate(task.dueDate), 'yyyy-MM-dd') : '');
                      setEditingDueDate(false);
                      setHasUnsavedChanges(false);
                    }
                  }}
                  autoFocus
                />
              ) : (
                <span
                  className={`${styles.dueDate} ${styles.editable}`}
                  onClick={() => setEditingDueDate(true)}
                  title="Click to change due date"
                >
                  <FiCalendar /> Due {dueDateValue ? format(new Date(dueDateValue), 'MMM dd, yyyy') : 'No date'}
                </span>
              )}
              
              <PriorityDropdown
                currentPriority={task.priority}
                onPriorityChange={handlePriorityChange}
                size="medium"
              />
            </div>
          </div>
          
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
              variant="ghost"
              size="small"
              onClick={handleDelete}
            >
              <FiTrash2 /> Delete
            </Button>
          </div>
        </div>

        {/* Content */}
        <Card variant="elevated" padding="large">
          {/* Notes */}
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Notes</h3>
            {editingNotes ? (
              <textarea
                className={`${styles.notes} ${styles.notesInput}`}
                value={notesValue}
                onChange={(e) => setNotesValue(e.target.value)}
                onBlur={() => handleFieldBlur('notes')}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') {
                    setNotesValue(task.notes || '');
                    setEditingNotes(false);
                    setHasUnsavedChanges(false);
                  }
                }}
                rows={6}
                autoFocus
                placeholder="Add detailed notes, context, or requirements..."
              />
            ) : (
              <p
                className={`${styles.notes} ${notesValue ? styles.editable : styles.notesPlaceholder}`}
                onClick={() => setEditingNotes(true)}
                title="Click to edit"
              >
                {notesValue || 'Click to add notes...'}
              </p>
            )}
          </div>

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
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Tags</h3>
            {editingTags ? (
              <input
                type="text"
                className={styles.tagsInput}
                value={tagsValue}
                onChange={(e) => setTagsValue(e.target.value)}
                onBlur={() => handleFieldBlur('tags')}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleFieldBlur('tags');
                  }
                  if (e.key === 'Escape') {
                    setTagsValue(task.tags ? task.tags.join(', ') : '');
                    setEditingTags(false);
                    setHasUnsavedChanges(false);
                  }
                }}
                autoFocus
                placeholder="Enter tags separated by commas (e.g., urgent, design, review)"
              />
            ) : (
              <div 
                className={`${styles.tags} ${tagsValue && tagsValue.trim().length > 0 ? styles.editable : styles.tagsPlaceholder}`}
                onClick={() => setEditingTags(true)}
              >
                {tagsValue && tagsValue.trim().length > 0 ? (
                  tagsValue.split(',').map((tag, index) => (
                    <Badge key={index} variant="default">
                      {tag.trim()}
                    </Badge>
                  ))
                ) : (
                  <span className={styles.placeholderText}>Click to add tags...</span>
                )}
              </div>
            )}
          </div>

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

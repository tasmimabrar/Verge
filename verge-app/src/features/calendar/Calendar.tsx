import type { FC } from 'react';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, isSameDay, addMonths, subMonths } from 'date-fns';
import { Timestamp } from 'firebase/firestore';
import { FiChevronLeft, FiChevronRight, FiCalendar, FiCheckCircle, FiCircle, FiClock, FiPause, FiPlus } from 'react-icons/fi';
import { AppLayout, Button, Card, Loader, EmptyState, TaskCard, TaskTooltip } from '@/shared/components';
import { useAuth } from '@/shared/hooks/useAuth';
import { useTasks, useUpdateTask, useCreateTask } from '@/shared/hooks/useTasks';
import { useProjects } from '@/shared/hooks/useProjects';
import { useDragAndDrop } from '@/shared/hooks/useDragAndDrop';
import { toDate } from '@/shared/utils/dateHelpers';
import type { Task } from '@/shared/types';
import type { TaskStatus } from '@/shared/components/TaskStatusDropdown';
import type { TaskPriority } from '@/shared/components/PriorityDropdown';
import { toast } from 'sonner';
import { DndContext, DragOverlay, useDraggable, useDroppable } from '@dnd-kit/core';
import styles from './Calendar.module.css';

/**
 * Calendar Component
 * 
 * Monthly calendar view showing tasks as priority-colored dots with status icons.
 * Core HCI requirement - 80% of survey respondents valued calendar view.
 * 
 * Features:
 * - Monthly grid layout (7 columns x 5-6 rows)
 * - Tasks shown as colored dots with status icons (priority color background, black icon)
 * - Click date to view tasks in side panel
 * - Month navigation (prev/next arrows, today button)
 * - Click task to navigate to detail
 */

/**
 * Get status icon based on task status  
 */
const renderStatusIcon = (status: string, className?: string) => {
  switch (status) {
    case 'done':
      return <FiCheckCircle className={className} />;
    case 'in_progress':
      return <FiClock className={className} />;
    case 'postponed':
      return <FiPause className={className} />;
    case 'todo':
    default:
      return <FiCircle className={className} />;
  }
};

/**
 * Draggable Task Dot - renders task indicator with drag functionality
 */
interface DraggableTaskDotProps {
  task: Task;
  onHover: (task: Task | null, rect: DOMRect | null) => void;
}

const DraggableTaskDot: FC<DraggableTaskDotProps> = ({ task, onHover }) => {
  const { attributes, listeners, setNodeRef } = useDraggable({
    id: `task-${task.id}`,
    data: { task },
  });
  
  const handleMouseEnter = (e: React.MouseEvent<HTMLSpanElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    onHover(task, rect);
  };
  
  const handleMouseLeave = () => {
    onHover(null, null);
  };
  
  return (
    <span
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      className={`${styles.taskDot} ${styles[`priority-${task.priority}`]}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {renderStatusIcon(task.status, styles.statusIcon)}
    </span>
  );
};

/**
 * Droppable Calendar Day - accepts task drops for rescheduling
 */
interface DroppableDayProps {
  date: Date;
  tasks: Task[];
  isCurrentMonth: boolean;
  isTodayDate: boolean;
  isSelected: boolean;
  onClick: () => void;
  onHover: (task: Task | null, rect: DOMRect | null) => void;
  isDragging: boolean;
}

const DroppableDay: FC<DroppableDayProps> = ({
  date,
  tasks,
  isCurrentMonth,
  isTodayDate,
  isSelected,
  onClick,
  onHover,
  isDragging,
}) => {
  const { setNodeRef, isOver } = useDroppable({
    id: `date-${date.toISOString()}`,
    data: { date },
  });
  
  return (
    <button
      ref={setNodeRef}
      type="button"
      className={`
        ${styles.dayCell}
        ${!isCurrentMonth ? styles.otherMonth : ''}
        ${isTodayDate ? styles.today : ''}
        ${isSelected ? styles.selected : ''}
        ${tasks.length > 0 ? styles.hasTasks : ''}
        ${isOver && isDragging ? styles.dropTarget : ''}
      `}
      onClick={onClick}
    >
      <span className={styles.dayNumber}>
        {format(date, 'd')}
      </span>
      
      {/* Task indicators - status icons with priority-colored backgrounds */}
      {tasks.length > 0 && (
        <div className={styles.taskIndicators}>
          {tasks.slice(0, 7).map(task => (
            <DraggableTaskDot key={task.id} task={task} onHover={onHover} />
          ))}
          {tasks.length > 7 && (
            <span className={styles.moreTasks}>
              +{tasks.length - 7}
            </span>
          )}
        </div>
      )}
    </button>
  );
};

interface QuickTaskFormData {
  title: string;
  priority: 'low' | 'medium' | 'high';
  projectId: string;
}

interface DateFormState {
  showForm: boolean;
  formData: Partial<QuickTaskFormData>;
}

export const Calendar: FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  
  // Store form state per date (keyed by date string)
  const [dateFormStates, setDateFormStates] = useState<Record<string, DateFormState>>({});
  
  // Hover tooltip state
  const [hoveredTask, setHoveredTask] = useState<Task | null>(null);
  const [tooltipAnchor, setTooltipAnchor] = useState<DOMRect | null>(null);

  // Fetch all user tasks and projects
  const { data: allTasks, isLoading } = useTasks(user?.uid || '');
  const { data: projects } = useProjects(user?.uid || '');
  
  // Mutations
  const updateTask = useUpdateTask();
  const createTask = useCreateTask();
  
  // Get date key for storing form state
  const getDateKey = (date: Date) => format(date, 'yyyy-MM-dd');
  
  // Get current date's form state
  const currentDateKey = selectedDate ? getDateKey(selectedDate) : '';
  const currentFormState = dateFormStates[currentDateKey] || { showForm: false, formData: {} };
  const showQuickAdd = currentFormState.showForm;
  
  // Toggle quick add form for current date
  const toggleQuickAdd = () => {
    if (!selectedDate) return;
    const dateKey = getDateKey(selectedDate);
    setDateFormStates(prev => ({
      ...prev,
      [dateKey]: {
        ...prev[dateKey],
        showForm: !prev[dateKey]?.showForm,
        formData: prev[dateKey]?.formData || {},
      },
    }));
  };
  
  // Update form data for current date
  const updateFormData = (data: Partial<QuickTaskFormData>) => {
    if (!selectedDate) return;
    const dateKey = getDateKey(selectedDate);
    setDateFormStates(prev => ({
      ...prev,
      [dateKey]: {
        ...prev[dateKey],
        showForm: prev[dateKey]?.showForm ?? false,
        formData: { ...prev[dateKey]?.formData, ...data },
      },
    }));
  };
  
  // Quick add task form
  const {
    register: registerTask,
    handleSubmit: handleTaskSubmit,
    formState: { errors: taskErrors, isSubmitting: taskSubmitting },
    setValue,
    getValues,
  } = useForm<QuickTaskFormData>({
    defaultValues: {
      priority: 'medium',
      projectId: '',
      title: '',
    },
  });
  
  // Load form data when selected date changes
  useEffect(() => {
    if (selectedDate) {
      const dateKey = getDateKey(selectedDate);
      const savedData = dateFormStates[dateKey]?.formData || {};
      
      // Load saved form data or use defaults
      setValue('title', savedData.title || '');
      setValue('projectId', savedData.projectId || '');
      setValue('priority', savedData.priority || 'medium');
    }
  }, [selectedDate, dateFormStates, setValue]);
  
  // Save form data whenever it changes
  const saveFormData = () => {
    if (!selectedDate) return;
    const currentData = getValues();
    updateFormData(currentData);
  };
  
  // Drag and drop setup
  const { sensors, handleDragStart, handleDragEnd, activeId, isDragging } = useDragAndDrop({
    onDragStart: () => {
      // Hide tooltip during drag
      setHoveredTask(null);
      setTooltipAnchor(null);
    },
    onDragEnd: async (activeId, overId) => {
      if (!overId || !user) return;
      
      // Extract task ID and target date
      const taskId = activeId.replace('task-', '');
      const targetDateStr = overId.replace('date-', '');
      
      try {
        const targetDate = new Date(targetDateStr);
        
        // Convert to Firestore Timestamp at noon to avoid timezone issues
        const targetTimestamp = Timestamp.fromDate(
          new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), 12, 0, 0)
        );
        
        await updateTask.mutateAsync({
          id: taskId,
          dueDate: targetTimestamp,
          userId: user.uid,
        });
        
        toast.success('Task rescheduled!');
      } catch (err) {
        console.error('Failed to reschedule task:', err);
        toast.error('Failed to reschedule task');
      }
    },
  });
  
  // Get active task for drag overlay
  const activeTask = activeId ? allTasks?.find(t => `task-${t.id}` === activeId) : null;

  // Get days to display in calendar
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  
  // Get all days in current month
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
  
  // Calculate offset for first day of month (0=Sunday, 6=Saturday)
  const firstDayOffset = monthStart.getDay();
  
  // Get tasks for a specific date
  const getTasksForDate = (date: Date): Task[] => {
    if (!allTasks) return [];
    
    return allTasks.filter(task => {
      const taskDate = toDate(task.dueDate);
      return isSameDay(taskDate, date);
    });
  };

  // Get tasks for selected date
  const selectedDateTasks = selectedDate ? getTasksForDate(selectedDate) : [];
  
  // Handle task hover
  const handleTaskHover = (task: Task | null, rect: DOMRect | null) => {
    setHoveredTask(task);
    setTooltipAnchor(rect);
  };

  // Navigate months
  const handlePreviousMonth = () => {
    setCurrentMonth(prev => subMonths(prev, 1));
    setSelectedDate(null);
  };

  const handleNextMonth = () => {
    setCurrentMonth(prev => addMonths(prev, 1));
    setSelectedDate(null);
  };

  const handleToday = () => {
    setCurrentMonth(new Date());
    setSelectedDate(new Date());
  };

  const handleDateClick = (date: Date) => {
    // Save current form data before switching
    if (selectedDate) {
      saveFormData();
    }
    
    // If clicking the same date, close the sidebar
    if (selectedDate && isSameDay(selectedDate, date)) {
      handleCloseSidePanel();
    } else {
      // Different date - switch to it (keep form state and open state)
      setSelectedDate(date);
    }
  };

  const handleCloseSidePanel = () => {
    // Save form data before closing
    if (selectedDate) {
      saveFormData();
    }
    setSelectedDate(null);
  };
  
  // Quick add task submission
  const onTaskSubmit = async (data: QuickTaskFormData) => {
    if (!user || !selectedDate) return;
    
    try {
      const dueDate = Timestamp.fromDate(
        new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate(), 12, 0, 0)
      );
      
      await createTask.mutateAsync({
        title: data.title,
        projectId: data.projectId,
        userId: user.uid,
        dueDate,
        priority: data.priority,
        status: 'todo',
        notes: '',
        subtasks: [],
        tags: [],
      });
      
      toast.success('Task created!');
      
      // Reset only title, keep project and priority for this date
      const newFormData = {
        title: '',
        projectId: data.projectId,
        priority: data.priority,
      };
      
      setValue('title', '');
      updateFormData(newFormData);
      
      // Keep form open
    } catch (err) {
      console.error('Failed to create task:', err);
      toast.error('Failed to create task');
    }
  };

  const handleStatusChange = async (taskId: string, newStatus: TaskStatus) => {
    if (!user) return;
    
    try {
      await updateTask.mutateAsync({
        id: taskId,
        status: newStatus,
        userId: user.uid,
      });
      toast.success('Task status updated!');
    } catch (err) {
      console.error('Failed to update task status:', err);
      toast.error('Failed to update task status');
    }
  };

  const handlePriorityChange = async (taskId: string, newPriority: TaskPriority) => {
    if (!user) return;
    
    try {
      await updateTask.mutateAsync({
        id: taskId,
        priority: newPriority,
        userId: user.uid,
      });
      toast.success('Task priority updated!');
    } catch (err) {
      console.error('Failed to update task priority:', err);
      toast.error('Failed to update task priority');
    }
  };

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <AppLayout>
        <div className={styles.container}>
          {/* Header */}
          <div className={styles.header}>
            <div className={styles.headerContent}>
              <h1 className={styles.title}>
                <FiCalendar /> Calendar
              </h1>
              <p className={styles.subtitle}>
                {format(currentMonth, 'MMMM yyyy')}
              </p>
            </div>
            
            <div className={styles.headerActions}>
              <Button variant="secondary" size="small" onClick={handleToday}>
                Today
              </Button>
              <div className={styles.monthNav}>
                <button
                  type="button"
                  className={styles.navButton}
                  onClick={handlePreviousMonth}
                  aria-label="Previous month"
                >
                  <FiChevronLeft />
                </button>
                <button
                  type="button"
                  className={styles.navButton}
                  onClick={handleNextMonth}
                  aria-label="Next month"
                >
                  <FiChevronRight />
                </button>
              </div>
            </div>
          </div>

          {/* Calendar Grid */}
          <div className={styles.calendarWrapper}>
            <Card variant="elevated" padding="large">
              {isLoading ? (
                <Loader variant="skeleton" count={5} />
              ) : (
                <div className={styles.calendar}>
                  {/* Day headers */}
                  <div className={styles.dayHeaders}>
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                      <div key={day} className={styles.dayHeader}>
                        {day}
                      </div>
                    ))}
                  </div>

                  {/* Calendar grid */}
                  <div className={styles.grid}>
                    {/* Empty cells for offset */}
                    {Array.from({ length: firstDayOffset }).map((_, index) => (
                      <div key={`empty-${index}`} className={styles.dayCell} />
                    ))}

                    {/* Days with tasks - using Droppable components */}
                    {daysInMonth.map(date => {
                      const tasks = getTasksForDate(date);
                      const isCurrentMonth = isSameMonth(date, currentMonth);
                      const isTodayDate = isToday(date);
                      const isSelected = selectedDate && isSameDay(date, selectedDate);

                      return (
                        <DroppableDay
                          key={date.toISOString()}
                          date={date}
                          tasks={tasks}
                          isCurrentMonth={isCurrentMonth}
                          isTodayDate={isTodayDate}
                          isSelected={!!isSelected}
                          onClick={() => handleDateClick(date)}
                          onHover={handleTaskHover}
                          isDragging={isDragging}
                        />
                      );
                    })}
                  </div>
                </div>
              )}
            </Card>
          </div>

          {/* Side Panel for Selected Date */}
          {selectedDate && (
            <div className={styles.sidePanel}>
              <Card variant="elevated" padding="large" className={styles.sidePanelCard}>
                <div className={styles.sidePanelHeader}>
                  <h2 className={styles.sidePanelTitle}>
                    {format(selectedDate, 'EEEE, MMMM d, yyyy')}
                  </h2>
                  <button
                    type="button"
                    className={styles.closeButton}
                    onClick={handleCloseSidePanel}
                    aria-label="Close"
                  >
                    ×
                  </button>
                </div>

                <div className={styles.sidePanelContent}>
                  {/* Quick Add Task Toggle */}
                  <div className={styles.quickAddToggle}>
                    <Button
                      variant={showQuickAdd ? "secondary" : "primary"}
                      size="small"
                      onClick={toggleQuickAdd}
                      fullWidth
                    >
                      <FiPlus /> {showQuickAdd ? "Cancel" : "Add Task"}
                    </Button>
                  </div>

                  {/* Quick Add Task Form */}
                  {showQuickAdd && (
                    <div className={styles.quickAddForm}>
                      <form onSubmit={handleTaskSubmit(onTaskSubmit)}>
                        <div className={styles.formRow}>
                          <input
                            type="text"
                            className={styles.titleInput}
                            placeholder="Task title..."
                            {...registerTask('title', {
                              required: 'Title is required',
                              minLength: { value: 3, message: 'Min 3 characters' },
                            })}
                            onChange={(e) => {
                              registerTask('title').onChange(e);
                              saveFormData();
                            }}
                            autoFocus
                          />
                        </div>
                        {taskErrors.title && <span className={styles.errorText}>{taskErrors.title.message}</span>}

                        <div className={styles.formRow}>
                          <select
                            className={styles.compactSelect}
                            {...registerTask('projectId', { required: 'Project required' })}
                            onChange={(e) => {
                              registerTask('projectId').onChange(e);
                              saveFormData();
                            }}
                          >
                            <option value="">Project...</option>
                            {projects?.map(project => (
                              <option key={project.id} value={project.id}>
                                {project.name}
                              </option>
                            ))}
                          </select>

                          <select
                            className={styles.compactSelect}
                            {...registerTask('priority')}
                            onChange={(e) => {
                              registerTask('priority').onChange(e);
                              saveFormData();
                            }}
                          >
                            <option value="low">Low</option>
                            <option value="medium">Medium</option>
                            <option value="high">High</option>
                          </select>
                        </div>
                        {taskErrors.projectId && <span className={styles.errorText}>{taskErrors.projectId.message}</span>}

                        <Button type="submit" variant="primary" size="small" loading={taskSubmitting} fullWidth>
                          Create Task
                        </Button>
                      </form>
                    </div>
                  )}

                  {/* Tasks Section Divider */}
                  {(showQuickAdd || selectedDateTasks.length > 0) && (
                    <div className={styles.sectionDivider} />
                  )}

                  {/* Existing Tasks */}
                  {selectedDateTasks.length === 0 && !showQuickAdd ? (
                    <EmptyState
                      title="No tasks"
                      message="No tasks scheduled for this date."
                      icon={<FiCalendar />}
                    />
                  ) : (
                    <div className={styles.tasksList}>
                      <div className={styles.tasksHeader}>
                        <p className={styles.tasksCount}>
                          {selectedDateTasks.length} {selectedDateTasks.length === 1 ? 'task' : 'tasks'}
                        </p>
                      </div>
                      {selectedDateTasks.map(task => (
                        <TaskCard
                          key={task.id}
                          task={task}
                          variant="preview"
                          onClick={() => navigate(`/tasks/${task.id}`)}
                          onStatusChange={handleStatusChange}
                          onPriorityChange={handlePriorityChange}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </Card>
            </div>
          )}
        </div>
        
        {/* Hover Tooltip */}
        <TaskTooltip
          task={hoveredTask!}
          anchorRect={tooltipAnchor}
          show={hoveredTask !== null && !isDragging}
        />
      </AppLayout>
      
      {/* Drag Overlay - positioned at cursor with offset */}
      <DragOverlay dropAnimation={null}>
        {activeTask && (
          <div className={styles.dragPreview}>
            <div className={styles.dragPreviewHeader}>
              <span className={`${styles.priorityBadge} ${styles[`priority-${activeTask.priority}`]}`}>
                {activeTask.priority}
              </span>
              <span className={`${styles.statusBadge} ${styles[`status-${activeTask.status.replace('_', '')}`]}`}>
                {renderStatusIcon(activeTask.status, styles.statusIconSmall)}
              </span>
            </div>
            <div className={styles.dragPreviewContent}>
              <h4 className={styles.dragPreviewTitle}>{activeTask.title}</h4>
              <div className={styles.dragPreviewMeta}>
                <FiCalendar className={styles.metaIcon} />
                <span>{format(toDate(activeTask.dueDate), 'MMM d, yyyy')}</span>
              </div>
            </div>
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
};

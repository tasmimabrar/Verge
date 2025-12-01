import type { FC } from 'react';
import { useState } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { AppLayout, Loader, EmptyState, TaskCard } from '@/shared/components';
import { useAuth } from '@/shared/hooks/useAuth';
import { useTasks, useUpdateTask } from '@/shared/hooks/useTasks';
import type { Task, TaskStatus } from '@/shared/types';
import { toast } from 'sonner';
import { FiAlertCircle } from 'react-icons/fi';
import { KanbanColumn } from './components/KanbanColumn/KanbanColumn';
import styles from './Kanban.module.css';

/**
 * Kanban Component
 * 
 * Drag-and-drop Kanban board view with four columns.
 * Allows users to visualize and manage tasks by status.
 * Features:
 * - 4 columns: To Do, In Progress, Done, Postponed
 * - Drag tasks between columns to change status
 * - Drag within columns to reorder
 * - Visual feedback during drag
 * - Task counts in column headers
 */
export const Kanban: FC = () => {
  const { user } = useAuth();
  const { data: tasks = [], isLoading, error } = useTasks(user?.uid || '');
  const updateTask = useUpdateTask();
  const [activeTask, setActiveTask] = useState<Task | null>(null);

  // DnD Kit sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Require 8px movement before drag starts (prevents accidental drags)
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Group tasks by status
  const tasksByStatus: Record<TaskStatus, Task[]> = {
    todo: tasks.filter(t => t.status === 'todo'),
    in_progress: tasks.filter(t => t.status === 'in_progress'),
    done: tasks.filter(t => t.status === 'done'),
    postponed: tasks.filter(t => t.status === 'postponed'),
  };

  const columns: { id: TaskStatus; title: string }[] = [
    { id: 'todo', title: 'To Do' },
    { id: 'in_progress', title: 'In Progress' },
    { id: 'done', title: 'Done' },
    { id: 'postponed', title: 'Postponed' },
  ];

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const task = tasks.find(t => t.id === active.id);
    if (task) {
      setActiveTask(task);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);

    if (!over || !user) return;

    const taskId = active.id as string;
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    // Determine new status from drop target
    const overId = over.id as string;
    let newStatus: TaskStatus | undefined;

    // Check if dropped on a column container
    if (columns.find(col => col.id === overId)) {
      newStatus = overId as TaskStatus;
    } else {
      // Dropped on another task - find which column that task is in
      const targetTask = tasks.find(t => t.id === overId);
      if (targetTask) {
        newStatus = targetTask.status;
      }
    }

    // Update task status if changed
    if (newStatus && newStatus !== task.status) {
      try {
        await updateTask.mutateAsync({
          id: taskId,
          status: newStatus,
          userId: user.uid,
        });
        toast.success(`Moved to ${columns.find(col => col.id === newStatus)?.title}`);
      } catch (err) {
        console.error('Failed to update task status:', err);
        toast.error('Failed to update task');
      }
    }

    // Handle reordering within same column (future enhancement)
    // For MVP, we're not persisting task order, just status changes
  };

  const handleStatusChange = async (taskId: string, newStatus: TaskStatus) => {
    if (!user) return;

    try {
      await updateTask.mutateAsync({
        id: taskId,
        status: newStatus,
        userId: user.uid,
      });
      toast.success(`Task status changed to ${newStatus.replace('_', ' ')}`);
    } catch (err) {
      console.error('Failed to update status:', err);
      toast.error('Failed to update task status');
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
  if (error) {
    return (
      <AppLayout>
        <div className={styles.container}>
          <EmptyState
            title="Failed to load tasks"
            message="There was an error loading your tasks. Please try again."
            icon={<FiAlertCircle />}
          />
        </div>
      </AppLayout>
    );
  }

  // Empty state - no tasks at all
  if (tasks.length === 0) {
    return (
      <AppLayout>
        <div className={styles.container}>
          <div className={styles.header}>
            <h1 className={styles.title}>Kanban Board</h1>
          </div>
          <EmptyState
            title="No tasks yet"
            message="Create your first task to get started with the Kanban board."
            icon={<FiAlertCircle />}
          />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className={styles.container}>
        {/* Header */}
        <div className={styles.header}>
          <h1 className={styles.title}>Kanban Board</h1>
          <p className={styles.subtitle}>
            Drag tasks between columns to update their status
          </p>
        </div>

        {/* Kanban Board */}
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className={styles.board}>
            {columns.map(column => (
              <KanbanColumn
                key={column.id}
                id={column.id}
                title={column.title}
                tasks={tasksByStatus[column.id]}
                onStatusChange={handleStatusChange}
              />
            ))}
          </div>

          {/* Drag Overlay - shows dragged task */}
          <DragOverlay>
            {activeTask ? (
              <div className={styles.dragOverlay}>
                <TaskCard task={activeTask} variant="preview" />
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>
    </AppLayout>
  );
};

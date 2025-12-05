/**
 * useDragAndDrop Hook
 * 
 * Reusable hook for drag-and-drop functionality using @dnd-kit.
 * Provides consistent sensors and collision detection across features.
 * 
 * Used in:
 * - Kanban board (drag tasks between columns)
 * - Calendar (drag tasks to reschedule dates)
 * - Any future drag-and-drop features
 * 
 * @example
 * const { sensors, handleDragStart, handleDragEnd, activeId } = useDragAndDrop({
 *   onDragStart: (id) => console.log('Started dragging', id),
 *   onDragEnd: async (id, overId) => {
 *     // Handle drop logic
 *     await updateTask({ id, newValue: overId });
 *   }
 * });
 * 
 * <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
 *   {children}
 * </DndContext>
 */

import { useState } from 'react';
import {
  useSensor,
  useSensors,
  PointerSensor,
  KeyboardSensor,
  type DragStartEvent,
  type DragEndEvent,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';

export interface UseDragAndDropOptions {
  /** Callback when drag starts */
  onDragStart?: (activeId: string) => void;
  
  /** Callback when drag ends - return false to cancel */
  onDragEnd?: (activeId: string, overId: string | null) => Promise<void> | void;
  
  /** Minimum pixels to move before drag starts (prevents accidental drags) */
  activationDistance?: number;
  
  /** Enable keyboard navigation for accessibility */
  enableKeyboard?: boolean;
}

export interface UseDragAndDropReturn {
  /** DnD Kit sensors configuration */
  sensors: ReturnType<typeof useSensors>;
  
  /** ID of currently dragged item */
  activeId: string | null;
  
  /** Drag start handler */
  handleDragStart: (event: DragStartEvent) => void;
  
  /** Drag end handler */
  handleDragEnd: (event: DragEndEvent) => void;
  
  /** Whether currently dragging */
  isDragging: boolean;
}

export const useDragAndDrop = ({
  onDragStart,
  onDragEnd,
  activationDistance = 8,
  enableKeyboard = true,
}: UseDragAndDropOptions = {}): UseDragAndDropReturn => {
  const [activeId, setActiveId] = useState<string | null>(null);

  // Configure sensors - must call hooks unconditionally
  const pointerSensor = useSensor(PointerSensor, {
    activationConstraint: {
      distance: activationDistance,
    },
  });

  const keyboardSensor = useSensor(KeyboardSensor, {
    coordinateGetter: sortableKeyboardCoordinates,
  });

  // Conditionally include sensors in array
  const sensors = useSensors(
    pointerSensor,
    ...(enableKeyboard ? [keyboardSensor] : [])
  );

  const handleDragStart = (event: DragStartEvent) => {
    const id = event.active.id as string;
    setActiveId(id);
    onDragStart?.(id);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    const activeIdValue = active.id as string;
    const overIdValue = over?.id as string | null;

    setActiveId(null);

    if (onDragEnd) {
      await onDragEnd(activeIdValue, overIdValue);
    }
  };

  return {
    sensors,
    activeId,
    handleDragStart,
    handleDragEnd,
    isDragging: activeId !== null,
  };
};

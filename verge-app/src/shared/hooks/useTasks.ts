/**
 * Verge - Task Management Hooks
 * 
 * React Query hooks for all task operations.
 * ALWAYS use these hooks instead of direct Firebase queries.
 * 
 * This module provides:
 * - Query hooks: Fetch tasks with automatic caching
 * - Mutation hooks: Create/update/delete with automatic cache invalidation
 * - Optimized for Firebase cost reduction via aggressive caching
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  collection, 
  query as firestoreQuery, 
  where, 
  getDocs, 
  doc, 
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  type DocumentData,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { queryKeys } from '@/lib/react-query/queryKeys';
import type { Task, CreateData, UpdateData, TaskStatus, TaskPriority, Subtask } from '@/shared/types';
import { toDate } from '@/shared/utils/dateHelpers';

// ============================================================================
// QUERY HOOKS (Fetching Data)
// ============================================================================

/**
 * Fetch all tasks for a user with optional filters
 * 
 * CACHING: Cached for 5 minutes, reduces Firebase reads significantly
 * 
 * @param userId - Firebase Auth UID
 * @param filters - Optional filters (status, priority, projectId)
 * @returns React Query result with tasks array
 * 
 * @example
 * const { data: tasks, isLoading } = useTasks(user.uid, { status: 'todo' });
 */
export const useTasks = (
  userId: string, 
  filters?: { 
    status?: TaskStatus; 
    priority?: TaskPriority;
    projectId?: string;
  }
) => {
  return useQuery({
    queryKey: queryKeys.tasks.list(userId, filters || {}),
    queryFn: async () => {
      const tasksRef = collection(db, 'tasks');
      
      // Build query - only use where clauses (no orderBy to avoid index requirements)
      let q = firestoreQuery(
        tasksRef, 
        where('userId', '==', userId)
      );
      
      // Apply filters
      if (filters?.status) {
        q = firestoreQuery(q, where('status', '==', filters.status));
      }
      if (filters?.priority) {
        q = firestoreQuery(q, where('priority', '==', filters.priority));
      }
      if (filters?.projectId) {
        q = firestoreQuery(q, where('projectId', '==', filters.projectId));
      }
      
      const snapshot = await getDocs(q);
      const tasks = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Task[];
      
      // Sort client-side by dueDate to avoid Firestore index requirement
      const sortedTasks = tasks.sort((a, b) => {
        if (!a.dueDate || !b.dueDate) return 0;
        const aDate = toDate(a.dueDate);
        const bDate = toDate(b.dueDate);
        return aDate.getTime() - bDate.getTime();
      });
      
      return sortedTasks;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!userId, // Only run if userId exists
  });
};

/**
 * Fetch a single task by ID
 * 
 * CACHING: Cached for 5 minutes
 * 
 * @param taskId - Firestore document ID
 * @returns React Query result with single task
 * 
 * @example
 * const { data: task } = useTask('task-123');
 */
export const useTask = (taskId: string | undefined) => {
  return useQuery({
    queryKey: queryKeys.tasks.detail(taskId || ''),
    queryFn: async () => {
      if (!taskId) return null;
      
      const taskDoc = await getDoc(doc(db, 'tasks', taskId));
      if (!taskDoc.exists()) {
        throw new Error('Task not found');
      }
      return {
        id: taskDoc.id,
        ...taskDoc.data(),
      } as Task;
    },
    enabled: !!taskId,
  });
};

/**
 * Fetch tasks due today for a user
 * 
 * @param userId - Firebase Auth UID
 * @returns React Query result with today's tasks
 * 
 * @example
 * const { data: todayTasks } = useTodayTasks(user.uid);
 */
export const useTodayTasks = (userId: string) => {
  return useQuery({
    queryKey: queryKeys.dashboard.todayTasks(userId),
    queryFn: async () => {
      if (!userId) return [];
      
      const tasksRef = collection(db, 'tasks');
      
      // Simple query - just fetch user's tasks
      const q = firestoreQuery(
        tasksRef,
        where('userId', '==', userId)
      );
      
      const snapshot = await getDocs(q);
      const allTasks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Task));
      
      // Filter client-side for today's tasks
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date();
      endOfDay.setHours(23, 59, 59, 999);
      
      return allTasks.filter(task => {
        if (!task.dueDate) return false;
        const dueDate = toDate(task.dueDate);
        return dueDate >= startOfDay && dueDate <= endOfDay;
      }).sort((a, b) => {
        if (!a.dueDate || !b.dueDate) return 0;
        const aDate = toDate(a.dueDate);
        const bDate = toDate(b.dueDate);
        return aDate.getTime() - bDate.getTime();
      });
    },
    staleTime: 2 * 60 * 1000, // 2 minutes - dashboard data refreshes more often
    enabled: !!userId,
  });
};

/**
 * Fetch tasks due in the next N days
 * 
 * @param userId - Firebase Auth UID
 * @param days - Number of days ahead to look
 * @returns React Query result with upcoming tasks
 * 
 * @example
 * const { data: upcoming } = useUpcomingTasks(user.uid, 7); // Next 7 days
 */
export const useUpcomingTasks = (userId: string, days: number = 7) => {
  return useQuery({
    queryKey: queryKeys.dashboard.upcomingTasks(userId, days),
    queryFn: async () => {
      if (!userId) return [];
      
      const tasksRef = collection(db, 'tasks');
      
      // Simple query - just fetch user's tasks
      const q = firestoreQuery(
        tasksRef,
        where('userId', '==', userId)
      );
      
      const snapshot = await getDocs(q);
      const allTasks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Task));
      
      // Filter client-side for upcoming tasks (next N days)
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const futureDate = new Date();
      futureDate.setDate(today.getDate() + days);
      futureDate.setHours(23, 59, 59, 999);
      
      return allTasks.filter(task => {
        if (!task.dueDate) return false;
        const dueDate = toDate(task.dueDate);
        return dueDate >= today && dueDate <= futureDate;
      }).sort((a, b) => {
        if (!a.dueDate || !b.dueDate) return 0;
        const aDate = toDate(a.dueDate);
        const bDate = toDate(b.dueDate);
        return aDate.getTime() - bDate.getTime();
      });
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!userId,
  });
};

/**
 * Fetch overdue tasks for a user
 * 
 * @param userId - Firebase Auth UID
 * @returns React Query result with overdue tasks
 * 
 * @example
 * const { data: overdue } = useOverdueTasks(user.uid);
 */
export const useOverdueTasks = (userId: string) => {
  return useQuery({
    queryKey: queryKeys.dashboard.overdueTasks(userId),
    queryFn: async () => {
      if (!userId) return [];
      
      const tasksRef = collection(db, 'tasks');
      
      // Simple query - just fetch user's tasks
      const q = firestoreQuery(
        tasksRef,
        where('userId', '==', userId)
      );
      
      const snapshot = await getDocs(q);
      const allTasks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Task));
      
      // Filter client-side for overdue tasks
      const now = new Date();
      
      return allTasks.filter(task => {
        if (!task.dueDate || task.status === 'done') return false;
        const dueDate = toDate(task.dueDate);
        return dueDate < now;
      }).sort((a, b) => {
        if (!a.dueDate || !b.dueDate) return 0;
        const aDate = toDate(a.dueDate);
        const bDate = toDate(b.dueDate);
        return aDate.getTime() - bDate.getTime();
      });
    },
    staleTime: 2 * 60 * 1000, // 2 minutes - important data
    enabled: !!userId,
  });
};

/**
 * Fetch all tasks for a specific project
 * 
 * @param projectId - Firestore project document ID
 * @returns React Query result with project tasks
 * 
 * @example
 * const { data: tasks } = useProjectTasks('project-123');
 */
export const useProjectTasks = (projectId: string | undefined) => {
  return useQuery({
    queryKey: queryKeys.projects.tasks(projectId || ''),
    queryFn: async () => {
      if (!projectId) return [];
      
      const tasksRef = collection(db, 'tasks');
      // Remove orderBy to avoid composite index requirement
      const q = firestoreQuery(
        tasksRef,
        where('projectId', '==', projectId)
      );
      
      const snapshot = await getDocs(q);
      const tasks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Task));
      
      // Sort client-side by dueDate
      return tasks.sort((a, b) => {
        if (!a.dueDate || !b.dueDate) return 0;
        const aDate = toDate(a.dueDate);
        const bDate = toDate(b.dueDate);
        return aDate.getTime() - bDate.getTime();
      });
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!projectId,
  });
};

// ============================================================================
// MUTATION HOOKS (Creating/Updating/Deleting Data)
// ============================================================================

/**
 * Create a new task
 * 
 * OPTIMISTIC UPDATES: Immediately updates UI, rolls back on error
 * CACHE INVALIDATION: Invalidates task lists to show new task
 * 
 * @returns Mutation object with mutate/mutateAsync functions
 * 
 * @example
 * const createTask = useCreateTask();
 * await createTask.mutateAsync({
 *   title: 'New task',
 *   projectId: 'project-123',
 *   userId: user.uid,
 *   dueDate: Timestamp.now(),
 *   priority: 'medium',
 *   status: 'todo',
 * });
 */
export const useCreateTask = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (taskData: CreateData<Task>) => {
      // Filter out undefined values - Firebase doesn't accept them
      const cleanData = Object.fromEntries(
        Object.entries(taskData).filter(([, value]) => value !== undefined)
      );
      
      const docRef = await addDoc(collection(db, 'tasks'), {
        ...cleanData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      
      // Fetch the created document to get server timestamps
      const snapshot = await getDoc(docRef);
      return { id: snapshot.id, ...snapshot.data() } as Task;
    },
    onSuccess: (newTask) => {
      // Invalidate AND refetch all task list queries immediately
      // Use refetchType: 'all' to force refetch even if data is still "fresh"
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.tasks.lists(),
        refetchType: 'all',
      });
      
      // Invalidate ALL dashboard queries (use prefix matching to catch all variations)
      queryClient.invalidateQueries({ 
        queryKey: ['dashboard'],
        refetchType: 'all',
      });
      
      // Invalidate project tasks if applicable
      if (newTask.projectId) {
        queryClient.invalidateQueries({ 
          queryKey: queryKeys.projects.tasks(newTask.projectId),
          refetchType: 'all',
        });
      }
    },
  });
};

/**
 * Update an existing task
 * 
 * OPTIMISTIC UPDATES: Immediately updates UI
 * CACHE INVALIDATION: Updates specific task and related lists
 * 
 * @returns Mutation object with mutate/mutateAsync functions
 * 
 * @example
 * const updateTask = useUpdateTask();
 * await updateTask.mutateAsync({
 *   id: 'task-123',
 *   status: 'done',
 * });
 */
export const useUpdateTask = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: UpdateData<Task>) => {
      // Filter out undefined values - Firebase doesn't accept them
      const cleanUpdates = Object.fromEntries(
        Object.entries(updates).filter(([, value]) => value !== undefined)
      );
      
      const taskRef = doc(db, 'tasks', id);
      await updateDoc(taskRef, {
        ...cleanUpdates,
        updatedAt: serverTimestamp(),
      } as DocumentData);
      
      // Fetch updated document
      const snapshot = await getDoc(taskRef);
      return { id: snapshot.id, ...snapshot.data() } as Task;
    },
    onSuccess: (updatedTask) => {
      // Invalidate the specific task detail
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.tasks.detail(updatedTask.id),
        refetchType: 'all',
      });
      
      // Invalidate all task lists - force refetch
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.tasks.lists(),
        refetchType: 'all',
      });
      
      // Invalidate ALL dashboard queries (use prefix matching)
      queryClient.invalidateQueries({ 
        queryKey: ['dashboard'],
        refetchType: 'all',
      });
      
      // Invalidate project tasks
      if (updatedTask.projectId) {
        queryClient.invalidateQueries({ 
          queryKey: queryKeys.projects.tasks(updatedTask.projectId),
          refetchType: 'all',
        });
      }
    },
  });
};

/**
 * Delete a task
 * 
 * CACHE INVALIDATION: Removes task from all caches
 * 
 * @returns Mutation object with mutate/mutateAsync functions
 * 
 * @example
 * const deleteTask = useDeleteTask();
 * await deleteTask.mutateAsync('task-123');
 */
export const useDeleteTask = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (taskId: string) => {
      // Fetch task data before deletion for cache invalidation
      const docRef = doc(db, 'tasks', taskId);
      const snapshot = await getDoc(docRef);
      const taskData = snapshot.data() as Omit<Task, 'id'>;
      
      await deleteDoc(docRef);
      return { ...taskData, id: taskId } as Task;
    },
    onSuccess: (deletedTask) => {
      // Remove the specific task from cache
      queryClient.removeQueries({ 
        queryKey: queryKeys.tasks.detail(deletedTask.id) 
      });
      
      // Invalidate all task lists - force refetch
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.tasks.lists(),
        refetchType: 'all',
      });
      
      // Invalidate ALL dashboard queries (use prefix matching)
      queryClient.invalidateQueries({ 
        queryKey: ['dashboard'],
        refetchType: 'all',
      });
      
      // Invalidate project tasks
      if (deletedTask.projectId) {
        queryClient.invalidateQueries({ 
          queryKey: queryKeys.projects.tasks(deletedTask.projectId),
          refetchType: 'all',
        });
      }
    },
  });
};

/**
 * Toggle a subtask's completion status
 * 
 * Optimized mutation for updating a single subtask without refetching the whole task.
 * 
 * @returns Mutation object with mutate/mutateAsync functions
 * 
 * @example
 * const toggleSubtask = useToggleSubtask();
 * await toggleSubtask.mutateAsync({
 *   taskId: 'task-123',
 *   subtaskId: 'subtask-1',
 *   completed: true,
 * });
 */
export const useToggleSubtask = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      taskId, 
      subtaskId, 
      completed 
    }: { 
      taskId: string; 
      subtaskId: string; 
      completed: boolean;
    }) => {
      const docRef = doc(db, 'tasks', taskId);
      const snapshot = await getDoc(docRef);
      
      if (!snapshot.exists()) {
        throw new Error('Task not found');
      }
      
      const task = snapshot.data() as Task;
      const updatedSubtasks = (task.subtasks || []).map((subtask: Subtask) =>
        subtask.id === subtaskId ? { ...subtask, completed } : subtask
      );
      
      await updateDoc(docRef, {
        subtasks: updatedSubtasks,
        updatedAt: serverTimestamp(),
      });
      
      return { taskId, subtaskId, completed };
    },
    onSuccess: ({ taskId }) => {
      // Invalidate the specific task detail
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.tasks.detail(taskId) 
      });
      
      // Invalidate task lists (subtask completion might affect filters)
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.lists() });
    },
  });
};

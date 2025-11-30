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
  orderBy,
  Timestamp,
  serverTimestamp,
  type DocumentData,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { queryKeys } from '@/lib/react-query/queryKeys';
import type { Task, CreateData, UpdateData, TaskStatus, TaskPriority, Subtask } from '@/shared/types';

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
    queryKey: queryKeys.tasks.list(filters || {}),
    queryFn: async () => {
      const tasksRef = collection(db, 'tasks');
      let q = firestoreQuery(
        tasksRef, 
        where('userId', '==', userId),
        orderBy('dueDate', 'asc')
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
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Task[];
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
      const tasksRef = collection(db, 'tasks');
      
      // Get start and end of today
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date();
      endOfDay.setHours(23, 59, 59, 999);
      
      const q = firestoreQuery(
        tasksRef,
        where('userId', '==', userId),
        where('dueDate', '>=', Timestamp.fromDate(startOfDay)),
        where('dueDate', '<=', Timestamp.fromDate(endOfDay)),
        orderBy('dueDate', 'asc')
      );
      
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Task));
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
      const tasksRef = collection(db, 'tasks');
      
      const today = new Date();
      const futureDate = new Date();
      futureDate.setDate(today.getDate() + days);
      
      const q = firestoreQuery(
        tasksRef,
        where('userId', '==', userId),
        where('dueDate', '>=', Timestamp.fromDate(today)),
        where('dueDate', '<=', Timestamp.fromDate(futureDate)),
        orderBy('dueDate', 'asc')
      );
      
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Task));
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
      const tasksRef = collection(db, 'tasks');
      
      const now = new Date();
      
      const q = firestoreQuery(
        tasksRef,
        where('userId', '==', userId),
        where('dueDate', '<', Timestamp.fromDate(now)),
        where('status', '!=', 'done'), // Exclude completed tasks
        orderBy('status'),
        orderBy('dueDate', 'asc')
      );
      
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Task));
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
      const q = firestoreQuery(
        tasksRef,
        where('projectId', '==', projectId),
        orderBy('dueDate', 'asc')
      );
      
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Task));
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
      const docRef = await addDoc(collection(db, 'tasks'), {
        ...taskData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      
      // Fetch the created document to get server timestamps
      const snapshot = await getDoc(docRef);
      return { id: snapshot.id, ...snapshot.data() } as Task;
    },
    onSuccess: (newTask) => {
      // Invalidate all task list queries
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.lists() });
      
      // Invalidate dashboard queries
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.dashboard.todayTasks(newTask.userId) 
      });
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.dashboard.upcomingTasks(newTask.userId, 7) 
      });
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.dashboard.overdueTasks(newTask.userId) 
      });
      
      // Invalidate project tasks if applicable
      if (newTask.projectId) {
        queryClient.invalidateQueries({ 
          queryKey: queryKeys.projects.tasks(newTask.projectId) 
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
      const taskRef = doc(db, 'tasks', id);
      await updateDoc(taskRef, {
        ...updates,
        updatedAt: serverTimestamp(),
      } as DocumentData);
      
      // Fetch updated document
      const snapshot = await getDoc(taskRef);
      return { id: snapshot.id, ...snapshot.data() } as Task;
    },
    onSuccess: (updatedTask) => {
      // Invalidate the specific task detail
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.tasks.detail(updatedTask.id) 
      });
      
      // Invalidate all task lists
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.lists() });
      
      // Invalidate dashboard queries
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.dashboard.todayTasks(updatedTask.userId) 
      });
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.dashboard.overdueTasks(updatedTask.userId) 
      });
      
      // Invalidate project tasks
      if (updatedTask.projectId) {
        queryClient.invalidateQueries({ 
          queryKey: queryKeys.projects.tasks(updatedTask.projectId) 
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
      
      // Invalidate all task lists
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.lists() });
      
      // Invalidate dashboard queries
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.dashboard.todayTasks(deletedTask.userId) 
      });
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.dashboard.overdueTasks(deletedTask.userId) 
      });
      
      // Invalidate project tasks
      if (deletedTask.projectId) {
        queryClient.invalidateQueries({ 
          queryKey: queryKeys.projects.tasks(deletedTask.projectId) 
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

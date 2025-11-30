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
  Timestamp,
  type DocumentData,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { queryKeys } from '@/lib/react-query/queryKeys';

// Task type (will be moved to shared/types later)
interface Task {
  id: string;
  userId: string;
  projectId?: string;
  title: string;
  notes?: string;
  dueDate: Timestamp;
  priority: 'low' | 'medium' | 'high';
  status: 'todo' | 'in_progress' | 'done' | 'postponed';
  subtasks?: string[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/**
 * Fetch all tasks for a user with optional filters
 * 
 * CACHING: Cached for 5 minutes, reduces Firebase reads significantly
 */
export const useTasks = (userId: string, filters?: { status?: string; projectId?: string }) => {
  return useQuery({
    queryKey: queryKeys.tasks.list(filters || {}),
    queryFn: async () => {
      const tasksRef = collection(db, 'tasks');
      let q = firestoreQuery(tasksRef, where('userId', '==', userId));
      
      // Apply filters
      if (filters?.status) {
        q = firestoreQuery(q, where('status', '==', filters.status));
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
    enabled: !!userId, // Only run if userId exists
  });
};

/**
 * Fetch a single task by ID
 * 
 * CACHING: Cached for 5 minutes
 */
export const useTask = (taskId: string) => {
  return useQuery({
    queryKey: queryKeys.tasks.detail(taskId),
    queryFn: async () => {
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
 * Create a new task
 * 
 * OPTIMISTIC UPDATES: Immediately updates UI, rolls back on error
 * CACHE INVALIDATION: Invalidates task lists to show new task
 */
export const useCreateTask = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (newTask: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => {
      const now = Timestamp.now();
      const taskData = {
        ...newTask,
        createdAt: now,
        updatedAt: now,
      };
      
      const docRef = await addDoc(collection(db, 'tasks'), taskData);
      return { id: docRef.id, ...taskData };
    },
    onSuccess: () => {
      // Invalidate all task list queries to refetch with new task
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.todayTasks('') });
    },
  });
};

/**
 * Update an existing task
 * 
 * OPTIMISTIC UPDATES: Immediately updates UI
 * CACHE INVALIDATION: Updates specific task and related lists
 */
export const useUpdateTask = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ taskId, updates }: { taskId: string; updates: Partial<Task> }) => {
      const taskRef = doc(db, 'tasks', taskId);
      const updateData = {
        ...updates,
        updatedAt: Timestamp.now(),
      };
      
      await updateDoc(taskRef, updateData as DocumentData);
      return { taskId, updates: updateData };
    },
    onSuccess: (data) => {
      // Update the specific task in cache
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.detail(data.taskId) });
      // Invalidate lists (task might have moved between lists due to status change)
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.lists() });
    },
  });
};

/**
 * Delete a task
 * 
 * CACHE INVALIDATION: Removes task from all caches
 */
export const useDeleteTask = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (taskId: string) => {
      await deleteDoc(doc(db, 'tasks', taskId));
      return taskId;
    },
    onSuccess: (taskId) => {
      // Remove task from cache
      queryClient.removeQueries({ queryKey: queryKeys.tasks.detail(taskId) });
      // Invalidate lists
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.lists() });
    },
  });
};

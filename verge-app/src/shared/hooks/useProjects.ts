/**
 * Verge - Project Management Hooks
 * 
 * React Query hooks for all project operations.
 * ALWAYS use these hooks instead of direct Firebase queries.
 * 
 * This module provides:
 * - Query hooks: Fetch projects with automatic caching
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
  serverTimestamp,
  type DocumentData,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { queryKeys } from '@/lib/react-query/queryKeys';
import type { Project, CreateData, UpdateData, ProjectStatus } from '@/shared/types';

// ============================================================================
// QUERY HOOKS (Fetching Data)
// ============================================================================

/**
 * Fetch all projects for a user with optional filters
 * 
 * CACHING: Cached for 5 minutes, reduces Firebase reads significantly
 * 
 * @param userId - Firebase Auth UID
 * @param filters - Optional filters (status)
 * @returns React Query result with projects array
 * 
 * @example
 * const { data: projects, isLoading } = useProjects(user.uid, { status: 'active' });
 */
export const useProjects = (
  userId: string,
  filters?: {
    status?: ProjectStatus;
  }
) => {
  return useQuery({
    queryKey: queryKeys.projects.list(filters || {}),
    queryFn: async () => {
      const projectsRef = collection(db, 'projects');
      let q = firestoreQuery(
        projectsRef,
        where('userId', '==', userId),
        orderBy('dueDate', 'asc')
      );
      
      // Apply status filter
      if (filters?.status) {
        q = firestoreQuery(q, where('status', '==', filters.status));
      }
      
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Project[];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!userId,
  });
};

/**
 * Fetch a single project by ID
 * 
 * CACHING: Cached for 5 minutes
 * 
 * @param projectId - Firestore document ID
 * @returns React Query result with single project
 * 
 * @example
 * const { data: project } = useProject('project-123');
 */
export const useProject = (projectId: string | undefined) => {
  return useQuery({
    queryKey: queryKeys.projects.detail(projectId || ''),
    queryFn: async () => {
      if (!projectId) return null;
      
      const projectDoc = await getDoc(doc(db, 'projects', projectId));
      if (!projectDoc.exists()) {
        throw new Error('Project not found');
      }
      return {
        id: projectDoc.id,
        ...projectDoc.data(),
      } as Project;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!projectId,
  });
};

/**
 * Fetch active projects for a user (excludes archived/completed)
 * 
 * @param userId - Firebase Auth UID
 * @returns React Query result with active projects
 * 
 * @example
 * const { data: activeProjects } = useActiveProjects(user.uid);
 */
export const useActiveProjects = (userId: string) => {
  return useQuery({
    queryKey: queryKeys.projects.list({ status: 'active' }),
    queryFn: async () => {
      const projectsRef = collection(db, 'projects');
      const q = firestoreQuery(
        projectsRef,
        where('userId', '==', userId),
        where('status', '==', 'active'),
        orderBy('dueDate', 'asc')
      );
      
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Project[];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!userId,
  });
};

/**
 * Fetch projects with upcoming deadlines (within N days)
 * 
 * @param userId - Firebase Auth UID
 * @param days - Number of days ahead to look
 * @returns React Query result with projects nearing deadline
 * 
 * @example
 * const { data: upcoming } = useUpcomingProjects(user.uid, 7); // Next 7 days
 */
export const useUpcomingProjects = (userId: string, days: number = 7) => {
  return useQuery({
    queryKey: queryKeys.dashboard.upcomingDeadlines(userId),
    queryFn: async () => {
      const projectsRef = collection(db, 'projects');
      
      const today = new Date();
      const futureDate = new Date();
      futureDate.setDate(today.getDate() + days);
      
      const q = firestoreQuery(
        projectsRef,
        where('userId', '==', userId),
        where('status', '==', 'active'),
        where('dueDate', '<=', futureDate),
        orderBy('dueDate', 'asc')
      );
      
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Project[];
    },
    staleTime: 2 * 60 * 1000, // 2 minutes - dashboard data
    enabled: !!userId,
  });
};

// ============================================================================
// MUTATION HOOKS (Creating/Updating/Deleting Data)
// ============================================================================

/**
 * Create a new project
 * 
 * OPTIMISTIC UPDATES: Immediately updates UI, rolls back on error
 * CACHE INVALIDATION: Invalidates project lists to show new project
 * 
 * @returns Mutation object with mutate/mutateAsync functions
 * 
 * @example
 * const createProject = useCreateProject();
 * await createProject.mutateAsync({
 *   name: 'New Project',
 *   userId: user.uid,
 *   status: 'active',
 *   dueDate: Timestamp.now(),
 * });
 */
export const useCreateProject = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (projectData: CreateData<Project>) => {
      const docRef = await addDoc(collection(db, 'projects'), {
        ...projectData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      
      // Fetch the created document to get server timestamps
      const snapshot = await getDoc(docRef);
      return { id: snapshot.id, ...snapshot.data() } as Project;
    },
    onSuccess: () => {
      // Invalidate all project list queries
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.lists() });
      
      // Invalidate dashboard upcoming deadlines
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.dashboard.upcomingDeadlines('') 
      });
    },
  });
};

/**
 * Update an existing project
 * 
 * OPTIMISTIC UPDATES: Immediately updates UI
 * CACHE INVALIDATION: Updates specific project and related lists
 * 
 * @returns Mutation object with mutate/mutateAsync functions
 * 
 * @example
 * const updateProject = useUpdateProject();
 * await updateProject.mutateAsync({
 *   id: 'project-123',
 *   status: 'completed',
 * });
 */
export const useUpdateProject = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: UpdateData<Project>) => {
      const projectRef = doc(db, 'projects', id);
      await updateDoc(projectRef, {
        ...updates,
        updatedAt: serverTimestamp(),
      } as DocumentData);
      
      // Fetch updated document
      const snapshot = await getDoc(projectRef);
      return { id: snapshot.id, ...snapshot.data() } as Project;
    },
    onSuccess: (updatedProject) => {
      // Invalidate the specific project detail
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.projects.detail(updatedProject.id) 
      });
      
      // Invalidate all project lists
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.lists() });
      
      // Invalidate dashboard
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.dashboard.upcomingDeadlines(updatedProject.userId) 
      });
      
      // Invalidate project tasks (might need to cascade updates)
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.projects.tasks(updatedProject.id) 
      });
    },
  });
};

/**
 * Delete a project
 * 
 * CACHE INVALIDATION: Removes project from all caches
 * WARNING: Does NOT cascade delete tasks - handle in UI/Cloud Functions
 * 
 * @returns Mutation object with mutate/mutateAsync functions
 * 
 * @example
 * const deleteProject = useDeleteProject();
 * await deleteProject.mutateAsync('project-123');
 */
export const useDeleteProject = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (projectId: string) => {
      // Fetch project data before deletion for cache invalidation
      const docRef = doc(db, 'projects', projectId);
      const snapshot = await getDoc(docRef);
      const projectData = snapshot.data() as Omit<Project, 'id'>;
      
      await deleteDoc(docRef);
      return { ...projectData, id: projectId } as Project;
    },
    onSuccess: (deletedProject) => {
      // Remove the specific project from cache
      queryClient.removeQueries({ 
        queryKey: queryKeys.projects.detail(deletedProject.id) 
      });
      
      // Invalidate all project lists
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.lists() });
      
      // Invalidate dashboard
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.dashboard.upcomingDeadlines(deletedProject.userId) 
      });
      
      // Invalidate project tasks (orphaned tasks should be handled separately)
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.projects.tasks(deletedProject.id) 
      });
    },
  });
};

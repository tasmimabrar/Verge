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
  serverTimestamp,
  type DocumentData,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { queryKeys } from '@/lib/react-query/queryKeys';
import type { Project, CreateData, UpdateData, ProjectStatus } from '@/shared/types';
import { toDate } from '@/shared/utils/dateHelpers';

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
    queryKey: queryKeys.projects.list(userId, filters || {}),
    queryFn: async () => {
      if (!userId) return [];
      
      const projectsRef = collection(db, 'projects');
      
      // Simple query - just fetch user's projects
      const q = firestoreQuery(
        projectsRef,
        where('userId', '==', userId)
      );
      
      const snapshot = await getDocs(q);
      const allProjects = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Project[];
      
      // Filter and sort client-side
      let result = allProjects;
      
      if (filters?.status) {
        result = result.filter(project => project.status === filters.status);
      }
      
      return result.sort((a, b) => {
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
    queryKey: queryKeys.projects.list(userId, { status: 'active' }),
    queryFn: async () => {
      if (!userId) return [];
      
      const projectsRef = collection(db, 'projects');
      
      // Simple query - fetch all user projects
      const q = firestoreQuery(
        projectsRef,
        where('userId', '==', userId)
      );
      
      const snapshot = await getDocs(q);
      const allProjects = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Project[];
      
      // Filter client-side for active projects and sort by dueDate
      return allProjects
        .filter(project => project.status === 'active')
        .sort((a, b) => {
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
      if (!userId) return [];
      
      const projectsRef = collection(db, 'projects');
      
      // Simple query - fetch user's projects
      const q = firestoreQuery(
        projectsRef,
        where('userId', '==', userId)
      );
      
      const snapshot = await getDocs(q);
      const allProjects = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Project[];
      
      // Filter client-side for upcoming active projects
      const today = new Date();
      const futureDate = new Date();
      futureDate.setDate(today.getDate() + days);
      
      return allProjects
        .filter(project => {
          if (project.status !== 'active' || !project.dueDate) return false;
          const dueDate = toDate(project.dueDate);
          return dueDate <= futureDate;
        })
        .sort((a, b) => {
          if (!a.dueDate || !b.dueDate) return 0;
          const aDate = toDate(a.dueDate);
          const bDate = toDate(b.dueDate);
          return aDate.getTime() - bDate.getTime();
        });
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
      // Filter out undefined values - Firebase doesn't accept them
      const cleanData = Object.fromEntries(
        Object.entries(projectData).filter(([, value]) => value !== undefined)
      );
      
      const docRef = await addDoc(collection(db, 'projects'), {
        ...cleanData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      
      // Fetch the created document to get server timestamps
      const snapshot = await getDoc(docRef);
      return { id: snapshot.id, ...snapshot.data() } as Project;
    },
    onSuccess: () => {
      // Invalidate AND refetch all project list queries immediately
      // Use refetchType: 'all' to force refetch even if data is still "fresh"
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.projects.lists(),
        refetchType: 'all',
      });
      
      // Invalidate ALL dashboard queries (use prefix matching to catch all variations)
      queryClient.invalidateQueries({ 
        queryKey: ['dashboard'],
        refetchType: 'all',
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
      // Filter out undefined values - Firebase doesn't accept them
      const cleanUpdates = Object.fromEntries(
        Object.entries(updates).filter(([, value]) => value !== undefined)
      );
      
      const projectRef = doc(db, 'projects', id);
      await updateDoc(projectRef, {
        ...cleanUpdates,
        updatedAt: serverTimestamp(),
      } as DocumentData);
      
      // Fetch updated document
      const snapshot = await getDoc(projectRef);
      return { id: snapshot.id, ...snapshot.data() } as Project;
    },
    onSuccess: (updatedProject) => {
      // Invalidate the specific project detail - force refetch
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.projects.detail(updatedProject.id),
        refetchType: 'all',
      });
      
      // Invalidate all project lists
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.projects.lists(),
        refetchType: 'all',
      });
      
      // Invalidate ALL dashboard queries (use prefix matching)
      queryClient.invalidateQueries({ 
        queryKey: ['dashboard'],
        refetchType: 'all',
      });
      
      // Invalidate project tasks (might need to cascade updates)
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.projects.tasks(updatedProject.id),
        refetchType: 'all',
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
      
      // Invalidate all project lists - force refetch
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.projects.lists(),
        refetchType: 'all',
      });
      
      // Invalidate ALL dashboard queries (use prefix matching)
      queryClient.invalidateQueries({ 
        queryKey: ['dashboard'],
        refetchType: 'all',
      });
      
      // Invalidate project tasks (orphaned tasks should be handled separately)
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.projects.tasks(deletedProject.id) 
      });
    },
  });
};

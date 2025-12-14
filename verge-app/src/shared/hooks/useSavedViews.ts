import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { doc, updateDoc, arrayUnion, arrayRemove, getDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { queryKeys } from '@/lib/react-query/queryKeys';
import type { SavedView, UserSettings } from '@/shared/types';
import { toast } from 'sonner';

/**
 * Fetch user's saved views from Firestore
 */
export const useSavedViews = (userId: string) => {
  return useQuery({
    queryKey: queryKeys.user.savedViews(userId),
    queryFn: async () => {
      const userDoc = await getDoc(doc(db, 'users', userId));
      const settings = userDoc.data()?.settings as UserSettings | undefined;
      return settings?.savedViews || [];
    },
    staleTime: 10 * 60 * 1000, // 10 minutes - views don't change often
    enabled: !!userId,
  });
};

/**
 * Create a new saved view
 */
export const useCreateSavedView = (userId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (newView: Omit<SavedView, 'id' | 'createdAt'>) => {
      const view: SavedView = {
        ...newView,
        id: crypto.randomUUID(),
        createdAt: new Date() as unknown as Timestamp,
      };

      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        'settings.savedViews': arrayUnion(view),
      });

      return view;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.user.savedViews(userId) });
      toast.success('View saved successfully');
    },
    onError: (error) => {
      console.error('Failed to save view:', error);
      toast.error('Failed to save view');
    },
  });
};

/**
 * Update an existing saved view
 */
export const useUpdateSavedView = (userId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ viewId, updates }: { viewId: string; updates: Partial<SavedView> }) => {
      // Fetch current views
      const userDoc = await getDoc(doc(db, 'users', userId));
      const settings = userDoc.data()?.settings as UserSettings | undefined;
      const currentViews = settings?.savedViews || [];

      // Update the specific view
      const updatedViews = currentViews.map((view) =>
        view.id === viewId ? { ...view, ...updates } : view
      );

      // Write back to Firestore
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        'settings.savedViews': updatedViews,
      });

      return updatedViews;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.user.savedViews(userId) });
      toast.success('View updated successfully');
    },
    onError: (error) => {
      console.error('Failed to update view:', error);
      toast.error('Failed to update view');
    },
  });
};

/**
 * Delete a saved view
 */
export const useDeleteSavedView = (userId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (viewId: string) => {
      // Fetch current views
      const userDoc = await getDoc(doc(db, 'users', userId));
      const settings = userDoc.data()?.settings as UserSettings | undefined;
      const currentViews = settings?.savedViews || [];

      // Find the view to delete
      const viewToDelete = currentViews.find((v) => v.id === viewId);
      if (!viewToDelete) {
        throw new Error('View not found');
      }

      // Remove from Firestore
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        'settings.savedViews': arrayRemove(viewToDelete),
      });

      return viewId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.user.savedViews(userId) });
      toast.success('View deleted successfully');
    },
    onError: (error) => {
      console.error('Failed to delete view:', error);
      toast.error('Failed to delete view');
    },
  });
};

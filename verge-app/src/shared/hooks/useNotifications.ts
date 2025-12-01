import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { collection, query, where, getDocs, addDoc, updateDoc, doc, orderBy, Timestamp, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { queryKeys } from '@/lib/react-query/queryKeys';
import type { Notification } from '@/shared/types';

/**
 * Fetch all notifications for a user
 */
export const useNotifications = (userId: string) => {
  return useQuery({
    queryKey: queryKeys.notifications.list(userId),
    queryFn: async (): Promise<Notification[]> => {
      if (!userId) throw new Error('User ID is required');

      const notificationsRef = collection(db, 'notifications');
      const q = query(
        notificationsRef,
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      );
      
      const snapshot = await getDocs(q);
      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Notification[];
    },
    staleTime: 1 * 60 * 1000, // 1 minute
    enabled: !!userId && userId.length > 0,
  });
};

/**
 * Fetch unread notifications count
 */
export const useUnreadNotificationsCount = (userId: string) => {
  return useQuery({
    queryKey: queryKeys.notifications.unread(userId),
    queryFn: async (): Promise<number> => {
      if (!userId) throw new Error('User ID is required');

      const notificationsRef = collection(db, 'notifications');
      const q = query(
        notificationsRef,
        where('userId', '==', userId),
        where('read', '==', false)
      );
      
      const snapshot = await getDocs(q);
      return snapshot.size;
    },
    staleTime: 1 * 60 * 1000, // 1 minute
    enabled: !!userId && userId.length > 0,
  });
};

/**
 * Mark notification as read
 */
export const useMarkNotificationAsRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (notificationId: string) => {
      const notificationRef = doc(db, 'notifications', notificationId);
      await updateDoc(notificationRef, {
        read: true,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.lists() });
    },
  });
};

/**
 * Mark all notifications as read
 */
export const useMarkAllNotificationsAsRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: string) => {
      const notificationsRef = collection(db, 'notifications');
      const q = query(
        notificationsRef,
        where('userId', '==', userId),
        where('read', '==', false)
      );
      
      const snapshot = await getDocs(q);
      const updates = snapshot.docs.map((doc) =>
        updateDoc(doc.ref, { read: true })
      );
      
      await Promise.all(updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.lists() });
    },
  });
};

/**
 * Delete notification
 */
export const useDeleteNotification = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (notificationId: string) => {
      await deleteDoc(doc(db, 'notifications', notificationId));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.lists() });
    },
  });
};

/**
 * Create a notification (typically called by server/background function)
 */
export const useCreateNotification = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (notification: Omit<Notification, 'id' | 'createdAt'>) => {
      const notificationsRef = collection(db, 'notifications');
      const docRef = await addDoc(notificationsRef, {
        ...notification,
        createdAt: Timestamp.now(),
      });
      return docRef.id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.lists() });
    },
  });
};

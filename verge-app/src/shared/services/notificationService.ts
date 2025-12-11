/**
 * Notification Generation Service
 * 
 * Automatically creates notifications for users based on task and project data.
 * This service should be called:
 * - On app load (check for overdue/upcoming tasks)
 * - When task due date changes
 * - When task is created with near-term due date
 * - Daily (via scheduled function or user login)
 */

import { 
  collection, 
  addDoc, 
  query, 
  where, 
  getDocs,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Task } from '@/shared/types';
import { toDate } from '@/shared/utils/dateHelpers';

/**
 * Get all existing unread notifications for a user (single query, used for batch checking)
 */
const getExistingNotifications = async (
  userId: string
): Promise<Set<string>> => {
  const notificationsRef = collection(db, 'notifications');
  const q = query(
    notificationsRef,
    where('userId', '==', userId),
    where('read', '==', false)
  );
  
  const snapshot = await getDocs(q);
  
  // Create a Set of "taskId-type" keys for quick lookup
  const existingKeys = new Set<string>();
  snapshot.docs.forEach(doc => {
    const data = doc.data();
    if (data.taskId && data.type) {
      existingKeys.add(`${data.taskId}-${data.type}`);
    }
  });
  
  return existingKeys;
};

/**
 * Check if a notification already exists using the pre-fetched set
 */
const notificationExists = (
  existingNotifications: Set<string>,
  taskId: string,
  type: 'reminder' | 'overdue'
): boolean => {
  return existingNotifications.has(`${taskId}-${type}`);
};

/**
 * Create a notification in Firestore
 */
const createNotification = async (
  userId: string,
  type: 'reminder' | 'overdue' | 'summary',
  title: string,
  message: string,
  link?: string,
  taskId?: string,
  projectId?: string
) => {
  const notificationsRef = collection(db, 'notifications');
  
  await addDoc(notificationsRef, {
    userId,
    type,
    title,
    message,
    taskId,
    projectId,
    link,
    read: false,
    createdAt: serverTimestamp(),
  });
};

/**
 * Generate deadline reminders for tasks due within 24 hours
 */
export const generateDeadlineReminders = async (userId: string): Promise<void> => {
  try {
    // Get existing notifications ONCE (optimization)
    const existingNotifications = await getExistingNotifications(userId);
    
    // Get all user's tasks that are not done
    const tasksRef = collection(db, 'tasks');
    const q = query(
      tasksRef,
      where('userId', '==', userId),
      where('status', '!=', 'done')
    );
    
    const snapshot = await getDocs(q);
    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    
    for (const doc of snapshot.docs) {
      const task = { id: doc.id, ...doc.data() } as Task;
      const dueDate = toDate(task.dueDate);
      
      // Check if task is due within 24 hours
      if (dueDate > now && dueDate <= tomorrow) {
        // Check if notification already exists (now O(1) lookup instead of query)
        const exists = notificationExists(existingNotifications, task.id, 'reminder');
        
        if (!exists) {
          const hoursUntil = Math.round((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60));
          
          await createNotification(
            userId,
            'reminder',
            `Task due in ${hoursUntil}h`,
            `"${task.title}" is due ${hoursUntil === 1 ? 'in 1 hour' : `in ${hoursUntil} hours`}`,
            `/tasks/${task.id}`,
            task.id,
            task.projectId
          );
        }
      }
    }
  } catch (error) {
    console.error('Error generating deadline reminders:', error);
    throw error;
  }
};

/**
 * Generate overdue notifications for tasks past their due date
 */
export const generateOverdueNotifications = async (userId: string): Promise<void> => {
  try {
    // Get existing notifications ONCE (optimization)
    const existingNotifications = await getExistingNotifications(userId);
    
    // Get all user's tasks that are not done
    const tasksRef = collection(db, 'tasks');
    const q = query(
      tasksRef,
      where('userId', '==', userId),
      where('status', '!=', 'done')
    );
    
    const snapshot = await getDocs(q);
    const now = new Date();
    
    for (const doc of snapshot.docs) {
      const task = { id: doc.id, ...doc.data() } as Task;
      const dueDate = toDate(task.dueDate);
      
      // Check if task is overdue
      if (dueDate < now) {
        // Check if notification already exists (now O(1) lookup instead of query)
        const exists = notificationExists(existingNotifications, task.id, 'overdue');
        
        if (!exists) {
          const daysOverdue = Math.floor((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
          
          await createNotification(
            userId,
            'overdue',
            `Task overdue`,
            `"${task.title}" was due ${daysOverdue === 0 ? 'today' : `${daysOverdue} day${daysOverdue > 1 ? 's' : ''} ago`}`,
            `/tasks/${task.id}`,
            task.id,
            task.projectId
          );
        }
      }
    }
  } catch (error) {
    console.error('Error generating overdue notifications:', error);
    throw error;
  }
};

/**
 * Generate weekly summary notification
 */
export const generateWeeklySummary = async (userId: string): Promise<void> => {
  try {
    // Get all user's tasks from the past week
    const tasksRef = collection(db, 'tasks');
    const q = query(
      tasksRef,
      where('userId', '==', userId)
    );
    
    const snapshot = await getDocs(q);
    const now = new Date();
    const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    
    let completedLastWeek = 0;
    let upcomingNextWeek = 0;
    
    snapshot.docs.forEach(doc => {
      const task = doc.data() as Task;
      const updatedAt = toDate(task.updatedAt);
      const dueDate = toDate(task.dueDate);
      
      // Count completed in last week
      if (task.status === 'done' && updatedAt >= lastWeek && updatedAt <= now) {
        completedLastWeek++;
      }
      
      // Count upcoming in next week
      if (task.status !== 'done' && dueDate >= now && dueDate <= nextWeek) {
        upcomingNextWeek++;
      }
    });
    
    await createNotification(
      userId,
      'summary',
      'Weekly Summary',
      `Last week: ${completedLastWeek} tasks completed. Coming up: ${upcomingNextWeek} tasks due this week.`,
      '/analytics'
    );
  } catch (error) {
    console.error('Error generating weekly summary:', error);
    throw error;
  }
};

/**
 * Run all notification generation checks
 * Should be called on app load or user login
 */
export const generateAllNotifications = async (userId: string): Promise<void> => {
  try {
    await Promise.all([
      generateDeadlineReminders(userId),
      generateOverdueNotifications(userId),
    ]);
  } catch (error) {
    console.error('Error generating notifications:', error);
    // Don't throw - we don't want to block app load if notifications fail
  }
};

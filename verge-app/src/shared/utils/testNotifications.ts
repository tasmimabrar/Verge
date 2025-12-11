/**
 * Test Notification Generator
 * 
 * Helper functions to create sample notifications for testing/development.
 * These should NOT be used in production - only for testing the UI.
 * 
 * Usage:
 * - Open browser console
 * - Import this file
 * - Call createTestNotifications(userId)
 */

import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';

/**
 * Create sample notifications for testing
 * 
 * @param userId - The user ID to create notifications for
 * @param count - Number of each type to create (default: 2)
 */
export const createTestNotifications = async (userId: string, count: number = 2): Promise<void> => {
  try {
    const notificationsRef = collection(db, 'notifications');
    
    // Sample reminder notifications
    const reminders = [
      {
        title: 'Task due soon',
        message: '"Complete project proposal" is due in 3 hours',
        link: '/tasks/test1',
        taskId: 'test1',
      },
      {
        title: 'Deadline approaching',
        message: '"Review design mockups" is due in 8 hours',
        link: '/tasks/test2',
        taskId: 'test2',
      },
      {
        title: 'Task reminder',
        message: '"Team meeting preparation" is due tomorrow',
        link: '/tasks/test3',
        taskId: 'test3',
      },
    ];
    
    // Sample overdue notifications
    const overdue = [
      {
        title: 'Task overdue',
        message: '"Submit expense report" was due 2 days ago',
        link: '/tasks/test4',
        taskId: 'test4',
      },
      {
        title: 'Overdue task',
        message: '"Update documentation" was due yesterday',
        link: '/tasks/test5',
        taskId: 'test5',
      },
    ];
    
    // Sample summary notifications
    const summaries = [
      {
        title: 'Weekly Summary',
        message: 'Last week: 12 tasks completed. Coming up: 8 tasks due this week.',
        link: '/analytics',
      },
      {
        title: 'Daily Summary',
        message: 'Today: 5 tasks completed, 3 in progress, 2 upcoming.',
        link: '/dashboard',
      },
    ];
    
    // Create notifications
    const createNotification = async (
      type: 'reminder' | 'overdue' | 'summary', 
      data: { title: string; message: string; link?: string; taskId?: string; projectId?: string }
    ) => {
      // Only include optional fields if they have values (Firestore doesn't allow undefined)
      const notification: Record<string, unknown> = {
        userId,
        type,
        title: data.title,
        message: data.message,
        read: false,
        createdAt: serverTimestamp(),
      };
      
      // Add optional fields only if defined
      if (data.link) notification.link = data.link;
      if (data.taskId) notification.taskId = data.taskId;
      if (data.projectId) notification.projectId = data.projectId;
      
      await addDoc(notificationsRef, notification);
    };
    
    // Create requested number of each type
    for (let i = 0; i < Math.min(count, reminders.length); i++) {
      await createNotification('reminder', reminders[i]);
    }
    
    for (let i = 0; i < Math.min(count, overdue.length); i++) {
      await createNotification('overdue', overdue[i]);
    }
    
    for (let i = 0; i < Math.min(count, summaries.length); i++) {
      await createNotification('summary', summaries[i]);
    }
    
    console.log(`✅ Created ${count * 3} test notifications for user ${userId}`);
  } catch (error) {
    console.error('❌ Failed to create test notifications:', error);
    throw error;
  }
};

/**
 * Delete all notifications for a user (cleanup)
 */
export const clearAllNotifications = async (userId: string): Promise<void> => {
  try {
    const { query, where, getDocs, deleteDoc, doc } = await import('firebase/firestore');
    const notificationsRef = collection(db, 'notifications');
    const q = query(notificationsRef, where('userId', '==', userId));
    
    const snapshot = await getDocs(q);
    
    await Promise.all(
      snapshot.docs.map(docSnap => deleteDoc(doc(db, 'notifications', docSnap.id)))
    );
    
    console.log(`✅ Deleted ${snapshot.size} notifications for user ${userId}`);
  } catch (error) {
    console.error('❌ Failed to clear notifications:', error);
    throw error;
  }
};

/**
 * Add this to window for easy console access (development only)
 */
if (typeof window !== 'undefined' && import.meta.env.DEV) {
  interface WindowWithTestHelpers extends Window {
    createTestNotifications: typeof createTestNotifications;
    clearAllNotifications: typeof clearAllNotifications;
  }
  
  (window as unknown as WindowWithTestHelpers).createTestNotifications = createTestNotifications;
  (window as unknown as WindowWithTestHelpers).clearAllNotifications = clearAllNotifications;
  
  console.log('📢 Test notification helpers loaded:');
  console.log('  - window.createTestNotifications(userId, count)');
  console.log('  - window.clearAllNotifications(userId)');
}

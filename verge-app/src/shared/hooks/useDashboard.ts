/**
 * Verge - Dashboard Statistics Hooks
 * 
 * React Query hooks for calculating and caching dashboard statistics.
 * These hooks aggregate data from tasks and projects for the dashboard view.
 * 
 * This module provides:
 * - Aggregated stats: Total tasks, completion rates, overdue counts
 * - Cached calculations: Reduces Firebase reads and computation
 * - Real-time updates: Automatically refetches when underlying data changes
 */

import { useQuery } from '@tanstack/react-query';
import { 
  collection, 
  query as firestoreQuery, 
  where, 
  getDocs,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { queryKeys } from '@/lib/react-query/queryKeys';
import type { DashboardStats, Task } from '@/shared/types';
import { toDate } from '@/shared/utils/dateHelpers';

// ============================================================================
// DASHBOARD STATISTICS HOOKS
// ============================================================================

/**
 * Calculate comprehensive dashboard statistics for a user
 * 
 * Aggregates task data to provide:
 * - Total active tasks count
 * - In-progress tasks count
 * - Completed this week count
 * - Due today count
 * - Overdue count
 * - Breakdown by priority (high, medium, low)
 * - Breakdown by status (todo, in_progress, done, postponed)
 * 
 * CACHING: Cached for 2 minutes (dashboard data refreshes frequently)
 * PERFORMANCE: Single Firebase query aggregated in memory
 * 
 * @param userId - Firebase Auth UID
 * @returns React Query result with DashboardStats object
 * 
 * @example
 * const { data: stats, isLoading } = useDashboardStats(user.uid);
 * // stats.totalTasks, stats.overdue, stats.byPriority.high, etc.
 */
export const useDashboardStats = (userId: string) => {
  return useQuery({
    queryKey: queryKeys.dashboard.stats(userId),
    queryFn: async () => {
      if (!userId) {
        throw new Error('User ID is required');
      }
      
      // Fetch all active tasks (not done) for the user
      const tasksRef = collection(db, 'tasks');
      const q = firestoreQuery(
        tasksRef,
        where('userId', '==', userId)
      );
      
      const snapshot = await getDocs(q);
      const tasks = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Task[];
      
      // Calculate current date boundaries
      const now = new Date();
      const startOfToday = new Date(now);
      startOfToday.setHours(0, 0, 0, 0);
      const endOfToday = new Date(now);
      endOfToday.setHours(23, 59, 59, 999);
      
      // Calculate start of week (for completed this week)
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay()); // Sunday
      startOfWeek.setHours(0, 0, 0, 0);
      
      // Initialize stats object
      const stats: DashboardStats = {
        totalTasks: 0,
        inProgress: 0,
        completedThisWeek: 0,
        dueToday: 0,
        overdue: 0,
        byPriority: {
          high: 0,
          medium: 0,
          low: 0,
        },
        byStatus: {
          todo: 0,
          inProgress: 0,
          done: 0,
          postponed: 0,
        },
      };
      
      // Aggregate task data
      tasks.forEach((task) => {
        const dueDate = toDate(task.dueDate);
        const updatedDate = toDate(task.updatedAt);
        
        // Count by status
        if (task.status === 'todo') stats.byStatus.todo++;
        else if (task.status === 'in_progress') {
          stats.byStatus.inProgress++;
          stats.inProgress++;
        }
        else if (task.status === 'done') stats.byStatus.done++;
        else if (task.status === 'postponed') stats.byStatus.postponed++;
        
        // Count by priority (only for active tasks)
        if (task.status !== 'done') {
          if (task.priority === 'high') stats.byPriority.high++;
          else if (task.priority === 'medium') stats.byPriority.medium++;
          else if (task.priority === 'low') stats.byPriority.low++;
          
          stats.totalTasks++;
        }
        
        // Count tasks due today
        if (dueDate >= startOfToday && dueDate <= endOfToday && task.status !== 'done') {
          stats.dueToday++;
        }
        
        // Count overdue tasks (past due date, not done)
        if (dueDate < now && task.status !== 'done') {
          stats.overdue++;
        }
        
        // Count tasks completed this week
        if (task.status === 'done' && updatedDate >= startOfWeek) {
          stats.completedThisWeek++;
        }
      });
      
      return stats;
    },
    staleTime: 2 * 60 * 1000, // 2 minutes - dashboard data should be relatively fresh
    enabled: !!userId && userId.length > 0, // Only run if userId is valid
  });
};

/**
 * Get task completion percentage for a user
 * 
 * Calculates: (completed tasks / total tasks) * 100
 * 
 * @param userId - Firebase Auth UID
 * @returns React Query result with completion percentage (0-100)
 * 
 * @example
 * const { data: completionRate } = useCompletionRate(user.uid);
 * // completionRate: 67.5
 */
export const useCompletionRate = (userId: string) => {
  return useQuery({
    queryKey: [...queryKeys.dashboard.stats(userId), 'completion-rate'],
    queryFn: async () => {
      if (!userId) {
        throw new Error('User ID is required');
      }
      
      const tasksRef = collection(db, 'tasks');
      const q = firestoreQuery(
        tasksRef,
        where('userId', '==', userId)
      );
      
      const snapshot = await getDocs(q);
      const tasks = snapshot.docs.map(doc => doc.data()) as Task[];
      
      const totalTasks = tasks.length;
      const completedTasks = tasks.filter(task => task.status === 'done').length;
      
      if (totalTasks === 0) return 0;
      
      return Math.round((completedTasks / totalTasks) * 100);
    },
    staleTime: 5 * 60 * 1000, // 5 minutes - less critical than main stats
    enabled: !!userId && userId.length > 0,
  });
};

/**
 * Get productivity trend data (tasks completed per day for last N days)
 * 
 * Returns array of [date, count] pairs for charting
 * Useful for productivity graphs and trend analysis
 * 
 * @param userId - Firebase Auth UID
 * @param days - Number of days of history to fetch
 * @returns React Query result with daily completion counts
 * 
 * @example
 * const { data: trend } = useProductivityTrend(user.uid, 7);
 * // trend: [['2025-11-24', 3], ['2025-11-25', 5], ...]
 */
export const useProductivityTrend = (userId: string, days: number = 7) => {
  return useQuery({
    queryKey: [...queryKeys.dashboard.stats(userId), 'trend', days],
    queryFn: async () => {
      if (!userId) {
        throw new Error('User ID is required');
      }
      
      const tasksRef = collection(db, 'tasks');
      
      // Calculate date range
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - days);
      startDate.setHours(0, 0, 0, 0);
      
      const q = firestoreQuery(
        tasksRef,
        where('userId', '==', userId),
        where('status', '==', 'done'),
        where('updatedAt', '>=', Timestamp.fromDate(startDate))
      );
      
      const snapshot = await getDocs(q);
      const tasks = snapshot.docs.map(doc => doc.data()) as Task[];
      
      // Group tasks by completion date
      const dailyCounts: Record<string, number> = {};
      
      // Initialize all dates in range with 0
      for (let i = 0; i < days; i++) {
        const date = new Date(startDate);
        date.setDate(startDate.getDate() + i);
        const dateKey = date.toISOString().split('T')[0];
        dailyCounts[dateKey] = 0;
      }
      
      // Count completed tasks per day
      tasks.forEach((task) => {
        const completionDate = toDate(task.updatedAt);
        const dateKey = completionDate.toISOString().split('T')[0];
        if (dailyCounts[dateKey] !== undefined) {
          dailyCounts[dateKey]++;
        }
      });
      
      // Convert to array of [date, count] pairs
      return Object.entries(dailyCounts).map(([date, count]) => [date, count] as [string, number]);
    },
    staleTime: 10 * 60 * 1000, // 10 minutes - historical data doesn't change often
    enabled: !!userId && userId.length > 0,
  });
};

/**
 * Get current focus score (percentage of high-priority tasks completed)
 * 
 * Measures how well the user is focusing on important tasks
 * Formula: (high priority completed / total high priority) * 100
 * 
 * @param userId - Firebase Auth UID
 * @returns React Query result with focus score (0-100)
 * 
 * @example
 * const { data: focusScore } = useFocusScore(user.uid);
 * // focusScore: 85 (85% of high-priority tasks are complete)
 */
export const useFocusScore = (userId: string) => {
  return useQuery({
    queryKey: [...queryKeys.dashboard.stats(userId), 'focus-score'],
    queryFn: async () => {
      if (!userId) {
        throw new Error('User ID is required');
      }
      
      const tasksRef = collection(db, 'tasks');
      const q = firestoreQuery(
        tasksRef,
        where('userId', '==', userId),
        where('priority', '==', 'high')
      );
      
      const snapshot = await getDocs(q);
      const highPriorityTasks = snapshot.docs.map(doc => doc.data()) as Task[];
      
      const totalHighPriority = highPriorityTasks.length;
      const completedHighPriority = highPriorityTasks.filter(
        task => task.status === 'done'
      ).length;
      
      if (totalHighPriority === 0) return 100; // No high-priority tasks = perfect focus!
      
      return Math.round((completedHighPriority / totalHighPriority) * 100);
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!userId && userId.length > 0,
  });
};

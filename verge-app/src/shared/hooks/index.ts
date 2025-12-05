export { useAuth } from './useAuth';
export { useScrollAnimation } from './useScrollAnimation';
export { useInfiniteScroll } from './useInfiniteScroll';

// Task management hooks
export {
  useTasks,
  useTask,
  useTodayTasks,
  useUpcomingTasks,
  useOverdueTasks,
  useProjectTasks,
  useCreateTask,
  useUpdateTask,
  useDeleteTask,
  useToggleSubtask,
} from './useTasks';

// Project management hooks
export {
  useProjects,
  useProject,
  useActiveProjects,
  useUpcomingProjects,
  useCreateProject,
  useUpdateProject,
  useDeleteProject,
} from './useProjects';

// Dashboard statistics hooks
export {
  useDashboardStats,
  useCompletionRate,
  useProductivityTrend,
  useFocusScore,
} from './useDashboard';

// Notification hooks
export {
  useNotifications,
  useUnreadNotificationsCount,
  useMarkNotificationAsRead,
  useMarkAllNotificationsAsRead,
  useDeleteNotification,
  useCreateNotification,
} from './useNotifications';

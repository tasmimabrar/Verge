/**
 * React Query Keys
 * 
 * Centralized query key management for consistent caching and invalidation.
 * Organized by feature domain for easy cache management.
 * 
 * Pattern: [domain, ...identifiers]
 * Example: ['tasks', userId, { status: 'active' }]
 */

export const queryKeys = {
  // User queries
  user: {
    all: ['user'] as const,
    detail: (userId: string) => ['user', userId] as const,
    settings: (userId: string) => ['user', userId, 'settings'] as const,
  },
  
  // Task queries
  tasks: {
    all: ['tasks'] as const,
    lists: () => ['tasks', 'list'] as const,
    list: (userId: string, filters: Record<string, unknown>) => ['tasks', 'list', userId, filters] as const,
    detail: (taskId: string) => ['tasks', 'detail', taskId] as const,
    byProject: (userId: string, projectId: string) => ['tasks', 'project', userId, projectId] as const,
  },
  
  // Project queries
  projects: {
    all: ['projects'] as const,
    lists: () => ['projects', 'list'] as const,
    list: (userId: string, filters: Record<string, unknown>) => ['projects', 'list', userId, filters] as const,
    detail: (projectId: string) => ['projects', 'detail', projectId] as const,
    tasks: (projectId: string) => ['projects', 'tasks', projectId] as const,
  },
  
  // Dashboard queries
  dashboard: {
    stats: (userId: string) => ['dashboard', 'stats', userId] as const,
    todayTasks: (userId: string) => ['dashboard', 'today-tasks', userId] as const,
    upcomingTasks: (userId: string, days: number) => ['dashboard', 'upcoming-tasks', userId, days] as const,
    upcomingDeadlines: (userId: string) => ['dashboard', 'upcoming-deadlines', userId] as const,
    overdueTasks: (userId: string) => ['dashboard', 'overdue-tasks', userId] as const,
  },
} as const;

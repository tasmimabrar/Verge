/**
 * Verge - Data Models & Types
 * 
 * All TypeScript interfaces and types for the application.
 * These match the Firebase Firestore structure.
 */

import type { Timestamp } from 'firebase/firestore';

// ============================================================================
// ENUMS (using const objects for verbatimModuleSyntax compatibility)
// ============================================================================

/**
 * Task status represents the current state of a task
 */
export const TaskStatus = {
  TODO: 'todo',
  IN_PROGRESS: 'in_progress',
  DONE: 'done',
  POSTPONED: 'postponed',
} as const;

export type TaskStatus = typeof TaskStatus[keyof typeof TaskStatus];

/**
 * Task priority levels
 */
export const TaskPriority = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
} as const;

export type TaskPriority = typeof TaskPriority[keyof typeof TaskPriority];

/**
 * Project status
 */
export const ProjectStatus = {
  ACTIVE: 'active',
  ON_HOLD: 'on_hold',
  COMPLETED: 'completed',
  ARCHIVED: 'archived',
} as const;

export type ProjectStatus = typeof ProjectStatus[keyof typeof ProjectStatus];

/**
 * AI suggestion types
 */
export const AISuggestionType = {
  SUBTASK: 'subtask',
  PRIORITY: 'priority',
  RESCHEDULE: 'reschedule',
  CONFLICT: 'conflict',
} as const;

export type AISuggestionType = typeof AISuggestionType[keyof typeof AISuggestionType];

// ============================================================================
// USER TYPES
// ============================================================================

/**
 * User settings stored in Firestore
 */
export interface UserSettings {
  /** Theme preference: light or dark mode */
  theme: 'light' | 'dark';
  
  /** Whether AI Assist features are enabled */
  aiEnabled: boolean;
  
  /** Whether collaboration features are enabled */
  collaborationEnabled?: boolean;
  
  /** Notification preferences */
  notifications: {
    deadlineReminders: boolean;
    dailySummary: boolean;
    conflictAlerts: boolean;
  };
  
  /** Default view when opening the app */
  defaultView: 'dashboard' | 'tasks' | 'projects' | 'calendar';
}

/**
 * User profile stored in Firestore users collection
 */
export interface User {
  /** Firebase Auth UID */
  uid: string;
  
  /** User's email address */
  email: string;
  
  /** Display name */
  displayName: string;
  
  /** Avatar URL (optional) */
  avatar?: string;
  
  /** User preferences and settings */
  settings: UserSettings;
  
  /** Account creation timestamp */
  createdAt: Timestamp;
  
  /** Last updated timestamp */
  updatedAt: Timestamp;
}

// ============================================================================
// PROJECT TYPES
// ============================================================================

/**
 * Project represents a collection of related tasks
 */
export interface Project {
  /** Firestore document ID */
  id: string;
  
  /** Owner user ID (Firebase Auth UID) */
  userId: string;
  
  /** Project name */
  name: string;
  
  /** Project description (optional) */
  description?: string;
  
  /** Project due date */
  dueDate: Timestamp;
  
  /** Project status */
  status: ProjectStatus;
  
  /** Project color for visual identification (hex color) */
  color?: string;
  
  /** Creation timestamp */
  createdAt: Timestamp;
  
  /** Last updated timestamp */
  updatedAt: Timestamp;
}

// ============================================================================
// TASK TYPES
// ============================================================================

/**
 * Subtask represents a checklist item within a task
 */
export interface Subtask {
  /** Unique ID within the task */
  id: string;
  
  /** Subtask title/description */
  title: string;
  
  /** Whether the subtask is completed */
  completed: boolean;
  
  /** Order/position in the list */
  order: number;
}

/**
 * AI suggestion for task improvements
 */
export interface AISuggestion {
  /** Unique ID for the suggestion */
  id: string;
  
  /** Type of suggestion */
  type: AISuggestionType;
  
  /** The actual suggestion text or data */
  suggestion: string;
  
  /** Reasoning/explanation for the suggestion */
  reasoning: string;
  
  /** Whether the user accepted the suggestion */
  accepted: boolean;
  
  /** When the suggestion was generated */
  timestamp: Timestamp;
}

/**
 * Task represents a single actionable item
 */
export interface Task {
  /** Firestore document ID */
  id: string;
  
  /** Parent project ID (references Project.id) */
  projectId: string;
  
  /** Owner user ID (Firebase Auth UID) */
  userId: string;
  
  /** Task title */
  title: string;
  
  /** Detailed notes/description (optional) */
  notes?: string;
  
  /** Task due date */
  dueDate: Timestamp;
  
  /** Task priority level */
  priority: TaskPriority;
  
  /** Current task status */
  status: TaskStatus;
  
  /** List of subtasks (optional) */
  subtasks?: Subtask[];
  
  /** Tags for categorization (optional) */
  tags?: string[];
  
  /** AI-generated suggestions (optional) */
  aiSuggestions?: AISuggestion[];
  
  /** Estimated effort in minutes (optional) */
  estimatedEffort?: number;
  
  /** Creation timestamp */
  createdAt: Timestamp;
  
  /** Last updated timestamp */
  updatedAt: Timestamp;
}

// ============================================================================
// DASHBOARD TYPES
// ============================================================================

/**
 * Dashboard statistics calculated from tasks
 */
export interface DashboardStats {
  /** Total active tasks (not done or archived) */
  totalTasks: number;
  
  /** Tasks currently in progress */
  inProgress: number;
  
  /** Tasks completed this week */
  completedThisWeek: number;
  
  /** Tasks due today */
  dueToday: number;
  
  /** Tasks past their due date */
  overdue: number;
  
  /** Tasks by priority breakdown */
  byPriority: {
    high: number;
    medium: number;
    low: number;
  };
  
  /** Tasks by status breakdown */
  byStatus: {
    todo: number;
    inProgress: number;
    done: number;
    postponed: number;
  };
}

// ============================================================================
// FORM TYPES (for React Hook Form)
// ============================================================================

/**
 * Form data for creating a new task
 */
export interface CreateTaskFormData {
  title: string;
  notes?: string;
  dueDate: string; // ISO date string from date input
  priority: TaskPriority;
  projectId: string;
  tags?: string; // Comma-separated string, parsed to array
}

/**
 * Form data for creating a new project
 */
export interface CreateProjectFormData {
  name: string;
  description?: string;
  dueDate: string; // ISO date string from date input
  status: ProjectStatus;
  color?: string;
}

/**
 * Form data for updating user settings
 */
export interface UpdateSettingsFormData {
  displayName: string;
  theme: 'light' | 'dark';
  aiEnabled: boolean;
  notifications: {
    deadlineReminders: boolean;
    dailySummary: boolean;
    conflictAlerts: boolean;
  };
  defaultView: 'dashboard' | 'tasks' | 'projects' | 'calendar';
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

/**
 * Generic Firebase document with ID
 */
export interface FirebaseDocument {
  id: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/**
 * Omit Firebase-managed fields for create operations
 */
export type CreateData<T extends FirebaseDocument> = Omit<T, 'id' | 'createdAt' | 'updatedAt'>;

/**
 * Partial update data (all fields optional except ID)
 */
export type UpdateData<T extends FirebaseDocument> = Partial<Omit<T, 'id' | 'createdAt' | 'updatedAt'>> & {
  id: string;
};

// ============================================================================
// TYPE GUARDS
// ============================================================================

/**
 * Check if a value is a valid TaskStatus
 */
export const isTaskStatus = (value: string): value is TaskStatus => {
  return Object.values(TaskStatus).includes(value as TaskStatus);
};

/**
 * Check if a value is a valid TaskPriority
 */
export const isTaskPriority = (value: string): value is TaskPriority => {
  return Object.values(TaskPriority).includes(value as TaskPriority);
};

/**
 * Check if a value is a valid ProjectStatus
 */
export const isProjectStatus = (value: string): value is ProjectStatus => {
  return Object.values(ProjectStatus).includes(value as ProjectStatus);
};

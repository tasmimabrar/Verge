import type { FC } from 'react';
import type { DashboardWidgetType } from '@/shared/types';
import { StatsWidget } from './StatsWidget';
import { TodaysPrioritiesWidget } from './TodaysPrioritiesWidget';
import { UpcomingDeadlinesWidget } from './UpcomingDeadlinesWidget';
import { OverdueTasksWidget } from './OverdueTasksWidget';

export { StatsWidget } from './StatsWidget';
export { TodaysPrioritiesWidget } from './TodaysPrioritiesWidget';
export { UpcomingDeadlinesWidget } from './UpcomingDeadlinesWidget';
export { OverdueTasksWidget } from './OverdueTasksWidget';

/**
 * Widget Registry - Maps widget types to their components
 */
export const WIDGET_REGISTRY: Record<
  DashboardWidgetType,
  FC<{ config?: Record<string, unknown> }>
> = {
  'stats': StatsWidget,
  'todays-priorities': TodaysPrioritiesWidget,
  'upcoming-deadlines': UpcomingDeadlinesWidget,
  'overdue-tasks': OverdueTasksWidget,
};

/**
 * Widget Metadata - Display names and descriptions
 */
export const WIDGET_METADATA: Record<
  DashboardWidgetType,
  { name: string; description: string }
> = {
  'stats': {
    name: 'Stats Overview',
    description: 'Four stat cards showing today, in progress, completed, and overdue tasks',
  },
  'todays-priorities': {
    name: "Today's Priorities",
    description: 'Tasks due today with quick status updates',
  },
  'upcoming-deadlines': {
    name: 'Upcoming Deadlines',
    description: 'Tasks and projects with approaching due dates',
  },
  'overdue-tasks': {
    name: 'Overdue Tasks',
    description: 'Tasks that have passed their due date',
  },
};

/**
 * Default dashboard layout
 */
export const DEFAULT_DASHBOARD_LAYOUT: DashboardWidgetType[] = [
  'stats',
  'todays-priorities',
  'upcoming-deadlines',
  'overdue-tasks',
];

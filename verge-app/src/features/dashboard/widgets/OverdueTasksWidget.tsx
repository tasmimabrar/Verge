import type { FC } from 'react';
import { OverdueTasks } from '../components/OverdueTasks';

export interface OverdueTasksWidgetProps {
  config?: Record<string, unknown>;
}

/**
 * OverdueTasksWidget - Wrapper for OverdueTasks component
 */
export const OverdueTasksWidget: FC<OverdueTasksWidgetProps> = () => {
  return <OverdueTasks />;
};

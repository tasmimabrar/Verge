import type { FC } from 'react';
import { UpcomingDeadlines } from '../components/UpcomingDeadlines';

export interface UpcomingDeadlinesWidgetProps {
  config?: Record<string, unknown>;
}

/**
 * UpcomingDeadlinesWidget - Wrapper for UpcomingDeadlines component
 */
export const UpcomingDeadlinesWidget: FC<UpcomingDeadlinesWidgetProps> = () => {
  return <UpcomingDeadlines />;
};

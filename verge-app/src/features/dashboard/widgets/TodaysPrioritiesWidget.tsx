import type { FC } from 'react';
import { TodaysPriorities } from '../components/TodaysPriorities';

export interface TodaysPrioritiesWidgetProps {
  config?: Record<string, unknown>;
}

/**
 * TodaysPrioritiesWidget - Wrapper for TodaysPriorities component
 */
export const TodaysPrioritiesWidget: FC<TodaysPrioritiesWidgetProps> = () => {
  return <TodaysPriorities />;
};

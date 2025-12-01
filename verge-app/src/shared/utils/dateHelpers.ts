/**
 * Date Helper Utilities
 * 
 * Utility functions for handling dates and Firestore Timestamps
 */

import type { Timestamp } from 'firebase/firestore';

/**
 * Safely convert a Timestamp or Date to a Date object
 * Handles both Firestore Timestamps and native Date objects
 * Also handles serialized Timestamps from React Query cache
 */
export const toDate = (value: Timestamp | Date | undefined | null): Date => {
  // Handle null/undefined - return current date as fallback
  if (!value) {
    return new Date();
  }
  
  // Already a Date object
  if (value instanceof Date) {
    return value;
  }
  
  // Firestore Timestamp - check if it has toDate method
  if (typeof value === 'object' && 'toDate' in value && typeof value.toDate === 'function') {
    return value.toDate();
  }
  
  // Handle serialized Timestamp from React Query cache
  // When cached, Timestamps become plain objects with { seconds, nanoseconds }
  if (typeof value === 'object' && 'seconds' in value && typeof value.seconds === 'number') {
    const timestamp = value as { seconds: number; nanoseconds: number };
    // Convert seconds to milliseconds and add nanoseconds
    return new Date(timestamp.seconds * 1000 + timestamp.nanoseconds / 1000000);
  }
  
  // Fallback - try to parse as date string or return current date
  try {
    const parsed = new Date(value as unknown as string);
    if (!isNaN(parsed.getTime())) {
      return parsed;
    }
  } catch {
    // Silent fail
  }
  
  return new Date();
};

/**
 * Check if a value is a Firestore Timestamp
 */
export const isTimestamp = (value: unknown): value is Timestamp => {
  return (
    value !== null &&
    typeof value === 'object' &&
    'toDate' in value &&
    typeof (value as Timestamp).toDate === 'function'
  );
};

/**
 * Convert a date string from an HTML date input to a Date at noon local time
 * This prevents timezone shifting issues where selecting "Nov 30" becomes "Nov 29"
 * 
 * @param dateString - Date string in format 'YYYY-MM-DD' from HTML date input
 * @returns Date object set to noon (12:00) local time on the selected date
 * 
 * @example
 * dateStringToLocalDate('2025-11-30') // Nov 30, 2025 12:00:00 (local time)
 */
export const dateStringToLocalDate = (dateString: string): Date => {
  const [year, month, day] = dateString.split('-').map(Number);
  // Create date at noon local time to avoid timezone issues
  return new Date(year, month - 1, day, 12, 0, 0);
};

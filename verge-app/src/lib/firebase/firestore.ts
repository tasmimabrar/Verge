/**
 * Firestore Helper Functions
 * 
 * Centralized functions for Firestore operations.
 * Used by Settings screen and other components that need direct Firestore access.
 */

import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './config';
import type { UserSettings } from '@/shared/types';

/**
 * Get user settings from Firestore
 */
export const getUserSettings = async (userId: string): Promise<UserSettings | null> => {
  try {
    const userDocRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userDocRef);
    
    if (userDoc.exists()) {
      const data = userDoc.data();
      return data.settings || null;
    }
    
    return null;
  } catch (error) {
    console.error('Error getting user settings:', error);
    throw error;
  }
};

/**
 * Update user settings in Firestore
 */
export const updateUserSettings = async (
  userId: string,
  settings: UserSettings
): Promise<void> => {
  try {
    const userDocRef = doc(db, 'users', userId);
    
    // Check if user document exists
    const userDoc = await getDoc(userDocRef);
    
    if (userDoc.exists()) {
      // Update existing document
      await updateDoc(userDocRef, {
        settings,
        updatedAt: serverTimestamp(),
      });
    } else {
      // Create new document
      await setDoc(userDocRef, {
        settings,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }
  } catch (error) {
    console.error('Error updating user settings:', error);
    throw error;
  }
};

import { useAuth } from './AuthContext';
import { Department } from './types';

/**
 * Convenience hook to get the current user's department.
 * Used throughout the app for theming and filtering.
 */
export function useDepartment(): Department | null {
  const { profile } = useAuth();
  
  if (!profile) {
    return null;
  }
  
  return profile.department;
}

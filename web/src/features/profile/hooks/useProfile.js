import { useAuthStore } from '@/store';

export const profileKeys = {
  all: () => ['profile'],
};

/**
 * useProfile
 *
 * The user object is already stored in useAuthStore from the
 * login / refresh flow. No extra API call needed.
 *
 * The shape is: { id, name, email, avatarUrl, createdAt, updatedAt, storageStats }
 */
export function useProfile() {
  const user = useAuthStore((s) => s.user);

  return {
    profile: user,
    isLoading: false,
    isError: false,
    error: null,
  };
}

export function useUpdateProfile() {
  // Placeholder — wire to a real API endpoint when the backend supports it.
  return {
    mutate: () => {},
    isPending: false,
  };
}

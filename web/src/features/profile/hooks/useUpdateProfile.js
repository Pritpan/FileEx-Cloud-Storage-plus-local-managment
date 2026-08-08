import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { profileService } from '../services/profile.service';
import { useAuthStore } from '@/store';

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  const setAuth = useAuthStore((state) => state.setAuth);
  
  return useMutation({
    mutationFn: profileService.updateProfile,
    onSuccess: (updatedUser) => {
      toast.success('Profile updated successfully');
      
      // We don't have the token in this hook easily, but setAuth expects both user and token.
      // Wait, we can just update the user in the auth store.
      useAuthStore.setState({ user: updatedUser });

      // Update query cache
      queryClient.setQueryData(['profile'], updatedUser);
    },
    onError: (error) => {
      const message = error?.response?.data?.error?.message || 'Failed to update profile';
      toast.error(message);
    }
  });
}

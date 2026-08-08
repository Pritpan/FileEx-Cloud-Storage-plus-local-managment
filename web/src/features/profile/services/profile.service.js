import api from '@/lib/axios';
import { AUTH } from '@/constants/api';

/**
 * profile.service.js
 *
 * Communicates with the backend Profile/Auth endpoints.
 */
export const profileService = {
  getProfile: async () => {
    const { data } = await api.get(AUTH.ME);
    // Backend returns: { success: true, data: { user: { id, name, email, createdAt } } }
    return data.data.user;
  },

  updateProfile: async (profileData) => {
    const { data } = await api.patch(AUTH.ME, profileData);
    return data.data.user;
  },
};

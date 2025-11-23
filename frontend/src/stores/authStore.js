import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authAPI, userAPI } from '../services/api';

const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      login: async (email, password) => {
        set({ isLoading: true, error: null });
        try {
          const response = await authAPI.login(email, password);
          const { access_token } = response.data;
          
          localStorage.setItem('access_token', access_token);
          
          // Fetch user profile
          const profileResponse = await userAPI.getProfile();
          
          set({
            token: access_token,
            user: profileResponse.data,
            isAuthenticated: true,
            isLoading: false,
          });
          
          return true;
        } catch (error) {
          set({
            error: error.response?.data?.detail || 'Login failed',
            isLoading: false,
          });
          return false;
        }
      },

      register: async (userData) => {
        set({ isLoading: true, error: null });
        try {
          const response = await authAPI.register(userData);
          const { access_token } = response.data;
          
          localStorage.setItem('access_token', access_token);
          
          const profileResponse = await userAPI.getProfile();
          
          set({
            token: access_token,
            user: profileResponse.data,
            isAuthenticated: true,
            isLoading: false,
          });
          
          return true;
        } catch (error) {
          set({
            error: error.response?.data?.detail || 'Registration failed',
            isLoading: false,
          });
          return false;
        }
      },

      logout: () => {
        localStorage.removeItem('access_token');
        set({
          user: null,
          token: null,
          isAuthenticated: false,
        });
      },

      updateUser: (userData) => {
        set({ user: { ...get().user, ...userData } });
      },

      clearError: () => {
        set({ error: null });
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        token: state.token,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

export default useAuthStore;
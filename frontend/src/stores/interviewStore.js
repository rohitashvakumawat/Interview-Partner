import { create } from 'zustand';
import { interviewAPI } from '../services/api';

const useInterviewStore = create((set, get) => ({
  currentInterview: null,
  interviews: [],
  isLoading: false,
  error: null,

  createInterview: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const response = await interviewAPI.create(data);
      set({
        currentInterview: response.data,
        isLoading: false,
      });
      return response.data;
    } catch (error) {
      set({
        error: error.response?.data?.detail || 'Failed to create interview',
        isLoading: false,
      });
      throw error;
    }
  },

  fetchInterviews: async (params) => {
    set({ isLoading: true, error: null });
    try {
      const response = await interviewAPI.getAll(params);
      set({
        interviews: response.data,
        isLoading: false,
      });
    } catch (error) {
      set({
        error: error.response?.data?.detail || 'Failed to fetch interviews',
        isLoading: false,
      });
    }
  },

  fetchInterview: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const response = await interviewAPI.getById(id);
      set({
        currentInterview: response.data,
        isLoading: false,
      });
      return response.data;
    } catch (error) {
      set({
        error: error.response?.data?.detail || 'Failed to fetch interview',
        isLoading: false,
      });
      throw error;
    }
  },

  startInterview: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const response = await interviewAPI.start(id);
      set({ isLoading: false });
      return response.data;
    } catch (error) {
      set({
        error: error.response?.data?.detail || 'Failed to start interview',
        isLoading: false,
      });
      throw error;
    }
  },

  respondToQuestion: async (id, data) => {
    set({ isLoading: true, error: null });
    try {
      const response = await interviewAPI.respond(id, data);
      set({ isLoading: false });
      return response.data;
    } catch (error) {
      set({
        error: error.response?.data?.detail || 'Failed to submit response',
        isLoading: false,
      });
      throw error;
    }
  },

  completeInterview: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const response = await interviewAPI.complete(id);
      set({
        currentInterview: null,
        isLoading: false,
      });
      return response.data;
    } catch (error) {
      set({
        error: error.response?.data?.detail || 'Failed to complete interview',
        isLoading: false,
      });
      throw error;
    }
  },

  deleteInterview: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await interviewAPI.delete(id);
      set({
        interviews: get().interviews.filter(i => i.id !== id),
        isLoading: false,
      });
    } catch (error) {
      set({
        error: error.response?.data?.detail || 'Failed to delete interview',
        isLoading: false,
      });
      throw error;
    }
  },

  clearError: () => set({ error: null }),
}));

export default useInterviewStore;
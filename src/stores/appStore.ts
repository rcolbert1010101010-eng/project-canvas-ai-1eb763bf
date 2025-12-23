import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AppState {
  currentProjectId: string | null;
  setCurrentProjectId: (id: string | null) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      currentProjectId: null,
      setCurrentProjectId: (id) => set({ currentProjectId: id }),
    }),
    {
      name: 'canvas-ai-storage',
    }
  )
);
